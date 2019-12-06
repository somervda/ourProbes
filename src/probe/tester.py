import wifiSSID
import ubing
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

# When using clumsy as a network emulator see http://jagt.github.io/clumsy/index.html
# this filter (ip.DstAddr == 192.168.1.171 or ip.SrcAddr == 192.168.1.171) and ip.Length > 600 and icmp
# will support getting different ping times for different packets (to test bing) - 50 results in about 100kbps bing

# for x in range(2):
#     pingInfo = uping.ping("192.168.1.117", 16)
#     if pingInfo == None:
#         print("bad ping")
#     else:
#         print("time %f TTL %u size_on_wire %u" %
#               (pingInfo[0], pingInfo[1],  pingInfo[2]))

print("bing ourDars: ", ubing.bing("192.168.1.68", 20))


print('disconnecting from network...')
utime.sleep_ms(60000)
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
