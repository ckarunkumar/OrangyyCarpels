#!/usr/bin/env python3
import os
import sys
import tempfile
import getpass
import subprocess

try:
    import paramiko
except ImportError:
    print("Installing paramiko for SSH connection...")
    os.system(f"{sys.executable} -m pip install paramiko")
    import paramiko

def find_mysqldump():
    paths = [
        "/opt/homebrew/bin/mysqldump",
        "/usr/local/bin/mysqldump",
        "/usr/bin/mysqldump",
        "mysqldump"
    ]
    for p in paths:
        try:
            res = subprocess.run([p, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0:
                return p
        except Exception:
            continue
    return "mysqldump"

def main():
    print("==================================================================")
    print("🐘 Orangyy Carpels — Move Local MySQL Database to ForTest Server")
    print("==================================================================")
    
    # Local DB credentials
    local_user = "root"
    local_pass = "Sachin_99"
    local_db = "orangyycarpels"
    
    # Remote Defaults
    default_ip = "162.19.81.108"
    default_port = "20091"
    remote_db = "orangyycarpels_fortest"
    remote_db_pass = "Orangyy@Carpels2026!"

    ip_input = input(f"Enter Server IP [{default_ip}]: ").strip()
    hostname = ip_input if ip_input else default_ip
    
    port_input = input(f"Enter SSH Port [{default_port}]: ").strip()
    port = int(port_input) if port_input else int(default_port)
    
    password = getpass.getpass("Enter Server Root Password: ").strip()

    mysqldump_bin = find_mysqldump()
    temp_sql = tempfile.NamedTemporaryFile(suffix=".sql", delete=False).name

    try:
        # 1. Export Local Database Dump
        print(f"\n[1/3] Exporting local database '{local_db}'...")
        dump_cmd = [
            mysqldump_bin,
            f"-u{local_user}",
            f"-p{local_pass}",
            "--single-transaction",
            "--quick",
            "--routines",
            "--triggers",
            local_db
        ]
        with open(temp_sql, "w") as out_f:
            proc = subprocess.run(dump_cmd, stdout=out_f, stderr=subprocess.PIPE)
            if proc.returncode != 0:
                print(f"❌ Failed to dump local database: {proc.stderr.decode()}")
                sys.exit(1)
        
        file_size_kb = round(os.path.getsize(temp_sql) / 1024, 2)
        print(f"✔ Local database exported ({file_size_kb} KB).")

        # 2. Connect to Server via SSH
        print(f"\n[2/3] Connecting to server {hostname}:{port}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname, port=port, username="root", password=password, timeout=20)
        print("✔ Connected to server.")

        # 3. Upload SQL Dump
        remote_sql_path = f"/tmp/db_dump_{int(os.path.getmtime(temp_sql))}.sql"
        print("Uploading database dump to server...")
        sftp = ssh.open_sftp()
        sftp.put(temp_sql, remote_sql_path)
        sftp.close()
        print("✔ Upload complete.")

        # 4. Import into Remote Database
        print(f"\n[3/3] Importing into remote database '{remote_db}'...")
        import_cmd = f"""
        mariadb -u root << 'EOF'
        CREATE DATABASE IF NOT EXISTS {remote_db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        CREATE USER IF NOT EXISTS 'carpels_user'@'localhost' IDENTIFIED BY '{remote_db_pass}';
        GRANT ALL PRIVILEGES ON {remote_db}.* TO 'carpels_user'@'localhost';
        FLUSH PRIVILEGES;
EOF
        mariadb -u root {remote_db} < {remote_sql_path}
        rm -f {remote_sql_path}
        """
        stdin, stdout, stderr = ssh.exec_command(import_cmd, get_pty=True)
        out = stdout.read().decode()
        err = stderr.read().decode()
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code != 0:
            print(f"❌ Failed to import database on server: {err}\n{out}")
            sys.exit(1)

        print(out)
        print("==================================================================")
        print("🎉 SUCCESS! Local Database is 100% synchronized with ForTest!")
        print(f"🌐 Remote Database: {remote_db} on https://fortest.orangyy.design")
        print("==================================================================\n")
        ssh.close()

    finally:
        if os.path.exists(temp_sql):
            os.remove(temp_sql)

if __name__ == "__main__":
    main()
