# µBing (MicroBing) for MicroPython
# copyright (c) 2019 David Somerville <david.a.somerville@outlook.com>
# License: MIT

import uping_


def getLowestPing(host, samples, size, timeout=5000, quiet=True):
    # Make a list of ping results
    pings = []
    for x in range(samples):
        pings.append(uping_.ping(host, size, timeout))
    # Review results for number of successful pings and get the lowest latency
    minPing = 9999
    failCnt = 0
    for ping in pings:
        not quiet and print(
            "getLowestPing host %s size %u result" % (host, size), ping)

        if (ping == None):
            failCnt += 1
        elif (minPing > ping[0]):
            minPing = ping[0]
    if (failCnt >= 2):
        return None
    else:
        return minPing


def bing(host, samples=3, timeout=5000, quiet=False):
    # perform required number of ping samples to the host using 16byte and maxsize packets
    # also get esp32 overhead time for the same pings to localhost (no network times)
    # calculate and return bandwidth (bps) and latency (ms) based on the ping samples
    # use a modified version of the uping library from Shawwwn <shawwwn1@gmail.com>

    # Get latency
    latency = getLowestPing(host, samples, 16, timeout)
    # Get Lowest loopback latencies
    loopback26 = getLowestPing("127.0.0.1", samples, 26, timeout)
    loopback1480 = getLowestPing("127.0.0.1", samples, 1480, timeout)
    # Get Lowest target latencies
    target26 = getLowestPing(host, samples, 26, timeout)
    target1480 = getLowestPing(host, samples, 1480, timeout)

    # Check Results before calculating

    if (loopback26 == None):
        not quiet and print("getlowestPing failed: loopback26 == None")
        return None
    if (loopback1480 == None):
        not quiet and print("getlowestPing failed: loopback1480 == None")
        return None
    if (target26 == None):
        not quiet and print("getlowestPing failed: target26 == None")
        return None
    if (target1480 == None):
        not quiet and print("getlowestPing failed: target1480 == None")
        return None
    if (latency == None):
        not quiet and print("getlowestPing failed: latency == None")
        return None
    if (loopback26 > loopback1480):
        not quiet and print(
            "bing calculation not possable: loopback26 > loopback1480")
        return None
    if (target26 > target1480):
        not quiet and print(
            "bing calculation not possable: target26 > target1480")
        return None
    if (loopback26 > target26):
        not quiet and print(
            "bing calculation not possable: loopback26 > target26")
        return None
    if (loopback1480 > target1480):
        not quiet and print(
            "bing calculation not possable: loopback1480 > target1480")
        return None
    deltaLatency = ((target1480 - loopback1480) - (target26 - loopback26))
    if (deltaLatency <= 0):
        not quiet and print(
            "bing calculation not possable: deltaLatency <= 0")
        return None
    not quiet and print("deltaLatency:", deltaLatency)
    deltaPayloadBits = (1480-26) * 8
    not quiet and print("deltaPayloadBits:", deltaPayloadBits)
    bps = int((1000/(deltaLatency)) * deltaPayloadBits * 2)
    not quiet and print("bps:", bps)

    return (bps, latency)
