# **SERVER**

## **BUILD**
run `yarn build` in the root directory.

## **RUN**

### **Development**
run `yarn start-dev` in the root directory.

### **Production**
run `yarn start-prod` in the root directory.

## **API definitions**
* GET `/jobs/item/:id`
  * description: get the details of a specific job by `:id`.
  * status code: `200` (success) | `400` (error)
  * return `{ "result": "success|error", "data": "empty if id not exists" }`
* GET `/jobs/all`
  * description: get the details of all the jobs.
  * status code: `200` (success) | `400` (error)
  * return `{ "result": "success|error", "data": "empty if no jobs" }`
* POST `/jobs/submit`
  * description: get the details of a specific job by `:id`.
  * POST header: multipart/form-data
  * POST body: "image": image binary data.
  * status code: `201` (success) | `400` (error)
  * return `{ "result": "success|error", "msg": "error message",  "id": "job id if success"}`
* POST `/jobs/update`
  * description: update a job's status, finish time, and result.
  * POST header: application/json
  * POST body: 
    ```
    {
        "job_id": <job id>, 
        "job_status": <job status>, 
        "job_finish_time": <job finish time>, 
        "job_result": <job result>
    }
    ```
  * status code: `200` (success) | `400` (error)
  * return  `{ "result": "success|error"}`
* DELETE `/jobs/del/:id`
  * description: delete a specific job by `:id`.
  * status code: `200` (success) | `400` (error)
  * return `{ "result": "success|error"}`
* DELETE `/jobs/clear`
  * description: delete all the jobs
  * status code: `200` (success) | `400` (error)
  * return `{ "result": "success|error"}`
* POST `/nodes/register`
  * description: egister a new worker by its ip.
  * POST header: application/json
  * POST body: 
    ```
    {
        "worker_ip": <the worker's IP address>
    }
    ```
  * status code: `200` (success) | `400` (error)
  * return  `{ "result": "success|error"}`