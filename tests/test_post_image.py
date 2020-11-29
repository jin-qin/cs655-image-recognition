import requests

url = 'http://pcvm3-23.instageni.cenic.net:5000/jobs/submit'
files = {'image': open('test_img.jpg', 'rb')}
rsp = requests.post(url, files=files)
print(rsp.text)