# WORKER

## **MODEL Prerequisites**

### model get 
git clone https://github.com/Shirhe-Lyh/mobilenet_v3

### pip3 
version 20.2.4

### Pytorch
pip3 install torch==1.7.0+cpu torchvision==0.8.1+cpu torchaudio==0.7.0 -f https://download.pytorch.org/whl/torch_stable.html

### Tensorflow
pip3 install tensorflow==1.14.0

### Opencv
sudo pip3 install opencv-python

### libgl1 upgrade
Sudo apt update
Sudo apt install libgl1-mesa-glx

### Checkpoint example
wget https://storage.googleapis.com/mobilenet_v3/checkpoints/v3-large_224_1.0_float.tgz

### How to run 
python3 tf_weights_to_pth.py --tf_checkpoint_path xxx/v3-large_224_1.0_float/ema/model-540000 --image_path ./test/cat.jpg
