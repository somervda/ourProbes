# Encapsulate IO operations for working with tests
# valid operations are:
# reset() - make empty /tests folder
# add(name, testObject)
# get()
# remove(name)


def reset():
    print("start of reset")
    if ('tests' in os.listdir()):
        print("tests dir found, deleting any files")
        for i in os.listdir('tests'):
            print("removing", i)
            os.remove('tests/' + i)
    else:
        print("tests dir not found, creating one")
        os.mkdir('tests')


def add(name, testObject):
    print("start of add")
    f = open('/tests/' + name + '.tst', 'w')
    f.write('hi')
    f.close()
    print("end of add")


test = {
    "name": "test1",
    "type": 'bing',
    'target': 'ourDars.com'
}

add('test1', test)
# reset()
