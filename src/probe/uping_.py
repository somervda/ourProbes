# Stubbed out ping to test bing without network or esp32
# bing should return 1000/(50-10) * 1434 * 8 * 2 = 573,600 bps
# assuming the default max ping size of 1460 bytes


def ping(host, size=16, timeout=5000):
    if (host == '127.0.0.1'):
        if (size == 16):
            return 5, 64, 60
        elif (size == 26):
            return 5, 64, 60
        else:
            return 10, 64, 1494
    if (size == 16):
        return 10, 64, 60
    elif (size == 26):
        return 15, 64, 60
    else:
        return 60, 64, 1494
