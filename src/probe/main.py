# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import ubing
import umeasurements
import uprobeConfig
import config
import ujson
import ntptime
from machine import RTC, Pin
from ubinascii import b2a_base64
from umqtt.simple import MQTTClient
from third_party import rsa
import ssl
import utime
import os
import socket
import network
from third_party import string
import esp32
import machine
import umemory
import gc
import sys


print("Starting Main")
if config.device_config['useWiFi']:
    net_if = network.WLAN(network.STA_IF)
else:
    # Connection details for a ESP32-Gateway board from Olimex (Ethernet connection)
    net_if = network.LAN(mdc=machine.Pin(23), mdio=machine.Pin(18), power=machine.Pin(
        12), phy_type=network.PHY_LAN8720, phy_addr=0, clock_mode=network.ETH_CLOCK_GPIO17_OUT)
print("net_if", net_if)

led = Pin(config.device_config['led_pin'], Pin.OUT)  # Define led pin as output


def on_message(topic, message):
    # callback for messages received from Google IOT
    # check for a config message and save to probeConfig.json

    # print((topic, message))
    deviceConfigTopic = '/devices/{}/config'.format(
        config.google_cloud_config['device_id'])
    if topic.decode("utf-8") == deviceConfigTopic:
        uprobeConfig.save(message.decode("utf-8"))


def connect():
    if not net_if.isconnected():
        print('connecting to network...')
        net_if.active(True)
        if config.device_config['useWiFi']:
            net_if.connect(config.wifi_config['ssid'],
                           config.wifi_config['password'])
        while not net_if.isconnected():
            utime.sleep_ms(500)
        if config.device_config['useWiFi'] == False:
            # Wait for DHCP to supply IP
            ip = net_if.ifconfig()[0]
            while ip == '0.0.0.0':
                print("Getting IP", ip)
                utime.sleep_ms(1000)
                ip = net_if.ifconfig()[0]

        print('network config: {}'.format(net_if.ifconfig()))


def set_time():
    ntptime.settime()
    tm = utime.localtime()
    tm = tm[0:3] + (0,) + tm[3:6] + (0,)
    machine.RTC().datetime(tm)
    print('current time: {}'.format(utime.localtime()))


def b42_urlsafe_encode(payload):
    return string.translate(b2a_base64(payload)[:-1].decode('utf-8'), {ord('+'): '-', ord('/'): '_'})


def create_jwt(project_id, private_key, algorithm, token_ttl):
    print("Creating JWT...")
    private_key = rsa.PrivateKey(*private_key)

    # Epoch_offset is needed because micropython epoch is 2000-1-1 and unix is 1970-1-1. Adding 946684800 (30 years)
    epoch_offset = 946684800
    claims = {
        # The time that the token was issued at
        'iat': utime.time() + epoch_offset,
        # The time the token expires.
        'exp': utime.time() + epoch_offset + token_ttl,
        # The audience field should always be set to the GCP project id.
        'aud': project_id
    }

    # This only supports RS256 at this time.
    header = {"alg": algorithm, "typ": "JWT"}
    content = b42_urlsafe_encode(ujson.dumps(header).encode('utf-8'))
    content = content + '.' + \
        b42_urlsafe_encode(ujson.dumps(claims).encode('utf-8'))
    signature = b42_urlsafe_encode(rsa.sign(content, private_key, 'SHA-256'))
    return content + '.' + signature  # signed JWT


def get_mqtt_client(project_id, cloud_region, registry_id, device_id, jwt):
    """Create our MQTT client. The client_id is a unique string that identifies
    this device. For Google Cloud IoT Core, it must be in the format below."""
    client_id = 'projects/{}/locations/{}/registries/{}/devices/{}'.format(
        project_id, cloud_region, registry_id, device_id)
    # print('Sending message with password {}'.format(jwt))
    client = MQTTClient(client_id.encode('utf-8'), server=config.google_cloud_config['mqtt_bridge_hostname'],
                        port=config.google_cloud_config['mqtt_bridge_port'], user=b'ignored', password=jwt.encode('utf-8'), ssl=True)
    client.set_callback(on_message)
    client.connect()
    client.subscribe('/devices/{}/config'.format(device_id), 1)
    client.subscribe('/devices/{}/commands/#'.format(device_id), 1)
    return client


def mqttProcessConfigAndMeasurements():
    gc.collect()
    # print('Connecting MQTT client...')
    client = get_mqtt_client(config.google_cloud_config['project_id'], config.google_cloud_config['cloud_region'],
                             config.google_cloud_config['registry_id'], config.google_cloud_config['device_id'], jwt)
    led.value(1)
    client.check_msg()  # Check for new messages on subscription
    probeConfig = uprobeConfig.get()
    # print("probeConfig : ", str(probeConfig))

    # Turn of led while sending probe measurements to IOT core
    for fName in umeasurements.list():
        led.value(0)
        measurement = umeasurements.get(fName)
        # print("Publishing result ", fName, " : ",
        #       str(ujson.dumps(measurement)))
        mqtt_topic = '/devices/{}/{}'.format(
            config.google_cloud_config['device_id'], 'events')
        client.publish(mqtt_topic.encode('utf-8'),
                       ujson.dumps(measurement).encode('utf-8'))
        umeasurements.remove(fName)
        utime.sleep_ms(500)
        led.value(1)

    # print('disconnecting MQTT client...')
    client.disconnect()
    return probeConfig


