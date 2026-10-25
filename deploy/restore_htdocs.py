"""
Undoes the EduBridge upload to /htdocs, which belongs to the Laravel portfolio site.

  python deploy/restore_htdocs.py

- deletes only the files EduBridge uploaded (the list comes from deploy/htdocs/)
- puts back the Laravel .htaccess from ProfileLaravel/public/.htaccess
The FTP password is asked for when the script runs; it is not saved anywhere.
"""
import ftplib
import getpass
import pathlib
import sys

HOST = 'ftpupload.net'
USER = 'if0_43072262'
REMOTE_ROOT = '/htdocs'
OURS = pathlib.Path(__file__).resolve().parent / 'htdocs'
LARAVEL_PUBLIC = pathlib.Path(r'D:\Family\Wesam Mobile\Profile\ProfileLaravel\public')


def main():
    laravel_files = {p.relative_to(LARAVEL_PUBLIC).as_posix() for p in LARAVEL_PUBLIC.rglob('*') if p.is_file()}
    ours = sorted(p.relative_to(OURS).as_posix() for p in OURS.rglob('*') if p.is_file())
    # never delete a path the Laravel site also has (.htaccess is replaced below instead)
    to_delete = [r for r in ours if r not in laravel_files and r != '.htaccess']
    our_dirs = sorted({str(pathlib.PurePosixPath(r).parent) for r in to_delete} - {'.'},
                      key=lambda d: d.count('/'), reverse=True)

    print(f'Will delete {len(to_delete)} EduBridge files and folders: {", ".join(our_dirs)}')
    print('Will restore .htaccess from', LARAVEL_PUBLIC / '.htaccess')
    if input('Continue? (y/n) ').strip().lower() != 'y':
        sys.exit('Cancelled.')

    ftp = ftplib.FTP(HOST, timeout=60)
    ftp.login(USER, getpass.getpass(f'FTP password for {USER}@{HOST}: '))
    ftp.set_pasv(True)

    for r in to_delete:
        try:
            ftp.delete(f'{REMOTE_ROOT}/{r}')
            print('deleted', r)
        except ftplib.error_perm as e:
            print('skip', r, '-', e)
    for d in our_dirs:
        try:
            ftp.rmd(f'{REMOTE_ROOT}/{d}')
            print('removed folder', d)
        except ftplib.error_perm as e:
            print('folder kept', d, '-', e)

    with (LARAVEL_PUBLIC / '.htaccess').open('rb') as fh:
        ftp.storbinary(f'STOR {REMOTE_ROOT}/.htaccess', fh)
    print('restored .htaccess')
    ftp.quit()
    print('Done.')


if __name__ == '__main__':
    main()
