#!/usr/bin/env python3
# ==============================================================================
# 📦 Orangyy Carpels — Pull Live DB Backup to Local Git Folder (1-Click)
# Target Server: carpels.orangyy.design (Database: orangyycarpels)
# Destination:   ./backups/carpels_orangyy_design_YYYY-MM-DD_HHMMSS.sql.gz
# ==============================================================================

import os
import sys
import time
import getpass
import shutil

try:
    import paramiko
except ImportError:
    print("Installing paramiko for secure SSH connection...")
    os.system(f"{sys.executable} -m pip install paramiko")
    import paramiko

def main():
    print("==================================================================")
    print("📦 Orangyy Carpels — Live DB Backup to Local Git Folder")
    print("==================================================================")

    # Project root & backup directory
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    backup_dir = os.path.join(project_root, "backups")
    os.makedirs(backup_dir, exist_ok=True)

    # Server connection settings
    hostname = os.environ.get("SERVER_IP", "162.19.81.108")
    port = int(os.environ.get("SERVER_PORT", "20091"))
    default_pass = "hdf1nMKKUxGq25y%"
    remote_db = "orangyycarpels"

    if len(sys.argv) > 1 and sys.argv[1].strip():
        password = sys.argv[1].strip()
    elif os.environ.get("SERVER_PASS"):
        password = os.environ.get("SERVER_PASS").strip()
    else:
        pass_input = getpass.getpass("Enter Server Root Password [Press Enter for default]: ").strip()
        password = pass_input if pass_input else default_pass

    timestamp = time.strftime("%Y-%m-%d_%H%M%S")
    local_backup_gz = os.path.join(backup_dir, f"carpels_orangyy_design_{timestamp}.sql.gz")
    local_latest_gz = os.path.join(backup_dir, "latest_golive_backup.sql.gz")
    remote_temp_sql = f"/tmp/golive_backup_{int(time.time())}.sql"
    remote_temp_gz = f"{remote_temp_sql}.gz"

    try:
        # 1. Connect to Server via SSH
        print(f"\n[1/3] Connecting to live server {hostname}:{port}...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname, port=port, username="root", password=password, timeout=25)
        print("✔ Connected to server successfully.")

        # 2. Export and Gzip Remote Database Dump
        print(f"[2/3] Exporting live database '{remote_db}' on server...")
        dump_cmd = (
            f"if command -v mariadb-dump > /dev/null 2>&1; then "
            f"mariadb-dump -u root --single-transaction --quick --routines --triggers {remote_db} > {remote_temp_sql}; "
            f"else "
            f"mysqldump -u root --single-transaction --quick --routines --triggers {remote_db} > {remote_temp_sql}; "
            f"fi && gzip -9 {remote_temp_sql}"
        )

        stdin, stdout, stderr = ssh.exec_command(dump_cmd, get_pty=True)
        exit_code = stdout.channel.recv_exit_status()
        if exit_code != 0:
            err = stderr.read().decode()
            print(f"❌ Failed to dump database on server: {err}")
            sys.exit(1)

        # 3. Download Compressed Backup to Local Git Folder
        print(f"[3/3] Downloading backup to local folder: {os.path.relpath(local_backup_gz, project_root)}...")
        sftp = ssh.open_sftp()
        sftp.get(remote_temp_gz, local_backup_gz)

        # Clean up temporary file on server
        try:
            sftp.remove(remote_temp_gz)
        except Exception:
            pass
        sftp.close()
        ssh.close()

        # Copy to latest symlink/file
        shutil.copyfile(local_backup_gz, local_latest_gz)

        file_size_kb = round(os.path.getsize(local_backup_gz) / 1024, 2)
        print(f"\n✔ Live Database backup successfully saved in local Git folder!")
        print(f"   📁 File:      backups/carpels_orangyy_design_{timestamp}.sql.gz ({file_size_kb} KB)")
        print(f"   📁 Shortcut:  backups/latest_golive_backup.sql.gz")
        print("==================================================================")

    except Exception as e:
        print(f"❌ Error during backup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
