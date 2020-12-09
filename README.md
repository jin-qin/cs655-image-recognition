# **CS655 Image Recognition System**

## **Project Description**
The general purpose of this project is to implement an image recognition service (**scalable**) with a web interface. In our design, we plan to implement a server node which manages all jobs and schedules them to worker nodes.  Users will use the web interface to submit jobs to the service node and get results. In worker nodes, we will implement a worker service to interact with the server node and image recognition component. 

## **Motivation & learning outcomes**
* We want to learn how to build a **scalable**, **stable**, **fast**, **easy to use** image recognition system with **Restful APIs**.
* We can learn how to use **NodeJS** to build a http service, handle different types of requests (GET, POST(with binary file), DELETE etc.).
* We can learn how to build the **responsive** web interface as a **Single Page Application** (SPA) by using **React.js**.
* We can learn how to deploy a deep learning model.
* We can get familiar with **TypeScript** by using it to build all the JavaScript applications.

## **Assumptions**
* Maximum Query Per Second (QPS)
  * 100 QPS
* Users cannot attack our network, neither adding traffic nor disable the network.
* Users will not do stress testing on our APIs, they can only access the service from the web front-end user interface.


## **Main Features**
* Fully scalable system, you can add or remove any number of worker nodes at any time, the system will keep stable.
* Restful APIs.
* SPA implementation for the web interface.
* Fast prediction, beneifit of using MobileNet.
* Automatically reschedule a job if its worker is down.

## **Design & Setup**
* Setup diagram
  ![](./docs/Deployment%20Diagram.png)
