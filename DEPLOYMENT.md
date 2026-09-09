# Orangyy Carpels — Deployment Guide & Server Management

This guide provides step-by-step instructions for deploying and managing the **Orangyy Carpels** application across two completely isolated environments on your AIC Cloud VPS:

1. **ForTest**: `https://fortest.orangyy.design` (Branch: `Local`)
2. **GoLive (Production)**: `https://carpels.orangyy.design` (Branch: `GoLive`)

---

## 1. Environment Architecture & Isolation Rules

> [!IMPORTANT]
> **Strict Isolation Principle**: ForTest and GoLive must **NEVER** share a database, `.env` file, PM2 process, filesystem directory, or log file.

| Parameter | ForTest Environment | GoLive Production Environment |
| :--- | :--- | :--- |
| **Public URL** | `https://fortest.orangyy.design` | `https://carpels.orangyy.design` |
| **Git Branch** | `Local` | `GoLive` |
| **Server Directory** | `/var/www/orangyycarpels-fortest` | `/var/www/orangyycarpels` |
| **Backend Internal Port** | `5002` | `5001` |
| **PM2 Process Name** | `orangy-backend-fortest` | `orangy-backend-golive` |
| **Ecosystem File** | `deploy/ecosystem.fortest.config.js` | `deploy/ecosystem.golive.config.js` |
| **Database Name** | `orangyycarpels_fortest` | `orangyycarpels` |
| **Database User** | `carpels_fortest_user` | `carpels_user` |
| **Nginx Config** | `/etc/nginx/sites-available/fortest.orangyy.design` | `/etc/nginx/sites-available/carpels.orangyy.design` |
| **Log Directory** | `/var/www/orangyycarpels-fortest/logs/` | `/var/www/orangyycarpels/logs/` |

---

## 2. Server Access

Connect to the VPS using your SSH client:

```bash
ssh root@162.19.81.108 -p 20091
```

*(Your terminal will securely prompt you for your root password.)*

---

## 3. One-Time Initial Server Setup

Follow these steps once when setting up or reprovisioning the server.

### Step 3.1: Create Isolated Databases and Users

Log into MySQL on the server:

```bash
sudo mysql
```

Run the following SQL commands to create independent databases with dedicated users:

```sql
-- 1. GoLive Production Database
CREATE DATABASE IF NOT EXISTS orangyycarpels CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'carpels_user'@'localhost' IDENTIFIED BY '<STRONG_GOLIVE_DB_PASSWORD>';
GRANT ALL PRIVILEGES ON orangyycarpels.* TO 'carpels_user'@'localhost';

-- 2. ForTest Database
CREATE DATABASE IF NOT EXISTS orangyycarpels_fortest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'carpels_fortest_user'@'localhost' IDENTIFIED BY '<STRONG_FORTEST_DB_PASSWORD>';
GRANT ALL PRIVILEGES ON orangyycarpels_fortest.* TO 'carpels_fortest_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

---

### Step 3.2: Clone Repositories into Separate Directories

```bash
# Clone GoLive directory on GoLive branch
git clone -b GoLive https://github.com/ckarunkumar/OrangyyCarpels.git /var/www/orangyycarpels

# Clone ForTest directory on Local branch
git clone -b Local https://github.com/ckarunkumar/OrangyyCarpels.git /var/www/orangyycarpels-fortest
```

---

### Step 3.3: Configure Environment Variables

#### For GoLive (`/var/www/orangyycarpels/backend/.env`):
```ini
DATABASE_URL="mysql://carpels_user:<STRONG_GOLIVE_DB_PASSWORD>@localhost:3306/orangyycarpels"
PORT=5001
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET="<GENERATE_RANDOM_64_CHAR_SECRET_FOR_GOLIVE>"
```

#### For ForTest (`/var/www/orangyycarpels-fortest/backend/.env`):
```ini
DATABASE_URL="mysql://carpels_fortest_user:<STRONG_FORTEST_DB_PASSWORD>@localhost:3306/orangyycarpels_fortest"
PORT=5002
HOST=0.0.0.0
NODE_ENV=production
SESSION_SECRET="<GENERATE_RANDOM_64_CHAR_SECRET_FOR_FORTEST>"
```

---

### Step 3.4: Configure Nginx Server Blocks

Copy the Nginx configuration files:

```bash
# GoLive
cp /var/www/orangyycarpels/deploy/nginx-golive.conf /etc/nginx/sites-available/carpels.orangyy.design
ln -sf /etc/nginx/sites-available/carpels.orangyy.design /etc/nginx/sites-enabled/

