import machine
import ubing
import uping
import utime
import network


print("Connecting to lan")
l = network.LAN(mdc=machine.Pin(23), mdio=machine.Pin(18), power=machine.Pin(
    12), phy_type=network.PHY_LAN8720, phy_addr=0, clock_mode=network.ETH_CLOCK_GPIO17_OUT)
l.ifconfig()
l.active(1)
while not l.isconnected():
    print("Connected: ", l.isconnected())
    utime.sleep_ms(500)

# Need to wait until the network address gets set on th device so
# loop until a valid addess is registered (check first  ifConfig value, it will be the assigned IP)

ip = l.ifconfig()[0]
while ip == '0.0.0.0':
    print("Getting IP", ip)
    utime.sleep_ms(1000)
    ip = l.ifconfig()[0]

print("Address Details: ", l.ifconfig())
print("Start pings")
for x in range(5):
    pingInfo = uping.ping("192.168.1.251", 1480)
    if pingInfo == None:
        print("bad ping")
    else:
        print("time %f TTL %u size_on_wire %u" %
              (pingInfo[0], pingInfo[1],  pingInfo[2]))

print("bing 192.168.1.251: ", ubing.bing("192.168.1.251", 5))


print("End pings")
print('disconnecting from network...')
l.active(False)
while l.isconnected():
    pass
print('Disconnected from network')
