import { v4 as uuidv4 } from 'uuid';
import Koa from 'koa';
import Router from '@koa/router';
import config from './config/app-config.json';
import sql_cmds from './config/sql_cmds.json'
import DBHelper from './util/db_helper';
import {get_date_time} from './util/misc';

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
    
    constructor() {
        this.router = new Router({
            'prefix': '/jobs'
        });
        this.max_num_worker = config.app.maximum_worker;
        this.cur_num_worker = 0;
        this.setup_routes();
        this.check_create_job_queue_table();
    }

    public get_router() {
        return this.router;
    }

    public routes() {
        return this.router.routes;
    }

    public allowed_methods() {
        return this.router.allowedMethods();
    }

    private setup_routes() {
        // client call this api to get a specific job's data
        this.router.get('/item/:id', async (ctx: Koa.Context) => {
            const ret = await this.get_job(ctx.params.id);
            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'result': ret.result, 'status': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`get job failed due to ${ret.result}`)
            }
        });
        
        // client call this api to get all jobs data
        this.router.get('/all', async (ctx: Koa.Context) => {
            const ret = await this.get_all_jobs();
            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'result': ret.result, 'status': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`get all jobs failed due to ${ret.result}`)
            }
        });
        
        // client call this api to submit a new job
        this.router.post('/submit', async (ctx: Koa.Context) => {
            const job_id = this.gen_job_id();
            
            const ret = await this.enqueue_job(job_id);
            if (ret.success) {
                ctx.status = 201;
                ctx.body = { 'id': job_id };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`enqueue job failed due to ${ret.result}`)
            }
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
                ctx.body = { 'status': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`update job failed due to ${ret.result}`)
            }
        });
        
        // client call this api to delete a job
        this.router.del('/del/:id', async (ctx: Koa.Context) => {
            const ret = await this.delete_jobs([ctx.params.id]);

            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'status': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`delete job failed due to ${ret.result}`)
            }
        });
        
        // client call this api to delete all jobs
        this.router.del('/clear', async (ctx: Koa.Context) => {
            const ret = await this.clear_jobs();

            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'status': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'status': 'error' };
                console.warn(`clear jobs failed due to ${ret.result}`)
            }
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

    private async get_all_jobs(){
        return await DBHelper.query(sql_cmds.jobs.get_all_jobs);
    }

    private async enqueue_job(job_id: string) {
        const job_status = JobStatus.QUEUED
        return await DBHelper.query(sql_cmds.jobs.insert_job, [[job_id, job_status, get_date_time()]]);
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

    private async schedule_job() {
        // TODO, schedule a job to a worker.
    }

    private gen_job_id(): string {
        return uuidv4();
    }
}

export default JobManager;