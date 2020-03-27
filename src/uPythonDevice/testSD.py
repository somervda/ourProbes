from machine import SPI, Pin
import sdcard
import os
spisd = SPI(-1, sck=Pin(14), mosi=Pin(15), miso=Pin(2))
sdPresent = True
try:
    sd = sdcard.SDCard(spisd, Pin(13))
except:
    sdPresent = False
print("1 sd present:", sdPresent)
if sdPresent:
    os.mount(sd, '/sd')
    print("/ - ", os.listdir(''))
    print("/sd - "os.listdir('/sd'))
