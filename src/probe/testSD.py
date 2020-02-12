# from machine import SDCard
# import os
# # # clk cmd and dat0 pins must be passed along with
# # # their respective alternate functions
# sd = SDCard(pins=('GP14', 'GP15', 'GP02'))
# os.mount(sd)

from machine import SPI, Pin
import sdcard
import os
spisd = SPI(-1, sck=Pin(14), mosi=Pin(15), miso=Pin(2))
sd = sdcard.SDCard(spisd, Pin(13))
os.mount(sd, '/sd')
print(os.listdir('sd'))
os.mkdir('/sd/newFolder')
print(os.listdir('sd'))
