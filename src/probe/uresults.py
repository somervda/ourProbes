# Encapsulate IO operations for working with result files
# valid operations are:
# reset() - make empty /results folder
# add(fname, objResult) : Gets current time applied as file name
# list() : returns a list of result files
# get(fname) : returns object with contents of the fname results file
# remove(fname)
# Note: do a os.chdir('/') before all operations to make sure we are in top level folder
#  even if an earlier operation fails
import os
import ujson
import utime


def reset():
    print("start of reset")
    os.chdir('/')
    if ('results' in os.listdir()):
        print("results folder found, deleting any files")
        for i in os.listdir('results'):
            print("removing", i)
            os.remove('results/' + i)
    else:
        print("results folder not found, creating one")
        os.mkdir('results')


def add(objResults):
    print("start of add")
    os.chdir('/')
    strJson = ujson.dumps(objResults)
    # filename is based on esp32 time (note does not need to be real time
    # and only needs to be unique relative to cpu lifecycle)
    fname = "r" + str(utime.ticks_ms())
    f = open('/results/' + fname + '.json', 'wt')
    l = f.write(strJson)
    # must perform a flush() to make sure string in buffer is written to file
    f.flush()
    f.close
    print("end of add, characters in file: ", l)


def list():
    # return all the result files as names in a list
    print("start of list")
    os.chdir('/')
    resultsList = []
    if ('results' in os.listdir()):
        resultsList = os.listdir('results')
    print("end of list")
    return resultsList


def get(fname):
    # return all the result files an object
    print("start of get")
    os.chdir('/')
    result = {}
    if ('results' in os.listdir()):
        if (fname in os.listdir('results')):
            f = open('/results/' + fname, 'rt')
            v = f.read()
            result = ujson.loads(v)
            f.close
    print("end of get")
    return result


def remove(fname):
    print("start of remove")
    os.chdir('/')
    try:
        os.remove('/results/' + fname)
    except:
        print("File not found")
    print("end of remove")


# result = {
#     "operationId": "8484hf84f8hfh84bhflwld9h",
#     "operationTime": 38383812010,
#     "bps": 1000000,
#     'target': 'ourDars.com',
#     'rtl': 230
# }


# reset()
# add(result)
# plist = list()
# for i in plist:
#     print(i, get(i))
#     remove(i)
