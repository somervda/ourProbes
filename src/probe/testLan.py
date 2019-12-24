import machine
import ubing
import uping
import utime
import network


print("Connecting to lan")
l = network.LAN(mdc=machine.Pin(23), mdio=machine.Pin(18), power=machine.Pin(
    12), phy_type=network.PHY_LAN8720, phy_addr=0, clock_mode=network.ETH_CLOCK_GPIO17_OUT)
l.ifconfig()
l.active(True)
while not l.isconnected():
    print("Connecting...")
    utime.sleep_ms(500)
print("Connected!")

# Need to wait until the network address gets set on th device so
# loop until a valid addess is registered (check first  ifConfig value, it will be the assigned IP)

ip = l.ifconfig()[0]
while ip == '0.0.0.0':
    print("Getting IP", ip)
    utime.sleep_ms(1000)
    ip = l.ifconfig()[0]

print("Address Details: ", l.ifconfig())

# utime.sleep_ms(10000)

host = "192.168.1.117"
print("Start pings: ", host)
for x in range(5):
    pingInfo = uping.ping(host, 26)
    if pingInfo == None:
        print("bad ping")
    else:
        print("time %f TTL %u size_on_wire %u" %
              (pingInfo[0], pingInfo[1],  pingInfo[2]))
print("End pings")

print("bing ", host, ": ", ubing.bing(host, 5, loopBackAdjustment=True))

print('disconnecting from network...')

l.active(False)
while l.isconnected():
    pass

print('Disconnected from network')
