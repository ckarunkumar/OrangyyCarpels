#!/usr/bin/env python3
import os
import sys
import tarfile
import tempfile
import time
import getpass

try:
    import paramiko
except ImportError:
    print("Installing paramiko for SSH connection...")
    os.system(f"{sys.executable} -m pip install paramiko")
    import paramiko

def run_remote_command(ssh, cmd, stream_output=True):
    print(f"\n[SERVER] >>> {cmd.strip()}")
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
    out_lines = []
    while True:
        line = stdout.readline()
        if not line:
            break
        if stream_output:
            print(line, end="")
        out_lines.append(line)
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        err_content = stderr.read().decode()
        if err_content:
            print(f"[STDERR]: {err_content}")
        raise RuntimeError(f"Command failed with exit code {exit_status}: {cmd}")
    return "".join(out_lines)

def make_tarfile(output_filename, source_dir):
    print(f">> Packaging local files from {source_dir}...")
    exclude_dirs = {"node_modules", ".git", "dist", ".DS_Store", "logs", ".system_generated"}
    with tarfile.open(output_filename, "w:gz") as tar:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_dirs or file.endswith(".log") or file.endswith(".tar.gz") or file.endswith(".db"):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                tar.add(full_path, arcname=rel_path)
    print("✔ Package created successfully.")

def main():
    print("==================================================================")
    print("🍊 Orangyy Carpels — 1-Shot Direct Deploy to ForTest Server")
    print("==================================================================")
    
    # Server connection settings
    hostname = os.environ.get("SERVER_IP", "162.19.81.108")
    port = int(os.environ.get("SERVER_PORT", "20091"))
    default_pass = "hdf1nMKKUxGq25y%"
    username = "root"

    if len(sys.argv) > 1 and sys.argv[1].strip():
        password = sys.argv[1].strip()
    elif os.environ.get("SERVER_PASS"):
        password = os.environ.get("SERVER_PASS").strip()
    else:
        pass_input = getpass.getpass("Enter Server Root Password [Press Enter for default]: ").strip()
        password = pass_input if pass_input else default_pass
    
    domain = "fortest.orangyy.design"
    db_pass = "Orangyy@Carpels2026!"
    backend_port = "5002"
    target_dir = "/var/www/orangyycarpels-fortest"
    local_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    print(f"\n>> Connecting to {username}@{hostname}:{port}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, port=port, username=username, password=password, timeout=20)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
        
    print("✔ Connected to server successfully!")

    # 1. Install Base Packages
    print("\n[1/6] Installing Server Dependencies (Nginx, MariaDB, Node.js, PM2)...")
    setup_pkgs = """
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y -q
    apt-get install -y -q curl wget git build-essential unzip mariadb-server nginx
    systemctl enable mariadb
    systemctl start mariadb
    systemctl enable nginx
    systemctl start nginx

    if ! command -v node > /dev/null 2>&1 || ! node -v | grep -q 'v20'; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y -q nodejs
    fi
    npm install -g pm2 -q
    """
    run_remote_command(ssh, setup_pkgs)

    # 2. Configure Database
    print("\n[2/6] Configuring MySQL Database (orangyycarpels_fortest)...")
    db_setup = f"""
    mariadb -u root << 'EOF'
    CREATE DATABASE IF NOT EXISTS orangyycarpels_fortest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS 'carpels_user'@'localhost' IDENTIFIED BY '{db_pass}';
    GRANT ALL PRIVILEGES ON orangyycarpels_fortest.* TO 'carpels_user'@'localhost';
    FLUSH PRIVILEGES;
EOF
    """
    run_remote_command(ssh, db_setup)

    # 3. Package and Upload Local Code Directly
    print("\n[3/6] Uploading Latest Local Code...")
    temp_archive = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False).name
    try:
        make_tarfile(temp_archive, local_dir)
        run_remote_command(ssh, f"mkdir -p {target_dir}")
        sftp = ssh.open_sftp()
        remote_tar = f"{target_dir}/app.tar.gz"
        print("Uploading archive to server...")
        sftp.put(temp_archive, remote_tar)
        sftp.close()
        print("Extracting code on server...")
        run_remote_command(ssh, f"cd {target_dir} && tar -xzf app.tar.gz && rm -f app.tar.gz")
    finally:
        if os.path.exists(temp_archive):
            os.remove(temp_archive)

    # 4. Set Environment Variables
    print("\n[4/6] Setting Environment Variables...")
    env_content = f"""DATABASE_URL="mysql://carpels_user:{db_pass}@localhost:3306/orangyycarpels_fortest"
PORT={backend_port}
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET="e972986f34fbe7a4b868e8334460d6a365778acbf7a34cd458a2210878e1b9b6"
"""
    sftp = ssh.open_sftp()
    with sftp.file(f"{target_dir}/backend/.env", "w") as f:
        f.write(env_content)
    sftp.close()

    # 5. Build Backend & Frontend
    print("\n[5/6] Building Backend & Frontend...")
    build_script = f"""
    cd {target_dir}/backend
    npm install --no-audit
    npx prisma generate
    npx prisma db push --accept-data-loss
    npx ts-node prisma/seed.ts 2>/dev/null || true
    npm run build

    cd {target_dir}/frontend
    npm install --no-audit
    npm run build
    """
    run_remote_command(ssh, build_script)

    # 6. Start PM2 & Setup Nginx
    print("\n[6/6] Starting Services & Configuring Nginx...")
    service_script = f"""
    cd {target_dir}
    mkdir -p logs
    pm2 delete orangy-backend-fortest 2>/dev/null || true
    pm2 start deploy/ecosystem.fortest.config.js
    pm2 save
    pm2 startup | tail -n 1 | bash 2>/dev/null || true

    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/nginx-selfsigned.key \
      -out /etc/nginx/ssl/nginx-selfsigned.crt \
      -subj "/C=IN/ST=Delhi/L=Delhi/O=Orangyy/OU=Studio/CN={domain}" 2>/dev/null || true

    cat << 'EOF' > /etc/nginx/sites-available/{domain}
server {{
    listen 80;
    listen [::]:80;
    listen 8080;
    listen 3000;
    listen 5000;
    listen 443 ssl;
    listen [::]:443 ssl;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    server_name {domain} _;

    root {target_dir}/frontend/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /assets/ {{
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:{backend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}}
EOF

    ln -sf /etc/nginx/sites-available/{domain} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    nginx -t
    systemctl reload nginx
    """
    run_remote_command(ssh, service_script)

    print("\n==================================================================")
    print(f"🎉 1-SHOT DEPLOYMENT COMPLETE! Orangyy Carpels is LIVE!")
    print("==================================================================")
    print(f"🌐 Application URL: https://{domain}")
    print(f"👤 Super Admin    : arun@orangyy.design")
    print(f"🔑 Password       : Sachin_99")
    print("==================================================================\n")
    ssh.close()

if __name__ == "__main__":
    main()
