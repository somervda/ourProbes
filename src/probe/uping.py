# µPing (MicroPing) for MicroPython
# copyright (c) 2018 Shawwwn <shawwwn1@gmail.com>
# License: MIT

# Internet Checksum Algorithm
# Author: Olav Morken
# https://github.com/olavmrk/python-ping/blob/master/ping.py
# @data: bytes


def checksum(data):
    if len(data) & 0x1:  # Odd number of bytes
        data += b'\0'
    cs = 0
    for pos in range(0, len(data), 2):
        b1 = data[pos]
        b2 = data[pos + 1]
        cs += (b1 << 8) + b2
    while cs >= 0x10000:
        cs = (cs & 0xffff) + (cs >> 16)
    cs = ~cs & 0xffff
    return cs


def getRandomString(size):
    import urandom
    printableCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890ABCBEFHIJKLMNOPQRSTUVWXYZ'
    return ''.join(urandom.choice(printableCharacters) for x in range(size))


def ping(host, size=16, timeout=5000):
    import utime
    import uselect
    import uctypes
    import usocket
    import ustruct
    import urandom

    # Under 26 bytes, the echo responses may be a different size
    # from the echo request so best to do all two way
    # measurements based on at least 26 byte payloads.

    # 16 bytes seem to be the minimum for relable timings from experimenting
    assert size >= 16, "pkt size too small, must be > 16"

    # prepare packet

    # Use a randomized string so that
    # network data compression does not impact ping times
    pkt = getRandomString(size).encode()

    # Build the packet header
    # See http://www.networksorcery.com/enp/protocol/icmp/msg8.htm for details
    pkt_desc = {
        "type": uctypes.UINT8 | 0,
        "code": uctypes.UINT8 | 1,
        "checksum": uctypes.UINT16 | 2,
        "id": uctypes.UINT16 | 4,
        "seq": uctypes.INT16 | 6,
        "timestamp": uctypes.UINT64 | 8,
    }  # packet header descriptor
    h = uctypes.struct(uctypes.addressof(pkt), pkt_desc, uctypes.BIG_ENDIAN)
    h.type = 8  # ICMP_ECHO_REQUEST
    h.code = 0
    h.checksum = 0
    h.id = urandom.randint(0, 65535)
    h.seq = 1

    # init socket
    sock = usocket.socket(usocket.AF_INET, usocket.SOCK_RAW, 1)
    sock.setblocking(0)
    sock.settimeout(timeout/1000)
    addr = usocket.getaddrinfo(host, 1)[0][-1][0]  # ip address
    sock.connect((addr, 1))
    t_elapsed = -1
    finish = False
    size_on_wire = 0

    # send packet
    h.checksum = 0
    h.seq = 1
    h.timestamp = utime.ticks_us()
    h.checksum = checksum(pkt)
    if sock.send(pkt) != size:
        # Failed : exit with no result
        return None

    t_timeout = utime.ticks_us() + (timeout * 1000)
    while t_timeout > utime.ticks_us() and not finish:
        # recv packet, try to receive the icmp packet until timeout
        while 1:
            socks, _, _ = uselect.select([sock], [], [], 0)
            if socks:
                resp = socks[0].recv(4096)
                resp_mv = memoryview(resp)
                h2 = uctypes.struct(uctypes.addressof(
                    resp_mv[20:]), pkt_desc, uctypes.BIG_ENDIAN)
                size_on_wire = len(resp)
                # TODO: validate checksum (optional)
                if h2.type == 0 and h2.id == h.id:  # 0: ICMP_ECHO_REPLY
                    t_elapsed = (utime.ticks_us()-h2.timestamp) / 1000
                    ttl = ustruct.unpack('!B', resp_mv[8:9])[0]  # time-to-live
                    # print("%u bytes from %s: ttl=%u, time=%f ms" %
                    #       (len(resp), addr, ttl, t_elapsed))
                    finish = True
                    break
            else:
                break

    # close
    sock.close()
    if t_elapsed == -1:
        # Timed out
        return None
    else:
        # Note: From wireshark actual size of datagram on wire is 14 bytes larger than recv length (Ethernet Frame header)
        return t_elapsed, ttl, (size_on_wire + 14)