* Environment & resources
  * Number of worker nodes: 4
  * Server node: Xen VM, Ubuntu 18.04 LTS, no GPUs, 1024MB RAM, 16G Hard Drive
  * Worker node: Xen VM, Ubuntu 18.04 LTS, no GPUs, 1024MB RAM, 16G Hard Drive
  * Link Bandwidth: 100Mbit/sec
  * Server’s language / framework: Node.js, TypeScript
  * Worker’s language / framework: Node.js, TypeScript, Python 3
  * Web interface’s language / framework: React.js, TypeScript
  * Relational database: Maria DB
  * Pre-trained image recognition model: MobileNet V2, since we do not have GPUs on our worker nodes.
  * Testing data set: [ILSVRC2012 validation images (first 100 images)](https://drive.google.com/file/d/1-X6t402uX-4Ol7EtszGdA7-_ywSstCV8/view?usp=sharing), since this data set cannot be published, so the download link here can only be accessible by Boston University members, log in your BU account to get it.

## **Execution & results**
* Configuration & usage
  * See [**Step-by-Step Instructions**](#step-by-step-instructions) below.
* Metrics, graphs and analysis
  * Metrics:
    * We measured the throughput (number of HTTP requests per second), goodput, accuracy, average job execution time over the loss rates = [0 , 0.067, 0.13, 0.2, 0.27, 0.33, 0.4, 0.47, 0.53, 0.6], and tested with 100 images per loss rate.
    * The loss rates were set on the link between client and the master node.
  * Graph: 
    ![](./tests/all_results.jpg)
  * Analysis: 
    * In the goodput graph, it indicates that with the loss rate increasing, goodput is smaller. When the loss rate gets larger, there are more packets lost during the transmission and then total time will increase. Thus, the goodput becomes smaller.
    * In the throughput graph, it also indicates that with the loss rate increasing, throughput is smaller. The reason is same as goodput.
    * In our project, we set timeout of http as 3 seconds. When loss rate is over 0.4, goodput becomes smaller than throughput, which means under this condition, there exists timeout http request. Thus, goodput will be smaller than throughput.
    * In average job execution time graph, we can see that verage job execution time changes in a small range, because the job execution time is not affected by the loss rate. 
    * In accracy graph, we can see that accracy changes a little when the loss rate get larger and changes start after loss rate reaching 0.4. Becuase as we mentioned above, when loss rate is over 0.4, there exists timeout requests, some job can not be submitted to worker and then the total number of photos tested decreased. Thus, the accracy will changes.
## **Conclusion and extensions**

Loss rate does significantly influence the goodput and throughput because if some job got lost, the valid request for image recognition will decrease and total request time will increase. However, the change in the loss rate doesn’t significantly affect the trend of average job execution time because it only takes valid jobs into account; the lost job won’t affect the normal execution of valid jobs. Also Loss rate doesn’t drastically affect the accuracy of image recognition, since accuracy only considers the result of recognizing valid jobs submitted, ignoring those lost jobs.


## **Working Demo Video**
TODO

## **Reproduce the results**
* Put `tests` directory into any machine which you want to perform testing procedure on.
* Setup the experiment environment.
  ```bash
  sudo bash ./tests/setup_tests.sh
  ```
* Run the testing script (**don't forget** to change the host address, port, images directory path inside the `start_test.py` file).
  ```bash
  python3 start_test.py
  ```
  This script will upload all the images in the images directory to the master server over the loss rates = [0 , 0.067, 0.13, 0.2, 0.27, 0.33, 0.4, 0.47, 0.53, 0.6], it will suspend after finishing each testing turn on each loss rate, after you setting up the loss rate on the link, manually press any key to continue the next turn.
* Generate the plots from the testing results.
  ```bash
  pyton3 gen_plots.py
  ```

## **Future Work**
Though we did a great job, due to the limited time, there are still many points that we can improve this system:
* Containerize the model prediction component.
* Consider the security circumstance, add the credential feature.
* Add the user system.
* Add the admin dashboard to display statistics.
* Submit multiple jobs (images) at one time.
* Design or find a better cluster management system to monitor each worker's and master's statistics, also, provide a interface to add worker automatically instead of in a manually way.
* Give a better UX design.
* ...

## **Conclusion**

## **Division of Labor**
* Server (Jing)
  * Front-end web user interface
  * Back-end job manager
  * Back-end RESTful APIs
  * Database design
* Worker (Shuo)
  * Worker service
  * Worker registration
  * Callback to server
  * Model deployment
* Testing (Tian, Yujue)
  * Get the testing data set
  * Write scripts to test all the images automatically
  * Gather testing results
  * Data visualization(Tian, Yujue)
* Project report (Tian, Shuo, Jing, Yujue)


## **Master Server API documentation**

[Master Server API documentation](./master/server/README.md)

## **Worker Server API documentation**

[Worker Server API documentation](./worker/server/README.md)

## **Step-by-Step Instructions**
* Clone codes into the **master** node and the **worker** nodes.
  * `git clone https://github.com/jin-qin/cs655-image-recognition.git`
* Set up MariaDB in the **master** node
  * Install MariaDB\
    [View the official documentation](https://downloads.mariadb.org/mariadb/repositories/#distro=Ubuntu&distro_release=bionic--ubuntu_bionic&mirror=pcextreme&version=10.5)
    ```
    sudo apt-get install software-properties-common
    sudo apt-key adv --fetch-keys 'https://mariadb.org/mariadb_release_signing_key.asc'
    sudo add-apt-repository 'deb [arch=amd64,arm64,ppc64el] https://mariadb.mirror.pcextreme.nl/repo/10.5/ubuntu bionic main'

    sudo apt update
    sudo apt install mariadb-server
    ```
  * Setup DB user and password
    * Username: **test**
    * Password: **test**
    * Change this info. in **master** server config file: [app-config-prod.json](./master/server/src/config/app-config-prod.json)
  * Create a new database:
    * Database name: **img_recog**
    * Change this info. in **master** server config file: [app-config-prod.json](./master/server/src/config/app-config-prod.json)
* Setup master node environment:
  * `./master/setup_master.sh`
* Setup worker nodes environments:
  * `./worker/setup_worker.sh`
* Set your master node's port (default is 5000) and Database host address (we simply put the database inside the master node), you can set them in **master** server config file: [app-config-prod.json](./master/server/src/config/app-config-prod.json)
* Build & Run **master** node first:
  ```bash
  ./master/build_master.sh
  ./master/run_master.sh
  ```
* Build & Run **worker** nodes:
  ```bash
  ./worker/build_worker.sh
  ./worker/run_worker.sh
  ```

## **How to use**
* Open your browser
* Type in the master server's address followed by the port number 5000
* You will see a Job Board first.
* You can submit a job by click the blue `SUBMIT A NEW JOB` button.
* You can choose an image from your local machine.
* Click `SUBMIT`
* Back to the Job Board and wait for the result.
## **Demo**
### **Job Board**
<!-- ![](./docs/demos/demo-job-board.gif) -->

### **Job Submit**
<!-- ![](./docs/demos/demo-job-submit.gif) -->