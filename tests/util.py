
def load_ground_truth(gt_file: str):
    ground_truth = []
    with open(gt_file, 'r') as f:
        for idx, line in enumerate(f):
            ground_truth.append(int(line))
    
    return ground_truth

def load_imagenet_meta(meta_file: str):
    import scipy.io
    mat = scipy.io.loadmat(meta_file)
    return mat['synsets']

def get_sysnset_map(meta_file: str, synset_words_mapping_file: str):
    '''
    since the predicted label from model is not the same as the synsets id in imagenet
    we have to map the label to the synsets id

    this function will return the map of <model label, imagenet id>
    '''
    metadata = load_imagenet_meta(meta_file)

    d = metadata[:, 0]
    wnid_map = {}
    for r in d:
        if r[0][0][0] > 1000: continue
        wnid_map[r[1][0]] = r[0][0][0]

    synset_map = {-1: -1}

    import csv
    with open(synset_words_mapping_file, newline='') as csvfile:
        csvreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
        for id, line in enumerate(csvreader):
            id_imgnet = wnid_map[line[0]]
            synset_map[id] = id_imgnet
    
    return synset_map

def is_predict_correct(ground_truth: list, img_idx: int, imgnet_label: int):
    return ground_truth[img_idx] == imgnet_label