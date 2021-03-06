import Koa from 'koa';
import Router from '@koa/router';
import multer from 'koa-multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {spawn} from 'child_process';
import config from './config/app-config.json';
import {update_job_result} from './master_callback';
import {get_date_time} from './util/misc';

enum WorkerStatus {
    IDLE = "IDLE",
    BUSY = "BUSY",
    ERROR = "ERROR",
    STOPPED = "STOPPED",
}

enum JobStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
}

class JobExecutor {
    private router: Router;
    private upload: multer.Instance;
    private is_busy = false;

    public get_router() {
        return this.router;
    }

    constructor() {
        this.router = new Router();
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
    }

    private setup_routes() {
        this.router.post('/schedule', this.upload.single('image'), async (ctx: Koa.Context) => {
            const { body } = (ctx.req as any);

            console.log(`schedule: request for scheduling job: ${body.job_id}`);

            const { file } = (ctx.req as any);
            if (file.size <= 0) {
                ctx.status = 400;
                ctx.body = { 'result': 'error', 'msg': 'empty file is not acceptable.'};

                fs.unlink(config.app.upload_dir + file.filename, (err) => {
                    if (err != null) console.warn(err);
                });

                return;
            }

            if (this.is_busy) {
                ctx.status = 400;
                ctx.body = { 'result': 'error', 'msg': 'worker is busy'};

                fs.unlink(config.app.upload_dir + file.filename, (err) => {
                    if (err != null) console.warn(err);
                });
                return;
            }

            console.log(`schedule: valid job`);

            this.execute_job(body.job_id, file.path);

            ctx.status = 201;
            ctx.body = { 'result': 'success', 'msg': 'scheduled' };
        });

        this.router.get('/status', async (ctx: Koa.Context) => {
            ctx.status = 200;
            ctx.body = { 'result': 'success', 'status': this.is_busy ? WorkerStatus.BUSY : WorkerStatus.IDLE };
        });
    }

    private async execute_job(job_id: string, img_path: string) {
        this.is_busy = true;

        console.log(`executing job ${job_id}, image: ${img_path}, busy: ${this.is_busy ? WorkerStatus.BUSY : WorkerStatus.IDLE}`);

        const prc = spawn('python3',  [config.app.model_runner, img_path]);
    
        prc.stdout.setEncoding('utf8');
        
        prc.stdout.on('data', (data) => {
            const result =  parseInt(data);
            update_job_result(job_id, result != -1 ? JobStatus.SUCCESS : JobStatus.ERROR, get_date_time(), `${result}`);
        });

        prc.on('close', (code) => {
            this.is_busy = false;

            fs.unlink(img_path, (err) => {
                if (err != null) console.warn(err);
            });

            if (code == 0) { return; }
        });
    }
}

export default JobExecutor;