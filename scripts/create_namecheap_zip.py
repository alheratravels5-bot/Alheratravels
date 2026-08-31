#!/usr/bin/env python3
import os
import zipfile
import subprocess
import sys

def main():
    print("==================================================================")
    print("📦 BUILDING AL-HERA TRAVELS FOR NAMECHEAP CPANEL HOSTING")
    print("==================================================================")

    # 1. Run production build
    print("\n▶ Step 1: Running npm run build...")
    build_result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
    if build_result.returncode != 0:
        print("❌ Build failed!")
        print(build_result.stderr)
        sys.exit(1)
    print("✅ Build completed successfully. 'dist/' directory created.")

    dist_dir = os.path.join(os.getcwd(), "dist")
    if not os.path.exists(dist_dir):
        print(f"❌ Error: {dist_dir} does not exist!")
        sys.exit(1)

    # 2. Generate optimized .htaccess for Namecheap cPanel / Apache
    htaccess_content = """# ======================================================================
# AL-HERA TRAVELS - NAMECHEAP CPANEL OPTIMIZED CONFIGURATION
# Designed for Apache 2.4+ on Namecheap Shared / Stellar Hosting
# ======================================================================

# 1. Force HTTPS (SSL)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# 2. React SPA Client-Side Routing (Prevent 404 on Refresh)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l
    RewriteRule . /index.html [L]
</IfModule>

# 3. GZIP / DEFLATE Compression for Ultra-Fast Loading
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE font/ttf
    AddOutputFilterByType DEFLATE font/otf
    AddOutputFilterByType DEFLATE font/x-woff
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# 4. Leverage Browser Caching for Production Performance
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# 5. Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# 6. Correct MIME Types
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
    AddType font/woff2 .woff2
    AddType image/svg+xml .svg
    AddType application/json .json
</IfModule>
"""

    htaccess_path = os.path.join(dist_dir, ".htaccess")
    with open(htaccess_path, "w", encoding="utf-8") as f:
        f.write(htaccess_content)
    print("✅ Created Namecheap Apache .htaccess with SPA routing & compression in dist/.htaccess")

    # 3. Create Namecheap Deployment Instructions
    readme_content = """# ======================================================================
# AL-HERA TRAVELS - NAMECHEAP CPANEL DEPLOYMENT GUIDE
# ======================================================================

HOW TO UPLOAD TO YOUR NAMECHEAP DOMAIN:

1. Log into your Namecheap cPanel account:
   - Example: https://yourdomain.com:2083 or via Namecheap Dashboard -> Hosting List -> Go to cPanel.

2. Open "File Manager":
   - Navigate to your website's root folder:
     - For Main Domain: public_html/
     - For Addon Domain / Subdomain: public_html/yoursubdomain/ (or the folder assigned to your domain).

3. Upload this ZIP file:
   - Click "Upload" in File Manager.
   - Select "alhera-travels-namecheap-cpanel.zip".

4. Extract the ZIP:
   - Right-click "alhera-travels-namecheap-cpanel.zip" inside public_html.
   - Click "Extract" -> "Extract File(s)".
   - Ensure files (index.html, assets/, .htaccess) are directly in public_html/.

5. Verify .htaccess Visibility:
   - In cPanel File Manager, click "Settings" (top right corner).
   - Check "Show Hidden Files (dotfiles)" -> Click "Save".
   - Confirm that .htaccess is present in your public_html folder.

6. Your website is LIVE!
   - Open https://yourdomain.com in your browser.
   - All pages, Candidate Tracking, Partner Office ERP, Jobs, VIP Umrah, and Admin Portal will work seamlessly!

======================================================================
"""

    readme_path = os.path.join(dist_dir, "NAMECHEAP_DEPLOY_INSTRUCTIONS.txt")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    # 4. Package into alhera-travels-namecheap-cpanel.zip
    zip_output_path = os.path.join(os.getcwd(), "alhera-travels-namecheap-cpanel.zip")
    print(f"\n▶ Step 2: Packaging into '{os.path.basename(zip_output_path)}'...")

    with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, dist_dir)
                zipf.write(file_path, arcname)
                print(f"  + Added: {arcname}")

    zip_size_mb = os.path.getsize(zip_output_path) / (1024 * 1024)
    print(f"\n🎉 SUCCESS! Zip file generated: {zip_output_path} ({zip_size_mb:.2f} MB)")
    print("You can download and extract this zip directly into Namecheap public_html!")

if __name__ == "__main__":
    main()
