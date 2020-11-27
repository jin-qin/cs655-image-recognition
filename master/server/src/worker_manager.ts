import Koa from 'koa';
import Router from '@koa/router';
import sql_cmds from './config/sql-cmds.json'
import DBHelper from './util/db_helper';
import { v4 as uuidv4 } from 'uuid';

enum WorkerStatus {
    STARTING = "STARTING",
    RUNNING = "RUNNING",
    ERROR = "ERROR",
    STOPPED = "STOPPED",
}

class WorkerManager {
    private router: Router;
    constructor() {
        this.router = new Router({
            'prefix': '/nodes'
        });
        this.setup_routes();
        this.check_create_worker_queue_table();
    }

    public get_router() {
        return this.router;
    }

    private setup_routes() {
        // worker call this api to register itself into the master
        this.router.post('/register', async (ctx: Koa.Context) => {
            const params = ctx.request.body;
            const worker_id = this.gen_worker_id();
            const ret = await this.register_worker(worker_id, params.worker_ip);

            if (ret.success) {
                ctx.status = 200;
                ctx.body = { 'id': worker_id, 'result': 'success' };
            } else {
                ctx.status = 400;
                ctx.body = { 'result': 'error' };
                console.warn(`register worker node failed due to ${ret.result}`)
            }
        });
    }

    private async check_create_worker_queue_table() {
        const ret = await DBHelper.query(sql_cmds.workers.create_worker_queue);

        if (ret.success) {
            console.log('check creating worker queue table successfully.');
        } else {
            console.warn(`check creating worker queue table failed due to ${ret.result}`);
        }
    }

    private async register_worker(worker_id: string, worker_ip: string) {
        const is_worker_exists = await this.check_worker_exists(worker_ip);
        if (is_worker_exists) {
            return { result: `${worker_ip} is existed`, success: false};
        }

        return await DBHelper.query(sql_cmds.workers.insert_worker, [[worker_id, worker_ip, WorkerStatus.STARTING]]);
    }

    private async check_worker_exists(worker_ip: string) {
        const ret = await DBHelper.query(sql_cmds.workers.get_worker, [worker_ip]);
        
        if (ret.success) {
            return ret.result.length > 0;
        }

        console.warn(`get worker data failed due to ${ret.result}`);
        return 0;
    }

    private gen_worker_id(): string {
        return uuidv4();
    }
}

export default WorkerManager;