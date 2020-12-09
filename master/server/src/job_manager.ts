import { v4 as uuidv4 } from 'uuid';
import Koa from 'koa';
import Router from '@koa/router';
import config from './config/app-config.json';
import sql_cmds from './config/sql-cmds.json';
import synset_map from './data/sysnet_map.json';
import DBHelper from './util/db_helper';
import {get_date_time, get_timestamp, date2timestamp} from './util/misc';
import multer, { MulterIncomingMessage } from 'koa-multer';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data'; 

enum JobStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
}

enum WorkerStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    ERROR = "ERROR",
    STOPPED = "STOPPED",
}

class JobManager {
    private router: Router;
    private upload: multer.Instance;

    private interval_timer!: NodeJS.Timeout;
    private JOB_TIMEOUT = 10; // job timeout, seconds
    
    constructor() {
        this.router = new Router({
            'prefix': '/jobs'
        });
        const storage = multer.diskStorage({
            destination: (_req, _file, cb) => {
                fs.mkdirSync(config.app.upload_dir, { recursive: true })
                cb(null, config.app.upload_dir)
            },
            filename: (_req, file, cb) => {
                cb(null, uuidv4() + path.extname(file.originalname))
            }
        });
        
        this.upload = multer({ storage: storage });

        this.setup_timer();
        this.setup_routes();
        this.check_create_job_queue_table();
    }

    public get_router() {
        return this.router;
    }

    public terminate() {
        clearInterval(this.interval_timer);
    }

    private setup_timer() {
        this.interval_timer = setInterval(async () => {
            await this.poll_worker_status();
            await this.reset_timeout_jobs();
            await this.schedule_next_job();
        }, 500);
    }

    private async poll_worker_status() {
        const ret = await this.get_all_workers();
        if (!ret.success) {
            console.warn(`failed to get all worker records due to ${ret.result}`);
            return;
        }

        for (let row of ret.result) {
            fetch(`http://${row.ip_addr}:${row.port}/status`)
                .then(rsp => rsp.json())
                .then(json_data => {
                    this.update_worker(json_data.status, row.ip_addr);
                })
                .catch(err => {
                    console.warn(`cannot get the worker status due to ${err}`);
                    this.update_worker(WorkerStatus.ERROR, row.ip_addr);
                });
        }
    }

    private async reset_timeout_jobs() {
        const ret = await this.get_running_jobs();
        if (!ret.success) {
            console.warn(`reset_timeout_jobs: failed to get running jobs due to ${ret.result}`);
            return;
        }

        let jobs_id : string[] = [];
        for (let job of ret.result) {
            const duration = get_timestamp() - date2timestamp(job.schedule_time);
            if (duration >= this.JOB_TIMEOUT * 1000) {
                console.log(`reset_timeout_jobs:: found timeout job: ${job.job_id}, job elapses: ${duration} ms`);
                jobs_id.push(job.job_id);
            }
        }

        if (jobs_id.length <= 0) return;

        const ret_reset = await this.reset_jobs(jobs_id);
        if (!ret_reset.success) {
            console.warn(`reset_timeout_jobs: failed to reset jobs due to ${ret.result}`);
            return;
        }
    }

    private async schedule_next_job() {
        const {success, job_id, img_name, msg} = await this.get_queued_job();
        if (!success) return;

        await this.schedule_job(job_id, config.app.upload_dir + img_name);
    }

