import os
import requests
import json

import dateutil.parser
import time
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from util import load_ground_truth, get_sysnset_map, is_predict_correct

IMG_DIR = '/opt/client/data/val_img'
GROUND_TRUTH_FILE = './data/ILSVRC2012_validation_ground_truth.txt'
IMGNET_META_FILE = './data/meta.mat'
SYNSET_WORDS_MAP_FILE = './data/synset_words.txt'
HOST = 'pcvm3-23.instageni.cenic.net'
PORT = 5000

def date2ts(iso_date):
    '''
    parse date format like '2020-12-08T11:39:47.110Z' to a timestamp
    '''
    dt = dateutil.parser.isoparse(iso_date)
    return int(time.mktime(dt.timetuple()))

def test_code(imgs_paths, gt, synste_map):
    '''
    run testing logics
    try uploading all images inside imgs_paths
    '''

    imgs_idx_map = {}
    valid_http_req = 0
    total_req = len(imgs_paths)

    # set maxmimum http pool size
    sess = requests.Session()
    adapter = requests.adapters.HTTPAdapter(pool_maxsize=100)
    sess.mount('http://', adapter)
    
    url_submit = 'http://{}:{}/jobs/submit'.format(HOST, PORT)
    
    print('start uploading {} images ...'.format(len(imgs_paths)))
    ts_req_st = time.time()
    for idx, img_path in enumerate(imgs_paths):
        print('uploading {}'.format(img_path), end='\r')

        data = {'image':open(img_path,'rb')}

        # if failed (timeout, status code not 201 etc.), skip
        # only count valid http requets here, used to compute goodput
        try:
            res = sess.post(url=url_submit, files=data)
            if res.status_code == 201:
                job_id = res.json()['id']
                imgs_idx_map[job_id] = idx
                valid_http_req = valid_http_req + 1
        except:
            pass
    req_duration = time.time() - ts_req_st
    print('') # new line

    print('upload finished')

    # checking if all jobs finished every 5 seconds
    url_check_all_finished = 'http://{}:{}/jobs/all_finished'.format(HOST, PORT)
    check_count = 0
    while True:
        try:
            res = sess.get(url_check_all_finished)
            if res.status_code != 200: continue
            all_finished = res.json()

            print('checking if all jobs finished: {}, count: {}'.format(all_finished, check_count), end='\r')
            check_count = check_count + 1

            if all_finished['finished'] == True:
                print('') # new line
                print('all jobs finished!')
                break
            
            time.sleep(5)
        except:
            pass
            
    # all job finished, get all jobs results
    url_get_all_jobs =' http://{}:{}/jobs/all'.format(HOST, PORT)
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
    avg_times = []
    preds = []
    for row in all_data['data']:
        if row['finish_time'] is None: continue
        if row['schedule_time'] is None: continue
        
        img_idx = imgs_idx_map[row['job_id']]
        finish_time = date2ts(row['finish_time'])
        schedule_time = date2ts(row['schedule_time'])
        submit_time = date2ts(row['submit_time'])
        pred_label = synset_map[int(row['result'])]

        preds.append(is_predict_correct(gt, img_idx, pred_label))

        duration = finish_time - schedule_time    # second
        avg_times.append(duration)

    avg_time = np.mean(avg_times)
    accuracy = np.mean(preds)

    return avg_time, accuracy, valid_http_req, total_req, req_duration

if __name__ == '__main__':
    # get all images in the image directory
    imgs_paths = os.listdir(IMG_DIR)
    imgs_paths = sorted(imgs_paths, key = lambda path: int(os.path.splitext(path)[0][-8:]))
    imgs_paths = [IMG_DIR + '/{}'.format(path) for path in imgs_paths]

    gt = load_ground_truth(GROUND_TRUTH_FILE)
    synset_map = get_sysnset_map(IMGNET_META_FILE, SYNSET_WORDS_MAP_FILE)

    loss_rates = np.linspace(0, 0.6, num=10)  # X-axis

    ts_st = time.time()

    goodputs = []        # Y-axis
    throughputs = []     # Y-axis
    avg_times = []       # Y-axis
    accuracies = []      # Y-axis
    for loss in loss_rates:
        print('----------------------------------------------------------')
        print("start a new turn on loss rate: {:.2f}".format(loss * 100))

        url = 'http://{}:{}/jobs/clear'.format(HOST, PORT)
        res = requests.delete(url)
        avg_time, accuracy, valid_http_req, total_http_req, req_duration = test_code(imgs_paths, gt, synset_map)
        goodput = valid_http_req / req_duration
        throughput = total_http_req / req_duration
        avg_times.append(avg_time)
        accuracies.append(accuracy)
        goodputs.append(goodput)
        throughputs.append(throughput) 

        print('average job execution time: {} sec'.format(avg_time))
        print('accuracy: {:.2f} %'.format(accuracy * 100))
        print('valid requests: {}'.format(valid_http_req))
        print('total requests: {}'.format(total_http_req))
        print('goodput: {} / sec'.format(goodput))
        print('throughput: {} / sec'.format(throughput))

        print("finish this turn")
        print('----------------------------------------------------------')

        input('Enter any key to start next turn...')

    total_runtime = time.time() - ts_st

    # save all data into csv files.
    import csv
    with open('results.csv', 'w') as csvfile:
        csvwriter = csv.writer(csvfile, delimiter=' ', quotechar='|')
        for i in range(len(loss_rates)):
            csvwriter.writerow([loss_rates[i], goodputs[i], throughputs[i], accuracies[i], avg_times[i]])
    