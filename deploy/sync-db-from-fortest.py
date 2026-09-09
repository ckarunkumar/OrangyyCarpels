#!/usr/bin/env python3
import os
import sys
import time
import tempfile
import getpass
import subprocess

try:
    import paramiko
except ImportError:
    print("Installing paramiko for SSH connection...")
    os.system(f"{sys.executable} -m pip install paramiko")
    import paramiko

def find_mysql_client():
    paths = [
        "/opt/homebrew/bin/mysql",
        "/usr/local/bin/mysql",
        "/usr/bin/mysql",
        "mysql"
    ]
    for p in paths:
        try:
            res = subprocess.run([p, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0:
                return p
        except Exception:
            continue
    return "mysql"

def main():
    print("==================================================================")
    print("📥 Orangyy Carpels — Pull ForTest Database to Local MySQL")
    print("==================================================================")
    
    # Local DB credentials
    local_user = "root"
    local_pass = "Sachin_99"
    local_db = "orangyycarpels"
    
    # Server connection settings
    hostname = os.environ.get("SERVER_IP", "162.19.81.108")
    port = int(os.environ.get("SERVER_PORT", "20091"))
    default_pass = "hdf1nMKKUxGq25y%"
    remote_db = "orangyycarpels_fortest"

    if len(sys.argv) > 1 and sys.argv[1].strip():
        password = sys.argv[1].strip()
    elif os.environ.get("SERVER_PASS"):
        password = os.environ.get("SERVER_PASS").strip()
    else:
        pass_input = getpass.getpass("Enter Server Root Password [Press Enter for default]: ").strip()
        password = pass_input if pass_input else default_pass

    mysql_bin = find_mysql_client()
    local_temp_sql = tempfile.NamedTemporaryFile(suffix=".sql", delete=False).name
    remote_temp_sql = f"/tmp/fortest_dump_{int(time.time())}.sql"

    try:
        # 1. Connect to Server via SSH
        print(f"\n[1/3] Connecting to server {hostname}:{port}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname, port=port, username="root", password=password, timeout=20)
        print("✔ Connected to server.")

        # 2. Export Remote Database Dump
        print(f"Exporting remote database '{remote_db}' on server...")
        dump_cmd = f"mariadb-dump -u root --single-transaction --quick --routines --triggers {remote_db} > {remote_temp_sql}"
        stdin, stdout, stderr = ssh.exec_command(dump_cmd, get_pty=True)
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            err = stderr.read().decode()
            print(f"❌ Failed to dump remote database: {err}")
            sys.exit(1)

        # 3. Download SQL Dump
        print(f"\n[2/3] Downloading database dump from server...")
        sftp = ssh.open_sftp()
        sftp.get(remote_temp_sql, local_temp_sql)
        # Clean up remote dump
        try:
            sftp.remove(remote_temp_sql)
        except Exception:
            pass
        sftp.close()
        ssh.close()

        file_size_kb = round(os.path.getsize(local_temp_sql) / 1024, 2)
        print(f"✔ Database dump downloaded ({file_size_kb} KB).")

        # 4. Import into Local Database
        print(f"\n[3/3] Importing into local MySQL database '{local_db}'...")
        
        # Ensure database exists
        create_db_cmd = [
            mysql_bin,
            f"-u{local_user}",
            f"-p{local_pass}",
            "-e",
            f"CREATE DATABASE IF NOT EXISTS {local_db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        ]
        subprocess.run(create_db_cmd, check=True)

        # Import SQL
        with open(local_temp_sql, "r") as sql_in:
            import_proc = subprocess.run(
                [mysql_bin, f"-u{local_user}", f"-p{local_pass}", local_db],
                stdin=sql_in,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            if import_proc.returncode != 0:
                print(f"❌ Failed to import into local database: {import_proc.stderr.decode()}")
                sys.exit(1)

        print("==================================================================")
        print("🎉 SUCCESS! ForTest database is 100% synchronized with Local MySQL!")
        print(f"💻 Local Database: {local_db} (mysql://localhost:3306/{local_db})")
        print("==================================================================\n")

    finally:
        if os.path.exists(local_temp_sql):
            os.remove(local_temp_sql)

if __name__ == "__main__":
    main()
