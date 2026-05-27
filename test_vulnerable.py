import os

# SQL Injection
user_id = input("Enter ID: ")
query = f"SELECT * FROM users WHERE id={user_id}"

# Hardcoded Password
password = "admin123"
db_secret = "super_secret_key"

# Command Injection
host = input("Host: ")
os.system(f"ping {host}")

# Eval injection
user_code = input("Code: ")
eval(user_code)
