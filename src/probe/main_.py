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
import machine
import esp32
from third_party import string
import network
import socket
import os
import utime
import ssl
from third_party import rsa
from umqtt.simple import MQTTClient
from ubinascii import b2a_base64
from machine import RTC, Pin
import ntptime
import ujson
import config
import uoperations
import uresults
import ubing

print("Starting Main")

sta_if = network.WLAN(network.STA_IF)
print("sta_if", sta_if)
led = Pin(config.device_config['led_pin'], Pin.OUT)  # Define led pin as output


def on_message(topic, message):
    # callback for messages received from Google IOT
    # check for a config message and save to operations.json

    # print((topic, message))
    deviceConfigTopic = '/devices/{}/config'.format(
        config.google_cloud_config['device_id'])
    if topic.decode("utf-8") == deviceConfigTopic:
        uoperations.save(message.decode("utf-8"))


def connect():
    if not sta_if.isconnected():
        print('connecting to network...')
        sta_if.active(True)
        sta_if.connect(config.wifi_config['ssid'],
                       config.wifi_config['password'])
        while not sta_if.isconnected():
            pass
    print('network config: {}'.format(sta_if.ifconfig()))


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
    print('Sending message with password {}'.format(jwt))
    client = MQTTClient(client_id.encode('utf-8'), server=config.google_cloud_config['mqtt_bridge_hostname'],
                        port=config.google_cloud_config['mqtt_bridge_port'], user=b'ignored', password=jwt.encode('utf-8'), ssl=True)
    client.set_callback(on_message)
    client.connect()
    client.subscribe('/devices/{}/config'.format(device_id), 1)
    client.subscribe('/devices/{}/commands/#'.format(device_id), 1)
    return client


uresults.reset()
testResult = {
    "operationId": "8484hf84f8hfh84bhflwld9h",
    "operationTime": 38383812010,
    "bps": 1000000,
    'target': 'ourDars.com',
    'rtl': 230
}
uresults.add(testResult)

for x in range(1):
    gc.collect()
    # main loop
    # 1. connect to Google IOT, get new operations(from config topic) and send results of network tests (operations)
    # 2. Perform operations, build up next set of results
    # 3. Loop Governance : delay next loop for required time so loop isn't too fast

    connect()
    led.value(0)
    # # Need to be connected to the internet before setting the local RTC.
    set_time()

    jwt = create_jwt(config.google_cloud_config['project_id'], config.jwt_config['private_key'],
                     config.jwt_config['algorithm'], config.jwt_config['token_ttl'])

    client = get_mqtt_client(config.google_cloud_config['project_id'], config.google_cloud_config['cloud_region'],
                             config.google_cloud_config['registry_id'], config.google_cloud_config['device_id'], jwt)

    client.check_msg()  # Check for new messages on subscription
    operations = uoperations.get()
    print("operations : ", str(operations))

    resultFileList = uresults.list()
    for fName in resultFileList:
        result = uresults.get(fName)
        print("Publishing result ", fName, " : ",
              str(ujson.dumps(result)))
        led.value(1)
        mqtt_topic = '/devices/{}/{}'.format(
            config.google_cloud_config['device_id'], 'events')
        client.publish(mqtt_topic.encode('utf-8'),
                       ujson.dumps(result).encode('utf-8'))
        led.value(0)
        uresults.remove(fName)
        utime.sleep(1)  # Delay for 1 seconds.

    print('disconnecting MQTT client...')
    client.disconnect()
    # add network capability tests to create next set of results
    #  TBD......
    for operation in operations['probeOperations']:
        host = operation['target']
        # print("bing ", host)
        print("bing ", host, ": ", ubing.bing(
            host, 5, loopBackAdjustment=True))
    # Sleep based on (loopGovernorSeconds - loop elapsed seconds)
    print("loopGovernorSeconds: ", str(operations['loopGovernorSeconds']))

# Clean up network connection (Not needed when used in a real main.py that never ends)
print('disconnecting from network...')
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
