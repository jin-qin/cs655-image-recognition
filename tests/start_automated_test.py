import os
import requests
import json

import dateutil.parser
import time
import matplotlib
import matplotlib.pyplot as plt
import numpy as np

IMG_DIR = '/opt/client/data/val_img'

def date2ts(iso_date):
    '''
    parse date format like '2020-12-08T11:39:47.110Z' to a timestamp
    '''
    dt = dateutil.parser.isoparse(iso_date)
    return int(time.mktime(dt.timetuple()))

def test_code(imgs_paths):
    '''
    run testing logics
    try uploading all images inside imgs_paths
    '''
    valid_http_req = 0
    total_req = len(imgs_paths)

    # set maxmimum http pool size
    sess = requests.Session()
    adapter = requests.adapters.HTTPAdapter(pool_maxsize=100)
    sess.mount('http://', adapter)
    
    url_submit = 'http://pcvm3-23.instageni.cenic.net:5000/jobs/submit'
    
    print('start uploading {} images ...'.format(len(imgs_paths)))
    for i, img_path in enumerate(imgs_paths):
        print('uploading {}'.format(img_path))

        data = {'image':open(img_path,'rb')}

        # if failed (timeout, status code not 201 etc.), skip
        # only count valid http requets here, used to compute goodput
        try:
            res = sess.post(url=url_submit, files=data)
            if res.status_code == 201:
                valid_http_req = valid_http_req + 1
        except:
            pass

    print('upload finished')

    # checking if all jobs finished every 5 seconds
    url_check_all_finished = 'http://pcvm3-23.instageni.cenic.net:5000/jobs/all_finished'
    while True:
        try:
            res = sess.get(url_check_all_finished)
            if res.status_code != 200: continue

            all_finished = res.json()
            print('checking if all jobs finished: {}'.format(all_finished))
            if all_finished['finished'] == True:
                print('all jobs finished!')
                break
            
            time.sleep(5)
        except:
            pass
            
    # all job finished, get all jobs results   
    url_get_all_jobs =' http://pcvm3-23.instageni.cenic.net:5000/jobs/all'
    while True:
        try:
            res = sess.get(url_get_all_jobs)
            if res.status_code != 200: continue
            break
        except:
            pass
    
    print('got all the jobs\'results')

    # compute statisticss
    all_data = res.json()
    lst = []
    for row in all_data['data']:
        if row['finish_time'] is None: continue
        
        finish_time = date2ts(row['finish_time'])
        submit_time = date2ts(row['submit_time'])
        duration = finish_time - submit_time    # second

        print('submit time: {}, finish time: {}, duration: {}'.format(row['finish_time'], row['submit_time'], duration))

        lst.append(duration)

    avg_time = np.mean(lst)
    
    print("finish this turn")

    return avg_time, valid_http_req, total_req

if __name__ == '__main__':
    # 命令放到server上去执行
    # client_eth = 'eth1'
    # sys_cmd = 'sudo tc qdisc add {} netem {} loss {}'
    # cmd = sys_cmd.format(client_eth, 0, loss)
    # os.system(cmd)

    # get all images in the image directory
    imgs_paths = os.listdir(IMG_DIR)
    imgs_paths = sorted(imgs_paths, key = lambda path: int(os.path.splitext(path)[0][-8:]))
    imgs_paths = [IMG_DIR + '/{}'.format(path) for path in imgs_paths]

    loss_rates = np.linspace(0, 0.6, num=2)  # 横轴

    ts_st = time.time()
    goodput = []
    throughput = []
    lst_avg_time = []   # 纵轴
    for loss in loss_rates:
        url = 'http://pcvm3-23.instageni.cenic.net:5000/jobs/clear'
        res = requests.delete(url)
        avg_time, valid_http_req, total_http_req = test_code(imgs_paths)
        print("avg time is: "+str(avg_time))
        print("valid req is: "+str(valid_http_req))
        print("total req is: "+str(total_http_req))
        
        lst_avg_time.append(avg_time)
        goodput.append(valid_http_req / avg_time)
        throughput.append(total_http_req / avg_time) 

    total_duration = time.time() - ts_st

    # 把lst里的数据生成统计图表


    # Data for plotting
    plt.figure('Average job duration with respected to each loss rate', figsize=(8, 6))#建画布1:画布的名字 figsize：画布大小
    
    #用subplot()创建第一个子图
    plt.subplot(221)#221：将整个figure分成2行2列，共2个子图，这里子图是第一个位置
    y = lst_avg_time
    x = loss_rates
    plt.plot(x, y, c='red', label='average finished time',linewidth = 1)#c:颜色 label:图例
    #给图片加x轴加标签、长度，让其更美观

    plt.xlabel("loss rates",size=12)#x轴的标签
    plt.ylabel("average job duration (sec)",size=12)
    plt.title("Average job duration with respected to each loss rate",size=12)


    #画第二个子图，跟上面一样
    plt.subplot(222)
    y1 = throughput
    plt.plot(x,y1,c='green',label='throughput',linewidth=1)

    plt.xlabel("loss rates",size=12)
    plt.ylabel("throughput",size=12)
    plt.title("Average throuput with respected to each loss rate",size=12)

    #画第三个子图，跟上面一样
    plt.subplot(223)
    y2 = goodput
    plt.plot(x,y2,c='blue',label='goodput',linewidth=1)

    plt.xlabel("loss rates",size=12)
    plt.ylabel("goodput",size=12)
    plt.title("Average goodput with respected to each loss rate",size=12)

    plt.show()
    # fig, ax = plt.subplots()
    # ax.plot(np.array(loss_rates) * 100, lst_avg_time)

    # ax.set(xlabel='loss rate (%)', ylabel='average job duration (sec)',
    #     title='Average job duration with respected to each loss rate')
    # ax.grid()

    # fig.savefig("test.png")
    # plt.show()