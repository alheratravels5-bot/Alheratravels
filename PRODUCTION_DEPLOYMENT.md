# 🚀 AL-HERA TRAVELS — Multi-Platform Production Deployment Guide

This repository contains the complete **AL-HERA TRAVELS ERP & Live Candidate Tracking Portal** built with React, TypeScript, Tailwind CSS, and a centralized **Supabase PostgreSQL & Real-time Cloud Database**.

Whether you deploy to **GitHub + Vercel / Netlify** or **Namecheap cPanel (Shared / Node.js Hosting)** with your custom domain (e.g. `alheratravels.in`, `alheratravels.com`), the application connects directly to the **exact same live Supabase database**.

---

## 🗄️ Unified Supabase Cloud Database Credentials

Your production build is pre-configured with the live project credentials:

| Key | Value |
| :--- | :--- |
| **Supabase URL** | `https://cghzoyuzvhybdvipuwtb.supabase.co` |
| **Supabase Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaHpveXV6dmh5YmR2aXB1d3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjk4NjksImV4cCI6MjEwMzc0NTg2OX0.aLyS7DCemOSQlvtiHQHZj1rP87ylYpt7av3UKH5B3x0` |

---

## 🌐 METHOD 1: Deploying via GitHub & Vercel (Recommended with Custom Namecheap Domain)

### Step 1: Push Repository to GitHub
1. Create a repository on GitHub (e.g. `al-hera-travels`).
2. Push your project code to GitHub.

### Step 2: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New... ➔ Project** and import your GitHub repository.
3. Framework Preset: **Vite** (Auto-detected).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://cghzoyuzvhybdvipuwtb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaHpveXV6dmh5YmR2aXB1d3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNjk4NjksImV4cCI6MjEwMzc0NTg2OX0.aLyS7DCemOSQlvtiHQHZj1rP87ylYpt7av3UKH5B3x0`
7. Click **Deploy**.

### Step 3: Connect Your Namecheap Domain on Vercel
1. In your Vercel Project Dashboard, go to **Settings ➔ Domains**.
2. Enter your domain (e.g. `yourdomain.com` or `www.yourdomain.com`).
3. Log in to your **Namecheap Account ➔ Domain List ➔ Manage ➔ Advanced DNS**:
   - **A Record**: Host `@` ➔ Value `76.76.21.21`
   - **CNAME Record**: Host `www` ➔ Value `cname.vercel-dns.com.`
4. Vercel will automatically provision a free SSL certificate. Your app is now live with real-time Supabase sync across every device!

---

## ⚡ METHOD 2: Direct Upload to Namecheap cPanel `public_html` (Shared Hosting)

1. Build the production files: `npm run build`
2. Open **Namecheap cPanel ➔ File Manager ➔ public_html**.
3. Upload all files from the `dist/` directory (including `assets/`, `index.html`, and `.htaccess`).
4. Access `https://yourdomain.com` — candidate tracking and administration will immediately pull from Supabase.

---

## 🔑 Default Super Admin Login Credentials
- **Email**: `alheratravels5@gmail.com`
- **Password**: `Rps@32862`
- **Role**: Super Admin (Full administrative access across Candidates, Saudi Jobs, Visas, Partner Offices, and Settings).
