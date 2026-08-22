<?php

namespace App\Services\OsTravel;

use Illuminate\Support\Facades\Crypt;
use Throwable;

/**
 * Build and resolve opaque proxy URLs for provider images so the public
 * response never exposes the provider host. The token is an encrypted,
 * URL-safe representation of the absolute provider URL.
 */
class OsTravelImageProxy
{
    /**
     * Build the public proxy path for a provider image, or null when absent.
     */
    public static function publicUrl(?string $providerUrl): ?string
    {
        $providerUrl = trim((string) $providerUrl);

        if ($providerUrl === '') {
            return null;
        }

        return '/api/hotels/images/'.self::encode(Crypt::encryptString($providerUrl));
    }

    /**
     * Decrypt a proxy token back into the provider image URL, applying the
     * SSRF guard. Returns null for tampered or unsafe URLs.
     */
    public static function resolve(string $token): ?string
    {
        try {
            $url = Crypt::decryptString(self::decode($token));
        } catch (Throwable) {
            return null;
        }

        if (! self::isSafeImageUrl($url)) {
            return null;
        }

        return $url;
    }

    /**
     * Make a base64 string URL-safe (no `+`, `/`, or `=`).
     */
    private static function encode(string $value): string
    {
        return rtrim(strtr($value, '+/', '-_'), '=');
    }

    /**
     * Restore the padded base64 from a URL-safe token.
     */
    private static function decode(string $token): string
    {
        $value = strtr($token, '-_', '+/');

        return $value.str_repeat('=', (4 - strlen($value) % 4) % 4);
    }

    /**
     * Scheme/host SSRF guard: only public http(s) hosts, never a private,
     * loopback, or link-local address.
     */
    public static function isSafeImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        if (! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower($parts['host']);
        $ip = filter_var($host, FILTER_VALIDATE_IP);

        if ($ip === false) {
            $resolved = gethostbyname($host);
            if ($resolved === $host || filter_var($resolved, FILTER_VALIDATE_IP) === false) {
                return false;
            }
            $ip = $resolved;
        }

        return ! self::isPrivateAddress($ip);
    }

    private static function isPrivateAddress(string $ip): bool
    {
        $ip = strtolower(trim($ip));

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $long = ip2long($ip);
            if ($long === false) {
                return true;
            }

            $ranges = [
                ['0.0.0.0', 8],
                ['10.0.0.0', 8],
                ['100.64.0.0', 10],
                ['127.0.0.0', 8],
                ['169.254.0.0', 16],
                ['172.16.0.0', 12],
                ['192.0.0.0', 24],
                ['192.168.0.0', 16],
                ['198.18.0.0', 15],
            ];

            foreach ($ranges as [$network, $prefix]) {
                $mask = ($prefix === 0) ? 0 : (-1 << (32 - $prefix)) & 0xFFFFFFFF;
                if (($long & $mask) === (ip2long($network) & $mask)) {
                    return true;
                }
            }

            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $ip === '::1'
                || $ip === '::'
                || str_starts_with($ip, 'fc') || str_starts_with($ip, 'fd')
                || str_starts_with($ip, 'fe8') || str_starts_with($ip, 'fe9')
                || str_starts_with($ip, 'fea') || str_starts_with($ip, 'feb');
        }

        return true;
    }
}
