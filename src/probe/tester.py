import config
import ubing
import utime
import network
from microWebCli import MicroWebCli
print('Setting up network.')
sta_if = network.WLAN(network.STA_IF)
if not sta_if.isconnected():
    print('connecting to network...')
    sta_if.active(True)
    sta_if.connect(config.wifi_config["ssid"], config.wifi_config["password"])
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

timestamp = utime.ticks_us()
print("get")
# contentBytes = MicroWebCli.GETRequest('https://www.ibm.com/')

wCli = MicroWebCli('https://www.ibm.com/us-en/?ar=1')
print('GET %s' % wCli.URL)
wCli.OpenRequest()
buf = memoryview(bytearray(1024))
resp = wCli.GetResponse()
match = False
if resp.IsSuccess():
    print("IsSussess")
    if not resp.IsClosed():
        x = resp.ReadContentInto(buf)
        if x < len(buf):
            buf = buf[:x]
        # print(buf)
        print(str(bytearray(buf), "utf-8"))
        if "a century IBM" in str(bytearray(buf), "utf-8"):
            match = True
    print('GET success with "%s" content type' % resp.GetContentType())
else:
    print('GET return %d code (%s)' %
          (resp.GetStatusCode(), resp.GetStatusMessage()))

t_elapsed = (utime.ticks_us()-timestamp) / 1000
print("elapsed:", t_elapsed)
print("match:", match)
# print("contains:", "IQVIA</title>" in contentBytes)


host = "192.168.1.29"

print("bing ", host, ": ", ubing.bing(host, 1, loopBackAdjustment=True))


print('disconnecting from network...')
sta_if.active(False)
while sta_if.isconnected():
    pass
print('Disconnected from network')
