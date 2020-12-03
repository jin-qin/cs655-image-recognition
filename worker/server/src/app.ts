import Koa from 'koa';
import config from './config/app-config.json';
import bodyParser from 'koa-bodyparser';
import {register_node} from './master_callback';
import JobExecutor from './job_executor';

register_node();

const app = new Koa();
const job_executor = new JobExecutor();

app.use(bodyParser())
   .use(job_executor.get_router().routes())
   .use(job_executor.get_router().allowedMethods());

const port  = config.app.listen_port;
app.listen(port, () => {
    console.log('server is listenning on ',port);
});

// handle ctrl+c signal in terminal
process.on('SIGINT', () => {
    console.log('Server terminated');
    process.exit(1);
});
