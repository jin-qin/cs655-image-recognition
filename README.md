# **CS655 Image Recognition System**

## **Master Server API documentation**

[Master Server API documentation](./master/server/README.md)

## **Worker Server API documentation**

[Worker Server API documentation](./worker/server/README.md)

## **Step-by-Step Instructions**
* Clone codes into the **master** node and the **worker** nodes.
  * `git clone https://github.com/jin-qin/cs655-image-recognition.git`
  * Or download from [master](https://github.com/jin-qin/cs655-image-recognition/releases/download/v1.0.0/master-v1.0.0.tgz), [worker](https://github.com/jin-qin/cs655-image-recognition/releases/download/v1.0.0/worker-v1.0.0.tgz)
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

## **Demo**
### **Job Board**
<!-- ![](./docs/demos/demo-job-board.gif) -->

### **Job Submit**
<!-- ![](./docs/demos/demo-job-submit.gif) -->