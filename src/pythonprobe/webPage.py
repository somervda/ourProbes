import requests
import time


def webPage(target, match,  quiet=True):
    not quiet and print("webPage start")
    timestamp = time.perf_counter()
    resp = requests.get(url=target)
    matched = False
    if resp.ok:
        not quiet and print("webPage IsSuccess")
        if match == "" or match in resp.text:
            matched = True
    else:
        not quiet and print('webPage GET return %d code (%s)' %
                            (resp.status_code, resp.reason))

    t_elapsed = time.perf_counter() - timestamp
    not quiet and print("elapsed:", t_elapsed)
    not quiet and print("matched:", matched)
    return t_elapsed, matched, resp.status_code


# print(webPage("	https://kiwicornerdairy.com/", "our", False))
