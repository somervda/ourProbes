import wifiSSID
import uping
import utime


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

# 2 seconds to wait for network to settle down
print("2 second sleep...")
utime.sleep_ms(2000)

for x in range(6):
    pingInfo = uping.ping("127.0.0.1")
    if pingInfo == None:
        print("bad ping")
    else:
        print("time %f TTL %u size_on_wire %u" %
              (pingInfo[0], pingInfo[1],  pingInfo[2]))
#uping.ping("somerville.noip.me", 1, 5000, 10, False, 16)
#uping.ping("127.0.0.1", 1, 5000, 10, False, 16)
#uping.ping("127.0.0.1", 1, 5000, 10, False, 16)

print('disconnecting from network...')
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
