# Encapsulate IO operations for working with the operations.json file
# valid operations are:
# save(oerationsJson)
# get()  : returns the operations.json as an object
# Note: do a os.chdir('/') before all operations to make sure we are in correct dir
import os
import ujson


def save(operationsJson):
    os.chdir('/')
    f = open('operations.json', 'wt')
    l = f.write(operationsJson)
    # must perform a flush() to make sure string in buffer is written to file
    f.flush()
    f.close


def get():
    os.chdir('/')
    objOperations = {}
    if ('operations.json' in os.listdir()):
        f = open('operations.json', 'rt')
        o = f.read()
        objOperations = ujson.loads(o)
        f.close
    return objOperations


# ******************* Test **********************
# objOperations = {"loopGovernorSeconds":  300,
#                  "probeOperations": [
#                      {"id": "8484hf84f8hfh84bhflwld9h",
#                          "type": "bing", "target": "ourDars.com"},
#                      {"id": "73622929273737jhdhw828",
#                          "type": "bing", "target": "lupincorp.com"}
#                  ]}

# save(ujson.dumps(objOperations))
# print(get())
