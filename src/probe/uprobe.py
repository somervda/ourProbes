# Encapsulate IO operations for working with probe files
# valid operations are:
# reset() - make empty /probes folder
# add(fname, objProbe)
# get()
# remove(fname)
# Note: do a os.chdir('/') before all operations to make sure we are in correct dir
#  even if earlier operation fails
import os
import ujson


def reset():
    print("start of reset")
    os.chdir('/')
    if ('probes' in os.listdir()):
        print("probes dir found, deleting any files")
        for i in os.listdir('probes'):
            print("removing", i)
            os.remove('probes/' + i)
    else:
        print("probes dir not found, creating one")
        os.mkdir('probes')
    os.chdir('/')


def add(fname, objProbe):
    print("start of add")
    os.chdir('/')
    strJson = ujson.dumps(objProbe)
    f = open('/probes/' + fname + '.json', 'wt')
    l = f.write(strJson)
    # must perform a flush() to make sure string in buffer is written to file
    f.flush()
    f.close
    print("end of add, characters in file: ", l)


def get():
    # return all the probe as objects in a list
    print("start of get")
    os.chdir('/')
    probeList = []
    if ('probes' in os.listdir()):
        for i in os.listdir('probes'):
            f = open('/probes/' + i, 'rt')
            v = f.read()
            objJson = ujson.loads(v)
            f.close
            probeList.append(objJson)
    print("end of get")
    return probeList


def remove(fname):
    print("start of remove")
    os.chdir('/')
    try:
        os.remove('/probes/' + fname + '.json')
    except:
        print("File not found")
    print("end of remove")


myprobe = {
    "id": "8484hf84f8hfh84bhflwld9h",
    "type": 'bing',
    'target': 'ourDars.com'
}

reset()
add('probe1', myprobe)
add('probe2', myprobe)
plist = get()
print(plist)
remove("probe2")
