import urllib.request
try:
    r = urllib.request.urlopen('http://localhost:8000/api/health', timeout=5)
    print(r.read().decode())
except Exception as e:
    print('Error:', e)