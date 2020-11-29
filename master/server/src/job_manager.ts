import { v4 as uuidv4 } from 'uuid';
import Koa from 'koa';
import Router from '@koa/router';
import config from './config/app-config.json';
import sql_cmds from './config/sql-cmds.json'
import DBHelper from './util/db_helper';
import {get_date_time} from './util/misc';
import multer, { MulterIncomingMessage } from 'koa-multer';
import path from 'path';
import fs from 'fs';

enum JobStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
}

class JobManager {
    private router: Router;
    private max_num_worker: number;
    private cur_num_worker: number;
    private upload: multer.Instance;
    
    constructor() {
        this.router = new Router({
            'prefix': '/jobs'
        });
        this.max_num_worker = config.app.maximum_worker;
        this.cur_num_worker = 0;
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

        this.setup_routes();
        this.check_create_job_queue_table();
    }

    public get_router() {
        return this.router;
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
                ctx.body = { 'status': 'error' };
                console.warn(`get all jobs failed due to ${ret.result}`)
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

            const ret_schedule = await this.schedule_job(job_id);
            if (!ret_schedule.success) {
                ctx.status = 400;
                ctx.body = { 'result': 'error', 'msg': 'failed to schedule the job!'};
                console.warn(`schedule job failed due to ${ret_schedule.result}`);
                return;
            }

            ctx.status = 201;
            ctx.body = { 'result': 'success', 'id': job_id };
        });
        
        // worker will call this callback api to update job's data
        this.router.put('/update', async (ctx: Koa.Context) => {
            const params = ctx.request.body;
            const ret = await this.update_job(params.job_id,
                                              params.job_status,
                                              params.job_finish_time,
                                              params.job_result);

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

    private async get_all_jobs(){
        return await DBHelper.query(sql_cmds.jobs.get_all_jobs);
    }

    private async enqueue_job(job_id: string, img_name: string) {
        const job_status = JobStatus.QUEUED
        return await DBHelper.query(sql_cmds.jobs.insert_job, [[job_id, job_status, get_date_time(), img_name]]);
    }

    private async update_job(
        job_id: string, job_status: string, 
        job_finish_time: string, job_result: string) {
        return await DBHelper.query(sql_cmds.jobs.update_job, [job_status, job_finish_time, job_result, job_id]);
    }

    private async delete_jobs(job_ids: string[]) {
        return await DBHelper.query(sql_cmds.jobs.delete_jobs, [job_ids]);
    }

    private async clear_jobs() {
        return await DBHelper.query(sql_cmds.jobs.clear_jobs);
    }

    private async schedule_job(job_id: string) {
        // TODO, schedule a job to a worker.

        return {success: true, result: ''};
    }

    private gen_job_id(): string {
        return uuidv4();
    }
}

export default JobManager;