try:
    umeasurements.reset()
    connect()
    set_time()
    loopCnt = 0
    ip = net_if.ifconfig()[0]
    jwtExpiry = utime.time() + config.jwt_config['token_ttl']
    jwt = create_jwt(config.google_cloud_config['project_id'], config.jwt_config['private_key'],
                     config.jwt_config['algorithm'], config.jwt_config['token_ttl'])

    # Do initial MQTT connection to get thew probeConfig
    probeConfig = mqttProcessConfigAndMeasurements()

    while jwtExpiry > utime.time():
        loopCnt += 1
        # main loop
        # 1. build up next set of measurements
        # 2. Loop Governance : delay next loop for required time so loop isn't too fast, while this is going on
        #    connect to Google IOT, get new probeConfig(from config topic) and send measurements of network tests (probeConfig)

        print('****** ', loopCnt, " memory:", umemory.free())
        loopStartTime = utime.time()

        # 1 *******************  Probes - network capability tests *****************************
        if probeConfig['runProbes'] == True:
            for probe in probeConfig['probeList']:
                #   bing = 1, echo = 2, webPage = 3,tracert = 4
                if probe['type'] == 1:
                    host = probe['target']
                    bingResult = ubing.bing(
                        host, 5, loopBackAdjustment=True, quiet=True, timeout=3000)
                    if bingResult != None:
                        if (bingResult[0] != -1):
                            # valid bing, also include probe name on measurement to save looking it up latter
                            measurement = {
                                "probeId": probe['id'],
                                "name": probe['name'],
                                "UMT": utime.time() + 946684800,
                                "value": bingResult[0],
                                'type': 'bps'
                            }
                            umeasurements.add(measurement)
                            print("bps successful:", measurement)
                            measurement = {
                                "probeId": probe['id'],
                                "name": probe['name'],
                                "UMT": utime.time() + 946684800,
                                "value": bingResult[1],
                                'type': 'rtl'
                            }
                            umeasurements.add(measurement)
                            print("rtl successful:", measurement)
                            measurement = {
                                "probeId": probe['id'],
                                "name": probe['name'],
                                "UMT": utime.time() + 946684800,
                                "value": 0,
                                'type': 'success'
                            }
                            umeasurements.add(measurement)
                        else:
                            # Failure Error number returned as a negative value
                            # -10: getlowestPing failed: latency == None
                            # -11: getlowestPing failed: loopback16 == None
                            # -12: getlowestPing failed: loopback26 == None
                            # -13: getlowestPing failed: loopbackMax == None
                            # -14: getlowestPing failed: target26 == None
                            # -15: getlowestPing failed: targetMax == None
                            # -16: bing calculation not possable: loopback26 > loopbackMax
                            # -17: bing calculation not possable: target26 > targetMax
                            # -18: bing calculation not possable: deltaLatency <= 0
                            measurement = {
                                "probeId": probe['id'],
                                "name": probe['name'],
                                "UMT": utime.time() + 946684800,
                                "value": bingResult[1],
                                'type': 'fail'
                            }
                            umeasurements.add(measurement)
                            print("bing fail:", measurement)
                    else:
                        measurement = {
                            "probeId": probe['id'],
                            "name": probe['name'],
                            "UMT": utime.time() + 946684800,
                            "value": -1,
                            'type': 'fail'
                        }
                        umeasurements.add(measurement)
                        print("bing fail: result None", bingResult)

        # 2 **************** Governor & probeConfig refresh ***************************

        led.value(0)
        print("governorSeconds: ", str(probeConfig['governorSeconds']))
        # print("loop time so far:", utime.time() - loopStartTime)
        probeConfig = mqttProcessConfigAndMeasurements()
        sleeper = probeConfig['governorSeconds'] - \
            (utime.time() - loopStartTime)
        print("Sleeping time remaining: ", sleeper)
        utime.sleep(sleeper)
        probeConfig = mqttProcessConfigAndMeasurements()

    # Clean up network connection (Not needed when used in a real main.py that never ends)
    print('disconnecting from network...')
    net_if.active(False)
    while net_if.isconnected():
        pass
    print('Disconnected from network')
except Exception as e:
    sys.print_exception(e)
    print("Waiting 60 seconds to reboot...")
    utime.sleep(60)

print('Reboot')
machine.reset()
