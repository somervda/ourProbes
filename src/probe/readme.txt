************  Miscellaneous Notes and Links *****************

esp32 Setup 

http://micropython.org/download#esp32


esptool.py --chip esp32 --port COM3 erase_flash

esptool.py --chip esp32 --port COM3 --baud 460800 write_flash -z 0x1000 C:\Users\somer\Downloads\esp32-idf3-20191220-v1.12.bin

Github repository

https://github.com/GoogleCloudPlatform/iot-core-micropython

follow this tutorial
https://medium.com/google-cloud/connecting-micropython-devices-to-google-cloud-iot-core-3680e632681e

You will need to install the python rsa utility
pip install rsa

and download  the utls/decode_rsa.py from https://github.com/GoogleCloudPlatform/iot-core-micropython 
and run it on your private key

Make private key and then the public key
openssl genrsa -out rsa_private.pem 2048
openssl rsa -in rsa_private.pem -pubout -out rsa_public.pem


gcloud pubsub subscriptions create projects/ourprobes-258320/subscriptions/probeSub --topic=projects/ourprobes-258320/topics/probe-events
	
Put private key here C:\Projects\iot\nodejs-docs-samples\iot\mqtt_example

node cloudiot_mqtt_example_nodejs.js mqttDeviceDemo --projectId=ourprobes-258320 --cloudRegion=us-central1 --registryId=microcontroller --deviceId=probe01 --privateKeyFile=rsa_private.pem --numMessages=5 --algorithm=RS256

gcloud pubsub subscriptions pull --auto-ack projects/ourprobes-258320/subscriptions/probeSub