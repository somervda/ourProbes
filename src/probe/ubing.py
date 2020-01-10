# µBing (MicroBing) for MicroPython
# copyright (c) 2019 David Somerville <david.a.somerville@outlook.com>
# License: MIT

import uping as uping
import utime


def getLowestPing(host, samples, size, timeout=5000, quiet=False):
    # Make a list containing the ping results for each of the ping samples
    pings = []
    for x in range(samples):
        ping = uping.ping(host, size, timeout)
        pings.append(ping)
        not quiet and print(
            "getLowestPing host %s size %u sample# %u result: " % (host, size, x), ping)
        utime.sleep_ms(25)
    # Review results for number of successful pings and get the lowest latency
    minPing = 9999
    failCnt = 0
    for ping in pings:

        if (ping == None):
            failCnt += 1
        elif (minPing > ping[0]):
            minPing = ping[0]
    if (failCnt >= 2):
        return None
    else:
        return minPing


def bing(host, samples=3, maxSize=1460, timeout=5000, quiet=False, loopBackAdjustment=True):
    # perform required number of ping samples to the host using 16byte and maxsize packets
    # also get esp32 overhead time for the same pings to loopback (no network times)
    # calculate and return bandwidth (bps) and latency (ms) based on the ping samples
    # use a modified version of the uping library from Shawwwn <shawwwn1@gmail.com>
    loopback = "127.0.0.1"

    # Get latency
    latency = getLowestPing(host, samples, 16, timeout, quiet)
    # Get Lowest loopback latencies
    if(loopBackAdjustment):
        loopback26 = getLowestPing(loopback, samples, 26, timeout, quiet)
        loopbackMax = getLowestPing(loopback, samples, maxSize, timeout, quiet)
    # Get Lowest target latencies
    target26 = getLowestPing(host, samples, 26, timeout, quiet)
    targetMax = getLowestPing(host, samples, maxSize, timeout, quiet)

    # Check Results before calculating

    if(loopBackAdjustment):
        if (loopback26 == None):
            not quiet and print("getlowestPing failed: loopback26 == None")
            return None
        if (loopbackMax == None):
            not quiet and print("getlowestPing failed: loopbackMax == None")
            return None
        if (loopback26 > loopbackMax):
            not quiet and print(
                "bing calculation not possable: loopback26 > loopbackMax")
            return None
    if (target26 == None):
        not quiet and print("getlowestPing failed: target26 == None")
        return None
    if (targetMax == None):
        not quiet and print("getlowestPing failed: targetMax == None")
        return None
    if (latency == None):
        not quiet and print("getlowestPing failed: latency == None")
        return None
    if (target26 > targetMax):
        not quiet and print(
            "bing calculation not possable: target26 > targetMax")
        return None
    targetDelta = (targetMax - target26)
    not quiet and print("targetDelta:", targetDelta)
    if(loopBackAdjustment):
        loopbackDelta = loopbackMax - loopback26
        not quiet and print(" loopbackDelta:", loopbackDelta)

    if(loopBackAdjustment):
        deltaLatency = targetDelta - loopbackDelta
    else:
        deltaLatency = targetMax - target26
    if (deltaLatency <= 0):
        not quiet and print(
            "bing calculation not possable: deltaLatency <= 0")
        return None
    not quiet and print("deltaLatency:", deltaLatency)
    deltaPayloadBits = (maxSize-26) * 8
    not quiet and print("deltaPayloadBits:", deltaPayloadBits)
    bps = int((1000/(deltaLatency)) * deltaPayloadBits * 2)
    not quiet and print("bps:", bps)

    return (bps, latency)
