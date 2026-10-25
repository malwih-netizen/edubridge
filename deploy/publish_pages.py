"""
Publishes the React site to GitHub Pages: https://malwih-netizen.github.io/edubridge/

  python deploy/publish_pages.py

Pages only serves static files, so this build runs on the built-in demo data (no PHP API);
sign in with the demo accounts (password demo1234). The full version with the API is on InfinityFree.
"""
import os
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT / 'edubridge-react'
OUT = ROOT / 'deploy' / 'pages'
REPO = 'https://github.com/malwih-netizen/edubridge.git'
BASE = '/edubridge/'


def run(*cmd, cwd):
    subprocess.run(cmd, cwd=cwd, check=True)


if __name__ == '__main__':
    if OUT.exists():
        shutil.rmtree(OUT)
    npm = 'npm.cmd' if os.name == 'nt' else 'npm'
    # --mode pages loads edubridge-react/.env.pages (VITE_API_URL empty → demo data)
    subprocess.run([npm, 'exec', '--', 'vite', 'build', '--mode', 'pages', '--base', BASE, '--outDir', str(OUT), '--emptyOutDir'], cwd=WEB, check=True)
    # Pages has no rewrites: unknown paths (/edubridge/login …) get 404.html, which is the app itself
    shutil.copy2(OUT / 'index.html', OUT / '404.html')
    (OUT / '.nojekyll').write_text('', encoding='utf-8')

    run('git', 'init', '-q', '-b', 'gh-pages', cwd=OUT)
    run('git', 'add', '-A', cwd=OUT)
    run('git', '-c', 'user.name=malwih-netizen', '-c', 'user.email=malwih-netizen@users.noreply.github.com',
        'commit', '-q', '-m', 'Publish EduBridge site (demo data)', cwd=OUT)
    run('git', 'push', '-f', REPO, 'gh-pages', cwd=OUT)
    print('✓ https://malwih-netizen.github.io/edubridge/')
