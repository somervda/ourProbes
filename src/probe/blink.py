#Result: Blink
# The info below shows that blink is available for the current version.
# IO0  IO4  IO10 IO12~19  IO21~23 IO25~27
# cept the connection between IO2 and onboard LED, other pins need to connect to external LEDs.

import time
from machine import Pin

led = Pin(33, Pin.OUT)  # Define led pin as output

for x in range(5):
    led.value(1)  # light on led
    print("on:", x)
    time.sleep(0.5)
    led.value(0)  # light off led
    time.sleep(0.5)
    print("off:", x)
