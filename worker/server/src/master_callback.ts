import Koa from 'koa';
import fetch from 'node-fetch';
import config from './config/app-config.json';

export async function register_node() {
    const ip = config.app.master_server_addr;
    const port = config.app.master_server_port;
    const data = JSON.stringify({
        port: config.app.listen_port
    });
    
    const rsp = await fetch(`http://${ip}:${port}/nodes/register`, {
                            method: 'POST',
                            body: data,
                            headers: { 'Content-Type': 'application/json' }
                            });
    const rsp_data = await rsp.json();
    if (rsp.status == 200) {
        return {success: true, result: rsp_data};
    } else {
        return {success: false, result: rsp_data};
    }
}

export async function update_job_result(
    job_id: string,
    job_status: string,
    job_finish_time: string,
    job_result: string) {
    
    const ip = config.app.master_server_addr;
    const port = config.app.master_server_port;

    const data = JSON.stringify({
        job_id: job_id,
        job_status: job_status,
        job_finish_time: job_finish_time,
        job_result: job_result
    });

    console.log(data)

    const rsp = await fetch(`http://${ip}:${port}/jobs/update`, {
                            method: 'PUT', 
                            body: data, 
                            headers: { 'Content-Type': 'application/json' }
                            });
    const rsp_data = await rsp.json();
    if (rsp.status == 200) {
        return {success: true, result: rsp_data};
    } else {
        return {success: false, result: rsp_data};
    }
}