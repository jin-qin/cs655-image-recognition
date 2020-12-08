# WORKER

## **MODEL Prerequisites**
```
sudo apt install -y python3-pip
sudo pip3 install torch==1.7.0+cpu torchvision==0.8.1+cpu torchaudio==0.7.0 -f https://download.pytorch.org/whl/torch_stable.html
```

### How to run 
`python3 run_mobilenet_v2.py ./test/cat.jpg`

## **API definitions**
* POST `/schedule`
  * description: update a job's status, finish time, and result.
  * POST header: multipart/form-data
  * Include the image binary data into the request
  * POST body: 
    ```
    {
        "job_id": <job id>
    }
    ```
  * status code: `201` (success) | `400` (error)
  * return  `{ "result": "success|error", "msg": "scheduled" | "empty file is not acceptable."}`
* GET `/status`
  * description: get the status of the worker.
  * status code: `200` (success)
  * return `{ "result": "success", "status": "BUSY | IDLE" }`