# ForTest
cp /var/www/orangyycarpels-fortest/deploy/nginx-fortest.conf /etc/nginx/sites-available/fortest.orangyy.design
ln -sf /etc/nginx/sites-available/fortest.orangyy.design /etc/nginx/sites-enabled/

# Remove default site and restart Nginx
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 4. Manual Deployment Workflow

### Scenario A: Deploying to ForTest (`Local` Branch)

When you have made and tested changes in the `Local` branch and pushed to GitHub:

1. Connect to the VPS:
   ```bash
   ssh root@162.19.81.108 -p 20091
   ```

2. Navigate to the ForTest directory and run the deployment script:
   ```bash
   cd /var/www/orangyycarpels-fortest
   bash deploy/deploy-fortest.sh
   ```

**What this script does:**
* Verifies active branch is `Local` (aborts if not).
* Pulls latest commits from `origin/Local`.
* Installs dependencies reproducibly with lockfile (`npm install --no-audit`).
* Generates Prisma client and applies versioned migrations (`npx prisma migrate deploy`).
* Compiles backend and frontend.
* Reloads only the `orangy-backend-fortest` PM2 process.
* Verifies local backend health on port `5002` and checks public URL.

---

### Scenario B: Deploying to GoLive (`GoLive` Branch)

When you merge approved changes from `Local` into `GoLive` on GitHub:

1. Connect to the VPS:
   ```bash
   ssh root@162.19.81.108 -p 20091
   ```

2. Navigate to the GoLive directory and run the deployment script:
   ```bash
   cd /var/www/orangyycarpels
   bash deploy/deploy-golive.sh
   ```

**What this script does:**
* Verifies active branch is `GoLive` (aborts if not).
* **Creates a timestamped gzip backup** of the production MySQL database in `/var/backups/orangyycarpels/`.
* Pulls latest commits from `origin/GoLive`.
* Installs dependencies reproducibly with lockfile (`npm install --no-audit`).
* Generates Prisma client and applies versioned migrations (`npx prisma migrate deploy`).
* Compiles backend and frontend.
* Reloads only the `orangy-backend-golive` PM2 process.
* Verifies backend health on port `5001` and checks public URL.

---

## 5. Verification & Health Checks

After running either deployment, you can verify the status directly on the server:

```bash
# Check PM2 process status
pm2 list

# Check real-time logs
pm2 logs orangy-backend-fortest --lines 20
pm2 logs orangy-backend-golive --lines 20

# Test local backend health endpoints
curl -s -I http://127.0.0.1:5001/api/v1/health   # GoLive (Port 5001)
curl -s -I http://127.0.0.1:5002/api/v1/health   # ForTest (Port 5002)
```

---

## 6. Rollback Procedures (GoLive)

If an issue occurs after a production deployment:

1. Identify the backup file from `/var/backups/orangyycarpels/`:
   ```bash
   ls -lt /var/backups/orangyycarpels/
   ```

2. Restore the database:
   ```bash
   gunzip < /var/backups/orangyycarpels/backup_orangyycarpels_YYYYMMDD_HHMMSS.sql.gz | mysql -u carpels_user -p orangyycarpels
   ```

3. Revert code to the previous Git commit and rebuild:
   ```bash
   cd /var/www/orangyycarpels
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   cd backend && npm run build
   cd ../frontend && npm run build
   cd ..
   pm2 reload deploy/ecosystem.golive.config.js
   ```
