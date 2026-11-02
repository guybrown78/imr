<?php
// Shared helpers for the quote API and admin inbox. Pricing/contact rules come from the
// JSON files the Astro build publishes from src/data – never hard-code prices here.
declare(strict_types=1);

const IMR_ROOT = __DIR__;

function imr_config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $path = getenv('IMR_CONFIG') ?: dirname($_SERVER['DOCUMENT_ROOT'] ?: __DIR__ . '/..') . '/imr-config.php';
        if (!is_file($path)) {
            throw new RuntimeException('Server config missing');
        }
        $cfg = require $path;
    }
    return $cfg;
}

function imr_json(string $file): array {
    $data = json_decode((string) file_get_contents(IMR_ROOT . '/' . $file), true);
    if (!is_array($data)) {
        throw new RuntimeException("Unreadable $file");
    }
    return $data;
}

function imr_db(): PDO {
    $c = imr_config();
    return new PDO($c['db_dsn'], $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

/** Mirrors calcQuote() in src/lib/pricing.ts. */
function imr_quote(int $count, string $postcode, array $r): array {
    if ($count < 1) {
        return ['status' => 'invalid', 'price' => null];
    }
    $price = $r['minimumCharge'] + max(0, $count - $r['itemsIncluded']) * $r['perExtraItem'];
    if ($count > $r['maxInstantItems']) {
        return ['status' => 'large', 'price' => null];
    }
    $pc = strtoupper(preg_replace('/\s+/', '', $postcode));
    $covered = $pc === '';
    foreach ($r['coveredPostcodePrefixes'] as $p) {
        if (str_starts_with($pc, $p) && ctype_digit(substr($pc, strlen($p), 1))) {
            $covered = true;
        }
    }
    return ['status' => $covered ? 'ok' : 'outside', 'price' => $price];
}

function imr_gbp(?float $n): string {
    return $n === null ? 'TBC' : '£' . (floor($n) == $n ? number_format($n) : number_format($n, 2));
}

function imr_clean(string $key, int $max): string {
    $v = trim((string) ($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $v) ?? '';
    return mb_substr($v, 0, $max);
}
