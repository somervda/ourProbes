from pythonping import ping
# https://pypi.org/project/pythonping/#description

response = ping('192.168.1.109', verbose=False, count=1)
print(response.rtt_min_ms)
