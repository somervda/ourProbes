from pythonping import ping
import time


def getLowestPing(host, samples, maxSize, timeout=5000, quiet=False):
    # Make a list containing the ping results for each of the ping samples
    pings = []
    failCnt = 0
    for x in range(samples):
        pingItem = ping(host, count=1, size=maxSize).rtt_avg
        if (pingItem == None):
            failCnt += 1
            if (failCnt >= 2):
                return None
        if (pingItem != None):
            pings.append(pingItem)
        not quiet and print(
            "getLowestPing host %s size %u sample# %u result: " % (host, maxSize, x), pingItem)
        time.sleep(.025)
    # Review results for number of successful pings and get the lowest latency
    minPing = 9999

    for pingItem in pings:
        if (minPing > pingItem):
            minPing = pingItem
    return minPing


def bing(host, samples=3, maxSize=1460, timeout=5000, quiet=False, loopBackAdjustment=True):
    # perform required number of ping samples to the host using 16byte and maxsize packets
    # also get esp32 overhead time for the same pings to loopback (no network times)
    # calculate and return bandwidth (bps) and latency (ms) based on the ping samples
    # use a modified version of the ping library from Shawwwn <shawwwn1@gmail.com>
    loopback = "127.0.0.1"

    # Drop out straight away if any getLowestPings fail, no point calculating
    # Saves buffer allocations

    # return the bps value of -1 if failed bing, second value represents error

    # Get latency
    latency = getLowestPing(host, samples, 16, timeout, quiet)
    if (latency == None):
        not quiet and print("getlowestPing failed: latency == None")
        return (-1, -10)
    if(loopBackAdjustment):
        loopback16 = getLowestPing(loopback, samples, 16, timeout, quiet)
        if (loopback16 == None):
            not quiet and print("getlowestPing failed: loopback16 == None")
            return (-1, -11)
        if (loopback16 > latency):
            latency = 0
        else:
            latency -= loopback16

    # Get Lowest loopback latencies
    if(loopBackAdjustment):
        loopback26 = getLowestPing(loopback, samples, 26, timeout, quiet)
        if (loopback26 == None):
            not quiet and print("getlowestPing failed: loopback26 == None")
            return (-1, -12)
        loopbackMax = getLowestPing(loopback, samples, maxSize, timeout, quiet)
        if (loopbackMax == None):
            not quiet and print("getlowestPing failed: loopbackMax == None")
            return (-1, -13)
    # Get Lowest target latencies
    target26 = getLowestPing(host, samples, 26, timeout, quiet)
    if (target26 == None):
        not quiet and print("getlowestPing failed: target26 == None")
        return (-1, -14)
    targetMax = getLowestPing(host, samples, maxSize, timeout, quiet)
    if (targetMax == None):
        not quiet and print("getlowestPing failed: targetMax == None")
        return (-1, -15)

    # Check Results before calculating
    if(loopBackAdjustment):
        if (loopback26 > loopbackMax):
            not quiet and print(
                "bing calculation not possable: loopback26 > loopbackMax")
            return (-1, -16)
    if (target26 > targetMax):
        not quiet and print(
            "bing calculation not possable: target26 > targetMax")
        return (-1, -17)
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
        return (-1, -18)
    not quiet and print("deltaLatency:", deltaLatency)
    deltaPayloadBits = (maxSize-26) * 8
    not quiet and print("deltaPayloadBits:", deltaPayloadBits)
    bps = int(deltaPayloadBits * 2 / deltaLatency)
    not quiet and print("bps:", bps)

    return (bps, latency)


# print("lowestPing:", getLowestPing(host="192.168.1.29", samples=5,
#                                    maxSize=2000, timeout=5000, quiet=False))

# print("bing:", bing(host="192.168.1.29", samples=5,
#                     maxSize=2000, timeout=5000, quiet=False))
