# **CS655 Image Recognition System**

## **Project Description**
The general purpose of this project is to implement an image recognition service (**scalable**) with a web interface. In our design, we plan to implement a server node which manages all jobs and schedules them to worker nodes.  Users will use the web interface to submit jobs to the service node and get results. In worker nodes, we will implement a worker service to interact with the server node and image recognition component. 

## **Motivation & learning outcomes**
* We want to learn how to build a **scalable**, **stable**, **fast**, **easy to use** image recognition system with **Restful APIs**.
* We can learn how to use **NodeJS** to build a http service, handle different types of requests (GET, POST(with binary file), DELETE etc.).
* We can learn how to build the **responsive** web interface as a **Single Page Application** (SPA) by using **React.js**.
* We can learn how to deploy a deep learning model.
* We can get familiar with **TypeScript** by using it to build all the JavaScript applications.

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
  * Testing data set: [ILSVRC2012 validation images (first 1000 images)](https://drive.google.com/file/d/1-X6t402uX-4Ol7EtszGdA7-_ywSstCV8/view?usp=sharing), since this data set cannot be published, so the download link here can only be accessible by Boston University members, log in your BU account to get it.

## **Execution & results**
* Configuration & usage
  * See **Step-by-Step Instructions** below.
* Metrics, graphs and analysis
  * TO DO

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

## **Experiments**

## **Demo**
### **Job Board**
<!-- ![](./docs/demos/demo-job-board.gif) -->

### **Job Submit**
<!-- ![](./docs/demos/demo-job-submit.gif) -->