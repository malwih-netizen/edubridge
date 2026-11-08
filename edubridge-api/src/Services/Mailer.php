<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Env;

/**
 * Minimal SMTP client (no Composer): STARTTLS on 587 or implicit TLS on 465, AUTH LOGIN.
 * Settings in .env: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM, MAIL_FROM_NAME.
 * Without MAIL_HOST nothing is sent and send() returns false (local development).
 *   Mailer::send('student@x.com', 'Subject', "Plain text body");
 */
final class Mailer
{
    public static function configured(): bool
    {
        return (string) Env::get('MAIL_HOST', '') !== '';
    }

    public static function send(string $to, string $subject, string $text): bool
    {
        if (!self::configured()) return false;
        try {
            self::deliver($to, $subject, $text);
            return true;
        } catch (\Throwable $e) {
            error_log('[mail] ' . $e->getMessage());
            return false;
        }
    }

    private static function deliver(string $to, string $subject, string $text): void
    {
        $host = (string) Env::get('MAIL_HOST');
        $port = (int) Env::get('MAIL_PORT', '587');
        $from = (string) Env::get('MAIL_FROM', (string) Env::get('MAIL_USER'));
        $fromName = (string) Env::get('MAIL_FROM_NAME', 'EduBridge');

        $remote = ($port === 465 ? 'ssl://' : 'tcp://') . "$host:$port";
        $s = stream_socket_client($remote, $errno, $errstr, 15);
        if (!$s) throw new \RuntimeException("connect $errno $errstr");
        stream_set_timeout($s, 15);

        $expect = function (int $code) use ($s): void {
            $line = '';
            do { $line = fgets($s, 515) ?: ''; } while (isset($line[3]) && $line[3] === '-'); // multi-line replies
            if ((int) substr($line, 0, 3) !== $code) throw new \RuntimeException('smtp: ' . trim($line));
        };
        $cmd = function (string $c, int $code) use ($s, $expect): void { fwrite($s, $c . "\r\n"); $expect($code); };

        $expect(220);
        $cmd('EHLO edubridge', 250);
        if ($port !== 465) {
            $cmd('STARTTLS', 220);
            if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new \RuntimeException('starttls failed');
            $cmd('EHLO edubridge', 250);
        }
        $cmd('AUTH LOGIN', 334);
        $cmd(base64_encode((string) Env::get('MAIL_USER')), 334);
        $cmd(base64_encode((string) Env::get('MAIL_PASS')), 235);
        $cmd("MAIL FROM:<$from>", 250);
        $cmd("RCPT TO:<$to>", 250);
        $cmd('DATA', 354);

        $headers = [
            'From: =?UTF-8?B?' . base64_encode($fromName) . "?= <$from>",
            "To: <$to>",
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'Date: ' . date(DATE_RFC2822),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        $body = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($text));
        fwrite($s, $body . "\r\n.\r\n");
        $expect(250);
        $cmd('QUIT', 221);
        fclose($s);
    }
}
