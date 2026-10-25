"""
Uploads deploy/htdocs/ to InfinityFree (edubridge.infinityfreeapp.com) over FTP.

  python deploy/upload_ftp.py                          everything
  python deploy/upload_ftp.py .htaccess api/.htaccess  only these files

The FTP password is asked for when the script runs; it is not saved anywhere.
Check DB_PASS in deploy/htdocs/api/.env before uploading.
"""
import ftplib
import getpass
import io
import pathlib
import sys

HOST = 'ftpupload.net'
USER = 'if0_43270586'
REMOTE_ROOT = '/htdocs'
DOMAIN = 'edubridge.infinityfreeapp.com'
LOCAL_ROOT = pathlib.Path(__file__).resolve().parent / 'htdocs'


def ensure_dir(ftp, path):
    try:
        ftp.mkd(path)
    except ftplib.error_perm:
        pass  # already exists


def main():
    only = set(sys.argv[1:])
    files = sorted(p for p in LOCAL_ROOT.rglob('*') if p.is_file()
                   and (not only or p.relative_to(LOCAL_ROOT).as_posix() in only))
    if not files:
        sys.exit('No matching files.')
    env = (LOCAL_ROOT / 'api' / '.env').read_text(encoding='utf-8')
    if (not only or 'api/.env' in only) and 'PASTE_YOUR_MYSQL_PASSWORD_HERE' in env:
        # goes only into the uploaded .env on the host, not into the local file
        db_pass = getpass.getpass('MySQL password (if0_43270586 @ sql306.infinityfree.com): ')
        if not db_pass:
            sys.exit('MySQL password is required.')
        env = env.replace('PASTE_YOUR_MYSQL_PASSWORD_HERE', db_pass)

    for attempt in range(3):
        password = getpass.getpass(f'FTP password for {USER}@{HOST}: ')
        ftp = ftplib.FTP(HOST, timeout=60)
        try:
            ftp.login(USER, password)
            break
        except ftplib.error_perm:
            ftp.close()
            print('Wrong FTP password. Use the one in the panel: Accounts → FTP Details → Show.')
    else:
        sys.exit('FTP login failed 3 times.')
    ftp.set_pasv(True)
    print('Connected.')

    # accounts with several domains keep each site in /<domain>/htdocs
    root_items = ftp.nlst('/')
    print('Server root:', ', '.join(sorted(root_items)))
    if any(i.strip('/') == DOMAIN for i in root_items):
        remote_root = f'/{DOMAIN}/htdocs'
    else:
        remote_root = REMOTE_ROOT
    # stop if the folder holds another site (anything besides InfinityFree's defaults and our own files)
    ours = {p.relative_to(LOCAL_ROOT).as_posix().split('/')[0] for p in LOCAL_ROOT.rglob('*') if p.is_file()}
    defaults = {'.', '..', 'index2.html', 'files for your website should be uploaded here!'}
    foreign = [n for n in (x.rsplit('/', 1)[-1] for x in ftp.nlst(remote_root)) if n not in defaults | ours]
    if foreign:
        ftp.quit()
        sys.exit(f'{remote_root} already has other files ({", ".join(sorted(foreign))}). Nothing uploaded.')
    print('Uploading to:', remote_root)

    for d in sorted({p.parent for p in files}):
        rel = d.relative_to(LOCAL_ROOT).as_posix()
        if rel != '.':
            ensure_dir(ftp, f'{remote_root}/{rel}')
    for i, p in enumerate(files, 1):
        rel = p.relative_to(LOCAL_ROOT).as_posix()
        if rel == 'api/.env':
            ftp.storbinary(f'STOR {remote_root}/{rel}', io.BytesIO(env.encode('utf-8')))
        else:
            with p.open('rb') as fh:
                ftp.storbinary(f'STOR {remote_root}/{rel}', fh)
        print(f'[{i}/{len(files)}] {rel}')

    ftp.quit()
    print('Done → https://edubridge.infinityfreeapp.com')


if __name__ == '__main__':
    main()
