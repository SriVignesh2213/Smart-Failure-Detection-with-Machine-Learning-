import urllib.request
import urllib.error
import json

base_url = "http://127.0.0.1:5000"

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            return status, json.loads(body)
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8')
        try:
            return status, json.loads(body)
        except Exception:
            return status, body
    except Exception as e:
        return 0, str(e)

# 1. Register a new user
print("1. Registering new user on live server...")
reg_payload = {
    "name": "Live Test User",
    "email": "livetest@example.com",
    "password": "Password123"
}
# Try registering (ignore conflict if already registered)
status, res = make_request(f"{base_url}/api/auth/register", method="POST", data=reg_payload)
print(f"Register Status: {status}")
print(f"Register Response: {res}\n")

# 2. Login
print("2. Logging in on live server...")
login_payload = {
    "email": "livetest@example.com",
    "password": "Password123"
}
status, res = make_request(f"{base_url}/api/auth/login", method="POST", data=login_payload)
print(f"Login Status: {status}")
print(f"Login Response: {res}\n")

if status != 200:
    print("Login failed, aborting.")
    sys.exit(1)

tokens = res['data']['tokens']
access_token = tokens['access_token']

headers = {
    "Authorization": f"Bearer {access_token}"
}

# 3. Get profile
print("3. Fetching profile from live server...")
status, res = make_request(f"{base_url}/api/users/profile", method="GET", headers=headers)
print(f"GET Profile Status: {status}")
print(f"GET Profile Response: {res}\n")

# 4. Update profile
print("4. Updating profile on live server...")
update_payload = {
    "full_name": "Updated Live User",
    "phone": "0987654321"
}
status, res = make_request(f"{base_url}/api/users/profile", method="PUT", headers=headers, data=update_payload)
print(f"PUT Profile Status: {status}")
print(f"PUT Profile Response: {res}\n")
