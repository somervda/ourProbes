# Encapsulate IO operations for working with result files
# valid operations are:
# reset() - make empty /Measurements folder
# add(fname, objResult) : Gets current time applied as file name
# list() : returns a list of result files
# get(fname) : returns object with contents of the fname Measurements file
# remove(fname)
# Note: do a os.chdir('/') before all operations to make sure we are in top level folder
#  even if an earlier operation fails
import os
import ujson
import utime


def reset():
    print("start of reset")
    os.chdir('/')
    if ('measurements' in os.listdir()):
        # print("Measurements folder found, deleting any files")
        for i in os.listdir('measurements'):
            # print("removing", i)
            os.remove('measurements/' + i)
    else:
        # print("Measurements folder not found, creating one")
        os.mkdir('measurements')


def add(objMeasurements):
    # print("start of add")
    os.chdir('/')
    strJson = ujson.dumps(objMeasurements)
    # filename is based on esp32 time (note does not need to be real time
    # and only needs to be unique relative to cpu lifecycle)
    fname = "r" + str(utime.ticks_ms())
    f = open('/measurements/' + fname + '.json', 'wt')
    l = f.write(strJson)
    # must perform a flush() to make sure string in buffer is written to file
    f.flush()
    f.close
    # print("end of add, characters in file: ", l)


def list():
    # return all the result files as names in a list
    # print("start of list")
    os.chdir('/')
    measurementsList = []
    if ('measurements' in os.listdir()):
        measurementsList = os.listdir('measurements')
    # print("end of list")
    return measurementsList


def get(fname):
    # return all the result files an object
    # print("start of get")
    os.chdir('/')
    result = {}
    if ('measurements' in os.listdir()):
        if (fname in os.listdir('measurements')):
            f = open('/measurements/' + fname, 'rt')
            v = f.read()
            result = ujson.loads(v)
            f.close
    # print("end of get")
    return result


def remove(fname):
    # print("start of remove")
    os.chdir('/')
    try:
        os.remove('/measurements/' + fname)
    except:
        print("File not found")


def writeMeasurement(probe, type, value):
    # micropython time.time is relative to 1/1/2000 epoch
    measurement = {
        "probeId": probe['id'],
        "name": probe['name'],
        "UMT": utime.time() + 946684800,
        "value": value,
        'type': type
    }
    add(measurement)
    print("measurement: ", measurement)

