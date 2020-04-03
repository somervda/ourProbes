import requests
import time


def webPage(target, match,  quiet=True):
    not quiet and print("webPage start")
    timestamp = time.perf_counter()
    try:
        resp = requests.get(url=target, timeout=10)
    except:
        # Catch Timeout error - force a 404 not found code
        return 5000, False, 404
    matched = False
    if resp.ok:
        not quiet and print("webPage IsSuccess")
        if match == "" or match in resp.text:
            matched = True
    else:
        not quiet and print('webPage GET return %d code (%s)' %
                            (resp.status_code, resp.reason))

    # Get ttfb in ms
    t_elapsed = (time.perf_counter() - timestamp) * 1000
    not quiet and print("elapsed:", t_elapsed)
    not quiet and print("matched:", matched)
    return t_elapsed, matched, resp.status_code


# print(webPage("https://covid19.clinicalresearch.com/#!/", "our", False))
