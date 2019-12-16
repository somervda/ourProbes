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


# 2 seconds to wait for network to settle down
# ip = sta_if.ifconfig()[0]
# while ip == '0.0.0.0':
#     print("Getting IP", ip)
#     utime.sleep_ms(500)
#     ip = sta_if.ifconfig()[0]

# print("Address Details: ", sta_if.ifconfig())

print("2 second sleep...")
utime.sleep_ms(2000)
print('network config:', sta_if.ifconfig())

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

host = "spark.ape.nzix.net"

print("bing ", host, ": ", ubing.bing(host, 5, loopBackAdjustment=True))


print('disconnecting from network...')
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
