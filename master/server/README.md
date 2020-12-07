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
  * return example:
  ```
  {
      "result": "success",
      "data":
      {
          "job_id": "23bfbad2-a529-4bb4-b3c8-224a886e20be",
          "worker_id": null,
          "status": "QUEUED",
          "submit_time": "2020-12-05T01:30:17.070Z",
          "finish_time": null,
          "result": null,
          "img_name": "8b69bad9-ef6c-446f-81c8-6b69d0bc1eee.jpg"
      }
  }
  ```
* GET `/jobs/all`
  * description: get the details of all the jobs.
  * status code: `200` (success) | `400` (error)
  * return `{ "result": "success|error", "data": "empty if no jobs" }`
  * return example:
  ```
  {
      "result": "success",
      "data":
      [
      {
          "job_id": "23bfbad2-a529-4bb4-b3c8-224a886e20be",
          "worker_id": null,
          "status": "QUEUED",
          "submit_time": "2020-12-05T01:30:17.070Z",
          "finish_time": null,
          "result": null,
          "img_name": "8b69bad9-ef6c-446f-81c8-6b69d0bc1eee.jpg"
      },
      {
          "job_id": "4a22886e-4bb4-b3c8-3bc8-4a82286e20be",
          "worker_id": null,
          "status": "QUEUED",
          "submit_time": "2020-12-04T01:30:17.070Z",
          "finish_time": null,
          "result": null,
          "img_name": "8b69bad9-ef6c-446f-81c8-6b69d0bc1ebc.jpg"
      }
      ]
  }
  ```
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
