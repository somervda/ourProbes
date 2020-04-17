import mqtt
import jwt
import probeConfig as probeConfigLib
import os
import json
import measurements
import time
import bing
import webPage
import sys
import traceback
import socket
import datetime

device_id = ""

# With pythonping library from https://github.com/alessandromaggio/pythonping
#  and paho mqtt library from https://github.com/eclipse/paho.mqtt.python
#  as well I used the standard jwt, requests, socket libraries


def on_message(unused_client, unused_userdata, message):
    """Callback when the device receives a message on a subscription."""
    payload = str(message.payload.decode('utf-8'))
    # print('Received message \'{}\' on topic \'{}\' with Qos {} with mid {}'.format(
    #     payload, message.topic, str(message.qos), str(message.mid)))
    deviceConfigTopic = '/devices/{}/config'.format(device_id)
    # print("on_message {} - {}".format(message.topic, deviceConfigTopic))
    if message.topic == deviceConfigTopic:
        probeConfigLib.save(payload)


def mqttProcessConfigAndMeasurements(args):
    print('mqttProcessConfigAndMeasurements...')
    client = mqtt.get_client(args.project_id, args.cloud_region, args.registry_id, args.device_id, args.private_key,
                             args.algorithm, args.ca_certs, args.mqtt_bridge_hostname, args.mqtt_bridge_port, args.token_ttl, on_message)
    probeConfigRetrys = 0
    # Wait for the probeConfig file to be present
    while probeConfigLib.get() == {} or probeConfigRetrys > 30:
        probeConfigRetrys += 1
        time.sleep(1)
    probeConfig = probeConfigLib.get()
    if probeConfig == {}:
        raise NameError('Could not get probeConfig')

    for fName in measurements.list():
        measurement = measurements.get(fName)
        print("Publishing result ", fName, " - ", datetime.datetime.now(), " : ",
              str(json.dumps(measurement)))
        mqtt_topic = '/devices/{}/{}'.format(
            args.device_id, 'events')
        client.publish(mqtt_topic,
                       json.dumps(measurement))
        measurements.remove(fName)
        time.sleep(1)

    # print('disconnecting MQTT client...')
    mqtt.detach_device(client, args.device_id)
    return probeConfig


def getArgs():
    # Read config.py and load info to args class
    os.chdir(os.path.abspath(os.path.dirname(__file__)))

    # print(os.listdir())
    if ('config.json' in os.listdir()):
        f = open('config.json', 'rt')
        o = f.read()
        config = json.loads(o)
        f.close

        class args:
            registry_id = config["registry_id"]
            cloud_region = config["cloud_region"]
            project_id = config["project_id"]
            device_id = config["device_id"]
            algorithm = config["algorithm"]
            private_key = config["private_key"]
            token_ttl = config["token_ttl"]
            ca_certs = os.path.abspath(
                os.path.dirname(__file__)) + "/roots.pem"
            mqtt_bridge_hostname = config["mqtt_bridge_hostname"]
            mqtt_bridge_port = config["mqtt_bridge_port"]
        return args
    else:
        return None


try:
    args = getArgs()
    # keep a global copy of the device_id for use by the on_message code
    device_id = args.device_id
    if args == None:
        sys.exit("Error: config.json not found, exiting")
    print("Device: ", device_id, " - ", datetime.datetime.now())
    measurements.reset()
    ip = socket.gethostname()
    measurements.writeMeasurement(
        {"id": "", "name": ip}, 'startup', 0)

    loopCnt = 0
    probeConfig = mqttProcessConfigAndMeasurements(args)
    # Loop forever
    while True:
        loopCnt += 1
        # main loop

        print('****** ', loopCnt)
        loopStartTime = time.time()

        # 1 *******************  Probes - network capability tests *****************************
        if probeConfig['runProbes'] == True:
            for probe in probeConfig['probeList']:
                #   bing = 1, echo = 2, webPage = 3,tracert = 4
                if probe['type'] == 1:
                    bingResult = bing.bing(
                        probe['target'], 7, quiet=True, timeout=5000, maxSize=8164)
                    if bingResult != None:
                        if (bingResult[0] != -1):
                            # valid bing, also include probe name on measurement to save looking it up latter
                            measurements.writeMeasurement(
                                probe, 'bps', bingResult[0])
                            measurements.writeMeasurement(
                                probe, 'rtl', bingResult[1])
                            measurements.writeMeasurement(
                                probe, 'success', 0)
                        else:
                            measurements.writeMeasurement(
                                probe, 'fail', bingResult[1])
                    else:
                        measurements.writeMeasurement(
                            probe, 'fail', -1)
                if probe['type'] == 2:
                    pingResult = bing.getLowestPing(
                        probe['target'], 3, 16, 5000, True)
                    if (pingResult != None):
                        measurements.writeMeasurement(
                            probe, 'rtl', pingResult)
                        measurements.writeMeasurement(
                            probe, 'success', 0)
                    else:
                        measurements.writeMeasurement(
                            probe, 'fail', 0)
                if probe['type'] == 3:
                    match = probe.get("match", "")
                    webPageResult = webPage.webPage(
                        probe['target'], match, True)
                    if (webPageResult[1] == True):
                        # valid webPageResult ttfb = Time to first Byte
                        measurements.writeMeasurement(
                            probe, 'ttfb', webPageResult[0])
                        measurements.writeMeasurement(
                            probe, 'success', 0)
                    else:
                        # return status code as value on failure i.e. 301
                        measurements.writeMeasurement(
                            probe, 'fail', webPageResult[2])

        # 2 **************** Governor & probeConfig refresh ***************************

        print("governorSeconds: ", str(
            probeConfig['governorSeconds']))
        # print("loop time so far:", utime.time() - loopStartTime)
        probeConfig = mqttProcessConfigAndMeasurements(args)
        sleeper = probeConfig['governorSeconds'] - \
            (time.time() - loopStartTime)
        print("Sleeping time remaining: ", sleeper)
        time.sleep(sleeper)
        probeConfig = mqttProcessConfigAndMeasurements(args)
except Exception:
    print("Exception in code:")
    print("-"*60)
    traceback.print_exc(file=sys.stdout)
    print("-"*60)
    sys.exit("Exiting...")
