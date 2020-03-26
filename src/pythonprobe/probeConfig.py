# Encapsulate IO probeConfig for working with the probeConfig.json file
# valid probeConfig are:
# save(probeConfigJson)
# get()  : returns the probeConfig.json as an object
import os
import json


def save(probeConfigJson):
    # print("*probeConfig save:", os.path.abspath(os.path.dirname(__file__)))
    os.chdir(os.path.abspath(os.path.dirname(__file__)))
    f = open('probeConfig.json', 'wt')
    l = f.write(probeConfigJson)
    # must perform a flush() to make sure string in buffer is written to file
    f.flush()
    f.close


def get():
    os.chdir(os.path.abspath(os.path.dirname(__file__)))
    objProbeConfig = {}
    # print(os.listdir())
    if ('probeConfig.json' in os.listdir()):
        f = open('probeConfig.json', 'rt')
        o = f.read()
        objProbeConfig = json.loads(o)
        f.close
    return objProbeConfig


# ******************* Test ** ********************
# objProbeConfig = {"governorSeconds":  300,
#                   "probeList": [
#                       {"id": "8484hf84f8hfh84bhflwld9h",
#                        "type": "bing", "target": "ourDars.com"},
#                       {"id": "73622929273737jhdhw828",
#                        "type": "bing", "target": "lupincorp.com"}
#                   ]}

# save(json.dumps(objProbeConfig))
# print(get())
