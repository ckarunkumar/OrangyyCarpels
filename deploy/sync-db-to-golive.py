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
    print("🐘 Orangyy Carpels — Move Local MySQL Database to GoLive Production")
    print("==================================================================")
    
    # Local DB credentials
    local_user = "root"
    local_pass = "Sachin_99"
    local_db = "orangyycarpels"
    
    # Server connection settings
    hostname = os.environ.get("SERVER_IP", "162.19.81.108")
    port = int(os.environ.get("SERVER_PORT", "20091"))
    default_pass = "hdf1nMKKUxGq25y%"
    remote_db = "orangyycarpels"
    remote_db_pass = "Orangyy@Carpels2026!"

    if len(sys.argv) > 1 and sys.argv[1].strip():
        password = sys.argv[1].strip()
    elif os.environ.get("SERVER_PASS"):
        password = os.environ.get("SERVER_PASS").strip()
    else:
        pass_input = getpass.getpass("Enter Server Root Password [Press Enter for default]: ").strip()
        password = pass_input if pass_input else default_pass

    mysqldump_bin = find_mysqldump()
    temp_sql = tempfile.NamedTemporaryFile(suffix=".sql", delete=False).name

    try:
        # 1. Export Local Database Dump
        print("\n[1/4] 📦 Exporting local MySQL database dump...")
        dump_cmd = [
            mysqldump_bin,
            f"-u{local_user}",
            f"-p{local_pass}",
            "--databases", local_db,
            "--routines",
            "--triggers",
            "--single-transaction",
            "--add-drop-database",
            "--result-file=" + temp_sql
        ]
        res = subprocess.run(dump_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if res.returncode != 0:
            print(f"❌ Failed to export local database dump: {res.stderr.decode('utf-8')}")
            sys.exit(1)
        
        file_size = os.path.getsize(temp_sql)
        print(f"✔ Local database dump created: {temp_sql} ({file_size / 1024:.2f} KB)")

        # 2. Connect to Server over SSH
        print(f"\n[2/4] 🔐 Connecting to GoLive VPS ({hostname}:{port})...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=hostname, port=port, username="root", password=password, timeout=15)
        print("✔ SSH Connection established.")

        # 3. Upload Database Dump
        remote_temp_sql = f"/tmp/golive_db_import_{os.getpid()}.sql"
        print(f"\n[3/4] 🚀 Uploading dump file to server ({remote_temp_sql})...")
        sftp = ssh.open_sftp()
        sftp.put(temp_sql, remote_temp_sql)
        sftp.close()
        print("✔ Dump file uploaded to server.")

        # 4. Create Pre-Import Backup on Server & Import
        print(f"\n[4/4] 🔄 Creating safety backup and importing into '{remote_db}' on GoLive...")
        remote_commands = f"""
        mkdir -p /var/backups/orangyycarpels
        if command -v mysqldump > /dev/null 2>&1; then
            mysqldump {remote_db} > /var/backups/orangyycarpels/backup_pre_sync_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || true
        fi
        mysql -u carpels_user -p'{remote_db_pass}' {remote_db} < {remote_temp_sql} 2>/dev/null || mysql {remote_db} < {remote_temp_sql}
        rm -f {remote_temp_sql}
        """
        stdin, stdout, stderr = ssh.exec_command(remote_commands)
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("✔ Database imported successfully into GoLive Production!")
        else:
            err_output = stderr.read().decode('utf-8')
            print(f"❌ Error during remote database import: {err_output}")
            sys.exit(1)

        # 5. Reload GoLive PM2 Process to sync connections
        print("\n>> Reloading GoLive backend PM2 process...")
        ssh.exec_command("pm2 reload orangy-backend-golive 2>/dev/null || true")

        print("\n==================================================================")
        print("🎉 GoLive Production Database Migration Successful!")
        print(f"🌐 Remote Database: {remote_db} on https://carpels.orangyy.design")
        print("==================================================================\n")

    finally:
        if os.path.exists(temp_sql):
            os.remove(temp_sql)

if __name__ == "__main__":
    main()
