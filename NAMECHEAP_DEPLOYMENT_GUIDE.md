# 🚀 AL-HERA TRAVELS — Namecheap Deployment Guide

This package contains everything needed to deploy **AL-HERA TRAVELS ERP & Public Portal** to your Namecheap domain.

We have generated **two ready-to-use ZIP packages** depending on your hosting setup:

---

## ⚡ OPTION 1 (EASIEST): Direct Upload to `public_html` (Shared Hosting / cPanel)
> **Recommended if using standard Namecheap Shared Hosting (Stellar / Stellar Plus) or basic Apache web hosting.**

### ZIP File: `namecheap-public_html-upload.zip`

1. Log in to **Namecheap cPanel**.
2. Open **File Manager** and navigate to your domain root directory (usually `public_html` for your primary domain, or `yourdomain.com` for an addon domain / subdomain).
3. Click **Upload** and select **`namecheap-public_html-upload.zip`**.
4. In File Manager, right-click `namecheap-public_html-upload.zip` and choose **Extract**.
5. Ensure that `index.html`, `assets/`, and `.htaccess` are located directly in your `public_html` directory.
6. Open your domain (e.g., `https://yourdomain.com`) in any web browser — your website and Admin Portal will work immediately!

---

## 🛠️ OPTION 2: Namecheap "Setup Node.js App" (cPanel CloudLinux / Passenger)
> **Recommended if running as a persistent Node.js Express server on Namecheap with live API health diagnostics.**

### ZIP File: `namecheap-deployment.zip`

### Step 1: Create the Node.js Application in Namecheap cPanel
1. In cPanel, scroll down to **Software** and click **Setup Node.js App**.
2. Click **+ Create Application**.
3. Set the configuration:
   - **Node.js Version**: Select **20.x** (or **18.x / 22.x**).
   - **Application Mode**: **Production**.
   - **Application Root**: Enter a directory name, e.g. `alhera_app` (or `public_html`).
   - **Application Startup File**: Type **`app.js`** (or `server.js`).
   - **Application URL**: Select your target domain or subdomain.
4. Click **Create** (top right).

### Step 2: Upload and Extract Files
1. Open **File Manager** in cPanel.
2. Go to the folder you created in Step 1 (e.g. `/home/username/alhera_app`).
3. Upload **`namecheap-deployment.zip`** and click **Extract**.
4. Make sure `dist/`, `app.js`, `server.js`, `package.json`, and `.htaccess` are inside that directory.

### Step 3: Install Packages & Restart
1. Go back to **Setup Node.js App** in cPanel.
2. Click on your application.
3. Under *Detected configuration files*, click **Run NPM Install**.
4. Once completed, click **Restart** at the top right.

---

## 🔑 Default Super Admin Login Credentials
- **Email**: `alheratravels5@gmail.com`
- **Password**: `Rps@32862`
- **Role**: Super Admin (Full access to all candidate records, Saudi job postings, visa updates, accounts, SMS, and staff permissions).

---

## 🌐 Diagnostic & Routing Notes
- **Apache Rewrite**: The included `.htaccess` file handles client-side SPA routing (e.g. refreshing on sub-pages without 404 errors) and browser asset caching.
- **Node Diagnostic Health URL**: `https://yourdomain.com/api/health`

