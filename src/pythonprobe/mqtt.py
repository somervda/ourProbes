import paho.mqtt.client as pahomqtt
import jwt
import datetime
import ssl
import time
import random


# [START iot_mqtt_jwt]

# The initial backoff time after a disconnection occurs, in seconds.
minimum_backoff_time = 1

# The maximum backoff time before giving up, in seconds.
MAXIMUM_BACKOFF_TIME = 10

# Whether to wait with exponential backoff before publishing.
should_backoff = False


def create_jwt(project_id, private_key, algorithm, token_ttl):
    # print("*create_jwt")
    """Creates a JWT (https://jwt.io) to establish an MQTT connection.
        Args:
         project_id: The cloud project ID this device belongs to
         private_key: A string of either an RSA256 or ES256 private key.
         algorithm: The encryption algorithm to use. Either 'RS256' or 'ES256'
         token_ttl: time in seconds that the jwt token is valid
        Returns:
            A JWT generated from the given project_id and private key, which
            expires in token_ttl seconds. After token_ttl seconds, your client will be
            disconnected, and a new JWT will have to be generated.
        Raises:
            ValueError: If the private_key_file does not contain a known key.
        """

    token = {
        # The time that the token was issued at
        'iat': datetime.datetime.utcnow(),
        # The time the token expires.
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=token_ttl),
        # The audience field should always be set to the GCP project id.
        'aud': project_id
    }

    # print('Creating JWT using {} with ttl  {}'.format(
    #     algorithm, token_ttl))

    return jwt.encode(token, private_key, algorithm=algorithm)
# [END iot_mqtt_jwt]


def error_str(rc):
    """Convert a Paho error to a human readable string."""
    return '{}: {}'.format(rc, pahomqtt.error_string(rc))


def on_connect(unused_client, unused_userdata, unused_flags, rc):
    """Callback for when a device connects."""
    # print('on_connect', pahomqtt.connack_string(rc))

    # After a successful connect, reset backoff time and stop backing off.
    global should_backoff
    global minimum_backoff_time
    should_backoff = False
    minimum_backoff_time = 1


def on_disconnect(unused_client, unused_userdata, rc):
    """Paho callback for when a device disconnects."""
    # print('on_disconnect', error_str(rc))

    # Since a disconnect occurred, the next loop iteration will wait with
    # exponential backoff.
    global should_backoff
    should_backoff = True


def on_publish(unused_client, unused_userdata, unused_mid):
    """Paho callback when a message is sent to the broker."""
    # print('on_publish')


def detach_device(client, device_id):
    """Detach the device from the gateway."""
    # print("*detach_device")
    client.loop_stop()  # start the loop
    # [START iot_detach_device]
    detach_topic = '/devices/{}/detach'.format(device_id)
    # print('Detaching: {}'.format(detach_topic))
    client.publish(detach_topic, '{}', qos=1)
    # [END iot_detach_device]


def get_client(
        project_id, cloud_region, registry_id, device_id, private_key,
        algorithm, ca_certs, mqtt_bridge_hostname, mqtt_bridge_port, token_ttl, on_message_callback):
    """Create our MQTT client. The client_id is a unique string that identifies
    this device. For Google Cloud IoT Core, it must be in the format below."""
    client_id = 'projects/{}/locations/{}/registries/{}/devices/{}'.format(
        project_id, cloud_region, registry_id, device_id)
    # print('Device client_id is \'{}\''.format(client_id))

    client = pahomqtt.Client(client_id=client_id)

    # With Google Cloud IoT Core, the username field is ignored, and the
    # password field is used to transmit a JWT to authorize the device.
    client.username_pw_set(
        username='unused',
        password=create_jwt(
            project_id, private_key, algorithm, token_ttl))

    # Enable SSL/TLS support.
    client.tls_set(ca_certs=ca_certs, tls_version=ssl.PROTOCOL_TLSv1_2)

    # Register message callbacks. https://eclipse.org/paho/clients/python/docs/
    # describes additional callbacks that Paho supports. In this example, the
    # callbacks just print to standard out.
    client.on_connect = on_connect
    client.on_publish = on_publish
    client.on_disconnect = on_disconnect
    client.on_message = on_message_callback

    # Connect to the Google MQTT bridge.
    client.connect(mqtt_bridge_hostname, mqtt_bridge_port)

    # This is the topic that the device will receive configuration updates on.
    mqtt_config_topic = '/devices/{}/config'.format(device_id)

    # Subscribe to the config topic.
    # print('Subscribing to {}'.format(mqtt_config_topic))
    client.subscribe(mqtt_config_topic, qos=1)
    client.loop_start()  # start the loop

    # # The topic that the device will receive commands on.
    # mqtt_command_topic = '/devices/{}/commands/#'.format(device_id)

    # # Subscribe to the commands topic, QoS 1 enables message acknowledgement.
    # print('Subscribing to {}'.format(mqtt_command_topic))
    # client.subscribe(mqtt_command_topic, qos=0)

    return client
