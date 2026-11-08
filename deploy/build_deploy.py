"""
Builds the InfinityFree package for https://edubridge.infinityfreeapp.com

  deploy/htdocs/                 → upload the CONTENTS to the host's  htdocs/  folder
      index.html, assets/        React site (built with VITE_API_URL=/api)
      .htaccess                  React routes → index.html
      api/                       PHP API (same domain → no CORS / anti-bot problems)
          index.php, src/, docs/, openapi.json, storage/uploads/
          .env                   production settings  ← paste the MySQL password here
          .htaccess              routes + protects .env, src/, storage/
  deploy/edubridge-database.sql  → import in phpMyAdmin (database if0_43270586_edubridge)
  deploy/edubridge-htdocs.zip    → same as htdocs/, zipped

Run:  python deploy/build_deploy.py
"""
import os
import secrets
import shutil
import subprocess
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEPLOY = ROOT / 'deploy'
OUT = DEPLOY / 'htdocs'
API_SRC = ROOT / 'edubridge-api'
WEB_SRC = ROOT / 'edubridge-react'
DOMAIN = 'https://edubridge.infinityfreeapp.com'

ENV = f"""# EduBridge API — production settings (InfinityFree)
APP_ENV=production
APP_URL={DOMAIN}
CORS_ORIGINS={DOMAIN}

DB_HOST=sql306.infinityfree.com
DB_PORT=3306
DB_NAME=if0_43270586_edubridge
DB_USER=if0_43270586
DB_PASS=PASTE_YOUR_MYSQL_PASSWORD_HERE

JWT_SECRET={secrets.token_hex(32)}
JWT_TTL_HOURS=72

# Email (SMTP) for reset codes and staff invitations — empty MAIL_HOST = no email
MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
MAIL_FROM_NAME=EduBridge
"""

ROOT_HTACCESS = """# EduBridge — React single-page app
DirectoryIndex index.html
RewriteEngine On
RewriteBase /

# the API has its own rules in api/.htaccess
RewriteRule ^api(/|$) - [L]
RewriteRule ^index\.html$ - [L]

# every path that is not a real file (/student, /login, /scholarships/2 …) → React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"""

API_HTACCESS = """# EduBridge — PHP API
DirectoryIndex index.php
RewriteEngine On
RewriteBase /api/

# pass the Authorization header (JWT) to PHP
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# never serve settings, code or uploaded files directly
RewriteRule ^\.env - [F,L]
RewriteRule ^(src|storage)(/|$) - [F,L]

# Swagger page
RewriteRule ^docs/?$ /api/docs/index.html [L]
RewriteRule ^(index\.php|openapi\.json|docs/index\.html)$ - [L]

# everything else → front controller
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule . /api/index.php [L]
"""

DENY_ALL = "# no direct web access\nRewriteEngine On\nRewriteRule ^ - [F,L]\n"


def build_web():
    env = dict(os.environ, VITE_API_URL='/api')
    npm = 'npm.cmd' if os.name == 'nt' else 'npm'
    subprocess.run([npm, 'exec', '--', 'vite', 'build', '--outDir', str(OUT), '--emptyOutDir'], cwd=WEB_SRC, env=env, check=True)


def build_api():
    api = OUT / 'api'
    shutil.copytree(API_SRC / 'src', api / 'src')
    shutil.copytree(API_SRC / 'public' / 'docs', api / 'docs')
    shutil.copy2(API_SRC / 'public' / 'openapi.json', api / 'openapi.json')
    index = (API_SRC / 'public' / 'index.php').read_text(encoding='utf-8')
    index = index.replace("require dirname(__DIR__) . '/src/bootstrap.php';", "require __DIR__ . '/src/bootstrap.php';")
    (api / 'index.php').write_text(index, encoding='utf-8')
    (api / 'storage' / 'uploads').mkdir(parents=True)
    (api / 'storage' / 'uploads' / '.gitkeep').write_text('', encoding='utf-8')
    (api / '.htaccess').write_text(API_HTACCESS, encoding='utf-8')
    (api / 'src' / '.htaccess').write_text(DENY_ALL, encoding='utf-8')
    (api / 'storage' / '.htaccess').write_text(DENY_ALL, encoding='utf-8')
    (api / '.env').write_text(ENV, encoding='utf-8')
    (OUT / '.htaccess').write_text(ROOT_HTACCESS, encoding='utf-8')


def build_sql():
    parts = ['-- EduBridge database for phpMyAdmin (InfinityFree)\n'
             '-- 1. Open phpMyAdmin for if0_43270586_edubridge  2. Import this file.\n'
             '-- Creates 25 tables, demo data (password demo1234) and 7 reporting views.\n']
    for f in ('schema.sql', 'seed.sql', 'views.sql'):
        parts.append(f'\n-- ===================== {f} =====================\n')
        parts.append((API_SRC / 'database' / f).read_text(encoding='utf-8'))
    (DEPLOY / 'edubridge-database.sql').write_text(''.join(parts), encoding='utf-8')


def build_zip():
    target = DEPLOY / 'edubridge-htdocs.zip'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in OUT.rglob('*'):
            if p.is_file():
                z.write(p, p.relative_to(OUT).as_posix())
    return target


if __name__ == '__main__':
    old_env = OUT / 'api' / '.env'
    kept_env = old_env.read_text(encoding='utf-8') if old_env.exists() else None
    if OUT.exists():
        shutil.rmtree(OUT)
    build_web()
    build_api()
    if kept_env:  # keep the pasted password and JWT secret across rebuilds, adding any setting introduced since
        have = {line.split('=', 1)[0] for line in kept_env.splitlines() if '=' in line and not line.startswith('#')}
        missing = [line for line in ENV.splitlines() if '=' in line and not line.startswith('#') and line.split('=', 1)[0] not in have]
        if missing:
            kept_env = kept_env.rstrip('\n') + '\n\n# added by build_deploy.py\n' + '\n'.join(missing) + '\n'
        old_env.write_text(kept_env, encoding='utf-8')
    build_sql()
    z = build_zip()
    files = sum(1 for p in OUT.rglob('*') if p.is_file())
    print(f'✓ htdocs: {files} files')
    print(f'✓ {z.name}: {z.stat().st_size // 1024} KB')
    print('✓ edubridge-database.sql')
    print('! Next: paste the MySQL password into deploy/htdocs/api/.env (DB_PASS=…)')
