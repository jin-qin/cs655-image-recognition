from util import get_synset_details_map
import json

IMGNET_META_FILE = './data/meta.mat'
SYNSET_WORDS_MAP_FILE = './data/synset_words.txt'

synset_map = get_synset_details_map(IMGNET_META_FILE, SYNSET_WORDS_MAP_FILE)

synset_map = {str(k) : v for k, v in synset_map.items()}

json_data = json.loads(json.dumps(synset_map))

with open('sysnet_map.json', 'w') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)