#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:4000/api/v1"

print("🧪 Testing Settings Update Functionality")
print("=" * 50)
print()

# 1. Login
print("1. Logging in as admin...")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@test.com", "password": "Test@123"}
)

if login_response.status_code != 201:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Login successful")
print()

# 2. Get current value
print("2. Getting current value of site_name...")
get_response = requests.get(f"{BASE_URL}/settings/site_name", headers=headers)
if get_response.status_code == 200:
    current_value = get_response.json()["data"]["value"]
    print(f"   Current value: {current_value}")
    print("   ✅ Successfully retrieved setting")
else:
    print(f"   ❌ Failed to get setting: {get_response.status_code}")
    print(f"   {get_response.text}")
print()

# 3. Update setting
print("3. Testing PATCH /api/v1/settings/site_name...")
update_response = requests.patch(
    f"{BASE_URL}/settings/site_name",
    headers=headers,
    json={"value": "Luxury E-commerce - Test Update"}
)

if update_response.status_code in [200, 201]:
    print("   ✅ Update successful")
    print(f"   Response: {json.dumps(update_response.json(), indent=2)}")
else:
    print(f"   ❌ Update failed: {update_response.status_code}")
    print(f"   {update_response.text}")
print()

# 4. Verify update
print("4. Verifying update...")
verify_response = requests.get(f"{BASE_URL}/settings/site_name", headers=headers)
if verify_response.status_code == 200:
    new_value = verify_response.json()["data"]["value"]
    print(f"   New value: {new_value}")
    if new_value == "Luxury E-commerce - Test Update":
        print("   ✅ Value updated correctly")
    else:
        print("   ❌ Value mismatch")
else:
    print(f"   ❌ Verification failed: {verify_response.status_code}")
print()

# 5. Revert to original
print("5. Reverting to original value...")
revert_response = requests.patch(
    f"{BASE_URL}/settings/site_name",
    headers=headers,
    json={"value": current_value}
)

if revert_response.status_code in [200, 201]:
    print("   ✅ Reverted successfully")
else:
    print(f"   ❌ Revert failed: {revert_response.status_code}")
print()

print("✅ Settings update test complete!")