    private setup_routes() {
        // client call this api to get a specific job's data
        this.router.get('/item/:id', async (ctx: Koa.Context) => {
            const ret = await this.get_job(ctx.params.id);
            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'data': ret.result, 'result': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`get job failed due to ${ret.result}`)
            }
        });
        
        // client call this api to get all jobs data
        this.router.get('/all', async (ctx: Koa.Context) => {
            const ret = await this.get_all_jobs();
            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'data': ret.result, 'result': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`get all jobs failed due to ${ret.result}`)
            }
        });

        // client call this api to check if all the jobs finished
        this.router.get('/all_finished', async (ctx: Koa.Context) => {
            const ret = await this.check_all_jobs_finished();
            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'result': 'success', 'finished': ret.finished };
            } else {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`get all jobs finished status failed due to ${ret.msg}`)
            }
        });
        
        // client call this api to submit a new job
        this.router.post('/submit', this.upload.single('image'), async (ctx: Koa.Context) => {
            const { file } = (ctx.req as any);
            if (file.size <= 0) {
                ctx.status = 400;
                ctx.body = { 'result': 'error', 'msg': 'empty file is not acceptable.'};

                fs.unlink(config.app.upload_dir + file.filename, (err) => {
                    if (err != null) console.warn(err);
                });

                return;
            }

            const job_id = this.gen_job_id();

            const ret = await this.enqueue_job(job_id, file.filename);
            if (!ret.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error', 'msg': 'failed to enqueue the job!'};
                console.warn(`enqueue job failed due to ${ret.result}`);
                return;
            }

            ctx.status = 201;
            ctx.body = { 'result': 'success', 'id': job_id };
        });
        
        // worker will call this callback api to update job's data
        this.router.put('/update', async (ctx: Koa.Context) => {
            const params = ctx.request.body;
            const ret = await this.update_job_result(params.job_id,
                                                     params.job_status,
                                                     params.job_finish_time,
                                                     params.job_result);
            
            const worker_ip = ctx.request.ip.replace('::ffff:', '');
            await this.update_worker(WorkerStatus.IDLE, worker_ip);

            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'result': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`update job failed due to ${ret.result}`)
            }
        });
        
        // client call this api to delete a job
        this.router.del('/del/:id', async (ctx: Koa.Context) => {
            const ret_get = await this.get_jobs([ctx.params.id]);
            if (!ret_get.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`get jobs failed due to ${ret_get.result}`)
                return;
            }
            
            for (let job of ret_get.result) {
                fs.unlink(config.app.upload_dir + job.img_name, (err) => {
                    if (err != null) console.warn(err);
                });
            }

            const ret_del = await this.delete_jobs([ctx.params.id]);
            if (!ret_del.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`delete job failed due to ${ret_del.result}`)
                return;
            }

            ctx.status = 200;
            ctx.body = { 'result': 'success' };
        });
        
        // client call this api to delete all jobs
        this.router.del('/clear', async (ctx: Koa.Context) => {
            const ret_get = await this.get_all_jobs();
            if (!ret_get.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`get jobs failed due to ${ret_get.result}`)
                return;
            }
            
            for (let job of ret_get.result) {
                fs.unlink(config.app.upload_dir + job.img_name, (err) => {
                    if (err != null) console.warn(err);
                });
            }

            const ret = await this.clear_jobs();
            if (!ret.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`clear jobs failed due to ${ret.result}`)
                return;
            }

            ctx.status = 200;
            ctx.body = { 'result': 'success' };
        });
    }

    private async check_create_job_queue_table() {
        const ret = await DBHelper.query(sql_cmds.jobs.create_job_queue);

        if (ret.success) {
            console.log('check creating job queue table successfully.');
        } else {
            console.warn(`check creating job queue table failed due to ${ret.result}`);
        }
    }

    private async get_job(job_id: string) {
        return await DBHelper.query(sql_cmds.jobs.get_job, [job_id]);
    }

    private async get_jobs(job_ids: string[]) {
        return await DBHelper.query(sql_cmds.jobs.get_jobs, [job_ids]);
    }

    private async get_all_jobs() {
        return await DBHelper.query(sql_cmds.jobs.get_all_jobs);
    }

    private async check_all_jobs_finished() {
        const ret = await DBHelper.query(sql_cmds.jobs.get_jobs_no_finish);
        if (ret.success) {
            return { success: true,  finished: ret.result.length <= 0, msg: '' }
        }
        return { success: false, finished: null,  msg: ret.result }
    }

    private async enqueue_job(job_id: string, img_name: string) {
        const job_status = JobStatus.QUEUED
        return await DBHelper.query(sql_cmds.jobs.insert_job, [[job_id, job_status, get_date_time(), img_name]]);
    }

    private async update_job_result(
        job_id: string, job_status: string, 
        job_finish_time: string, job_result: string) {
        return await DBHelper.query(sql_cmds.jobs.update_job, [job_status, job_finish_time, job_result, synset_map[job_result].desc, job_id]);
    }

    private async update_job_worker(job_id: string, status: string, worker_id: string, schedule_time: string) {
        return await DBHelper.query(sql_cmds.jobs.update_job_worker, [worker_id, schedule_time, status, job_id]);
    }

    private async delete_jobs(job_ids: string[]) {
        return await DBHelper.query(sql_cmds.jobs.delete_jobs, [job_ids]);
    }

    private async clear_jobs() {
        return await DBHelper.query(sql_cmds.jobs.clear_jobs);
    }

    // schedule a job to a worker
    private async schedule_job(job_id: string, img_path: string) {
        const {success, worker_id, ip, port, msg} = await this.get_idle_worker();
        if (!success) {
            return {success: false, result: msg};
        }

        console.log(`schedule ${job_id} to worker ${worker_id} on image ${img_path}`);

        const form = new FormData();
        form.append('job_id', job_id);
        form.append('image', fs.createReadStream(img_path));

        const rsp = await fetch(`http://${ip}:${port}/schedule`, {method: 'POST', body: form});
        const rsp_data = await rsp.json();
        if (rsp.status == 201) {
            const schedule_time = get_date_time();
            this.update_job_worker(job_id, JobStatus.RUNNING, worker_id, schedule_time);
            return {success: true, result: rsp_data};
        }

        return {success: false, result: rsp_data};
    }

    private async get_idle_worker() {
        const ret = await DBHelper.query(sql_cmds.workers.get_idle_worker);
        if (!ret.success || ret.result.length <= 0) {
            return {success: false, ip: '', port: '', msg: 'no available worker'};
        }

        return {success: true, worker_id: ret.result[0].worker_id, ip: ret.result[0].ip_addr, port: ret.result[0].port, msg: ''};
    }

    private async update_worker(status: string, ip: string) {
        const ret = await DBHelper.query(sql_cmds.workers.update_worker, [status, ip]);
        if (!ret.success) {
            return {success: false};
        }

        return {success: true};
    }

    private async get_all_workers() {
        return await DBHelper.query(sql_cmds.workers.get_all_workers);
    }

    private async get_queued_job() {
        const ret = await DBHelper.query(sql_cmds.jobs.get_queued_job);
        if (!ret.success || ret.result.length <= 0) {
            return {success: false, job_id: '', img_path: '', msg: ret.success ? 'no queued job' : ret.result};
        }

        return {success: true, job_id: ret.result[0].job_id, img_name: ret.result[0].img_name, msg: ''};
    }

    private async get_running_jobs() {
        return await DBHelper.query(sql_cmds.jobs.get_running_jobs);
    }

    private async reset_jobs(job_ids: string[]) {
        return await DBHelper.query(sql_cmds.jobs.reset_jobs, [job_ids]);
    }

    private gen_job_id(): string {
        return uuidv4();
    }
}

export default JobManager;