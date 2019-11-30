import machine
import uping
import utime
import network

print("Connecting to lan")
l = network.LAN(mdc=machine.Pin(23), mdio=machine.Pin(18), power=machine.Pin(
    12), phy_type=network.PHY_LAN8720, phy_addr=0, clock_mode=network.ETH_CLOCK_GPIO17_OUT)
l.ifconfig()
l.active(1)
while not l.isconnected():
    print(l.isconnected())
    utime.sleep_ms(500)
# There seems to be a delay between when the board reports it is connected and
# the connection being able to be used, added a sleep to compensate
utime.sleep_ms(2000)
print("Lan connection info", l.ifconfig())

print("Start pings")
for x in range(5):
    pingInfo = uping.ping("192.168.1.117", 26)
    if pingInfo == None:
        print("bad ping")
    else:
        print("time %f TTL %u size_on_wire %u" %
              (pingInfo[0], pingInfo[1],  pingInfo[2]))

print("End pings")
l.active(0)
print("End")
