# Orangyy Carpels — GoLive Deployment & Google Drive Backup Guide

This guide details how to:
1. Deploy / update code from the `GoLive` branch to `https://carpels.orangyy.design`
2. Move / sync the MySQL database to GoLive production
3. Set up automated Google Drive backups with rotation

---

## 1. Initial 1-Time Setup on Server (First-Time Only)

Since `/var/www/orangyycarpels` is a brand-new production directory, run this command **once** on the server (`root@orangyy-carpels:~#`):

```bash
git clone -b GoLive https://github.com/ckarunkumar/OrangyyCarpels.git /var/www/orangyycarpels
cd /var/www/orangyycarpels
bash deploy/setup-golive-oneclick.sh
```

---

## 2. Deploy / Update Code to Production (After Initial Setup)

### Option A: From inside the Server
```bash
cd /var/www/orangyycarpels
bash deploy/deploy-golive.sh
```

### Option B: Quick 1-Command Server Update
Whenever you push updates to the `GoLive` branch:
```bash
ssh root@162.19.81.108 -p 20091 "bash /var/www/orangyycarpels/deploy/update-golive.sh"
```

---

## 2. Move Database to GoLive Production

To sync/push your local MySQL database (`orangyycarpels`) directly to the GoLive production server:

```bash
python3 deploy/sync-db-to-golive.py
```
*(Press Enter when prompted for default root password).*

This script:
1. Dumps the local `orangyycarpels` database.
2. Securely uploads the dump to the production VPS over SSH.
3. Takes a pre-sync safety backup on the server before applying.
4. Imports the data into the production database `orangyycarpels`.
5. Automatically reloads PM2 to refresh database connection pools.

---

## 3. Automated Google Drive Database Backups

The system includes automated database backups with offsite storage to Google Drive.

### Features:
* **Automated Daily Dumps**: Compresses the production `orangyycarpels` MySQL database using `gzip`.
* **Offsite Cloud Sync**: Automatically uploads backups to Google Drive in folder `OrangyyCarpels_DB_Backups/`.
* **Automated Retention & Rotation**: Automatically cleans local backups older than 14 days and Google Drive backups older than 30 days.
* **Logging**: Detailed execution logs at `/var/log/carpels_db_backup.log`.

---

### Step-by-Step Setup on the Server:

1. **SSH into the server:**
   ```bash
   ssh root@162.19.81.108 -p 20091
   ```

2. **Run the 1-Click Google Drive Setup:**
   ```bash
   bash /var/www/orangyycarpels/deploy/setup-gdrive-backup.sh
   ```

3. **Authorize Google Drive (One-time):**
   When prompted, run `rclone config`:
   * Type `n` for new remote $\rightarrow$ name it `gdrive`.
   * Type `drive` for Google Drive.
   * Leave `client_id` and `client_secret` blank.
   * Choose Scope `1` (Full access).
   * Follow the URL in your browser to grant access with your Google account.
   * Paste the verification code into the terminal $\rightarrow$ confirm and exit (`q`).

4. **Test the Backup Instantly:**
   ```bash
   bash /var/www/orangyycarpels/deploy/backup-db-to-gdrive.sh
   ```

5. **Verify the Automated Schedule:**
   The daily cron job runs automatically every night at **02:00 AM**:
   ```bash
   crontab -l
   # Output: 0 2 * * * bash /var/www/orangyycarpels/deploy/backup-db-to-gdrive.sh > /dev/null 2>&1
   ```
