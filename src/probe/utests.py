# Encapsulate IO operations for working with tests
# valid operations are:
# reset() - make empty /tests folder
# add(name, testObject)
# get()
# remove(name)
import os
import json

cwd = os.getcwd()
print('starting cwd:', cwd)


def reset():
    print("start of reset")
    os.chdir('/')
    if ('tests' in os.listdir()):
        print("tests dir found, deleting any files")
        for i in os.listdir('tests'):
            print("removing", i)
            os.remove('tests/' + i)
    else:
        print("tests dir not found, creating one")
        os.mkdir('tests')
    os.chdir('/')


def add(name, testObject):
    print("start of add")
    os.chdir('/')
    os.chdir('tests')
    f = open(name + '.tst', 'w')
    f.write(repr(testObject))
    f.close()
    os.chdir('/')
    print("end of add")


def get(name):
    f = open(name, 'r')


test = {
    "name": "test1",
    "type": 'bing',
    'target': 'ourDars.com'
}

reset()
# add('test1', test)
