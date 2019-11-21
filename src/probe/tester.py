import wifiSSID
import uping


import network
print('Setting up network.')
sta_if = network.WLAN(network.STA_IF)
if not sta_if.isconnected():
    print('connecting to network...')
    sta_if.active(True)
    sta_if.connect(wifiSSID.guestSSId, wifiSSID.guestPassword)
    while not sta_if.isconnected():
        pass
print('network config:', sta_if.ifconfig())


uping.ping("192.168.1.29", 3, 5000, 10, False, 16)
uping.ping("192.168.1.29", 3, 5000, 10, False, 1480)
uping.ping("127.0.0.1", 3, 5000, 10, False, 16)
uping.ping("127.0.0.1", 3, 5000, 10, False, 1480)

print('disconnecting from network...')
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
