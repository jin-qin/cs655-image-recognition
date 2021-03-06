import Koa from 'koa';
import serve from 'koa-static';
import JobManager from './job_manager';
import WorkerManager from './worker_manager';
import DBHelper from './util/db_helper';
import config from './config/app-config.json';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

const app = new Koa();
const job_mgr = new JobManager();
const worker_mgr = new WorkerManager();

app.use(bodyParser())
   .use(cors())
   .use(job_mgr.get_router().routes())
   .use(job_mgr.get_router().allowedMethods())
   .use(worker_mgr.get_router().routes())
   .use(worker_mgr.get_router().allowedMethods())
   .use(serve(__dirname + '/public'))
   .use(serve(__dirname + '/uploads'));

const port  = config.app.listen_port;
app.listen(port, () => {
    console.log('server is listenning on ',port);
});

// handle ctrl+c signal in terminal
process.on('SIGINT', () => {
    DBHelper.close_db_conn();
    job_mgr.terminate();
    console.log('Server terminated');
    process.exit(1);
});
