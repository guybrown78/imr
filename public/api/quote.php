<?php
// POST /api/quote.php – saves a quote request to MySQL and emails the business.
// Works for fetch() (JSON response) and plain form posts (redirects to /thanks/).
declare(strict_types=1);
require __DIR__ . '/lib.php';

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function reply(bool $ok, array $extra = [], int $code = 200): never {
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($code);
        header('Content-Type: application/json');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ok] + $extra);
    } elseif ($ok) {
        header('Location: /thanks/', true, 303);
    } else {
        header('Location: /quote/?error=1', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(false, ['error' => 'Method not allowed.'], 405);
}

// Bots: honeypot filled, or submitted faster than a human could (JS sets ts on page load).
$ts = (int) ($_POST['ts'] ?? 0);
if (imr_clean('website', 200) !== '' || ($ts > 0 && (microtime(true) * 1000 - $ts) < 2500)) {
    reply(true, ['ref' => 'IMR-' . strtoupper(bin2hex(random_bytes(3)))]); // pretend success
}

$name = imr_clean('name', 80);
$business = imr_clean('business', 120);
$phone = imr_clean('phone', 20);
$email = imr_clean('email', 120);
$postcode = strtoupper(imr_clean('pc', 9));
$count = (int) ($_POST['n'] ?? 0);
$when = imr_clean('when', 60);
$message = mb_substr(trim((string) ($_POST['message'] ?? '')), 0, 1500);
$source = imr_clean('source', 80);

if ($name === '' || $phone === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(false, ['error' => 'Please fill in your name, phone and a valid email.'], 422);
}
if ($count < 1 || $count > 99999) {
    reply(false, ['error' => 'Please enter how many appliances you have.'], 422);
}

try {
    $cfg = imr_config();
    $pricing = imr_json('pricing.json');
    $site = imr_json('site.json');
    // Price is always recalculated server-side; anything the browser sent is ignored.
    $q = imr_quote($count, $postcode, $pricing);

    $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $cfg['ip_salt']);
    $db = imr_db();
    $recent = $db->prepare('SELECT COUNT(*) FROM enquiries WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
    $recent->execute([$ipHash]);
    if ((int) $recent->fetchColumn() >= 5) {
        reply(false, ['error' => 'Too many requests. Please call or WhatsApp us instead.'], 429);
    }

    $ref = 'IMR-' . strtoupper(bin2hex(random_bytes(3)));
    $db->prepare('INSERT INTO enquiries (ref, name, business, email, phone, postcode, appliances, quoted_price, quote_status, preferred, message, source_page, ip_hash)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
       ->execute([$ref, $name, $business ?: null, $email, $phone, $postcode ?: null, $count, $q['price'], $q['status'], $when ?: null, $message ?: null, $source ?: null, $ipHash]);
} catch (Throwable $e) {
    error_log('[imr quote] ' . $e->getMessage());
    reply(false, ['error' => 'We couldn\'t send that just now.'], 500);
}

// Emails are best-effort: the enquiry is already safe in the database.
$to = $cfg['notify_to'] ?: $site['email'];
$priceText = $q['status'] === 'ok' ? imr_gbp($q['price']) : imr_gbp($q['price']) . ' (' . $q['status'] . ' – confirm)';
$headers = "From: {$site['name']} <{$site['email']}>\r\nContent-Type: text/plain; charset=UTF-8";

$body = "New quote request $ref\n\n"
    . "Name:       $name\nBusiness:   $business\nPhone:      $phone\nEmail:      $email\nPostcode:   $postcode\n"
    . "Appliances: $count\nPrice:      $priceText\nWhen:       $when\nSource:     $source\n\nMessage:\n$message\n";
@mail($to, "New PAT quote $ref – $count items – $priceText", $body, $headers . "\r\nReply-To: $email");

$first = explode(' ', $name)[0];
$cust = "Hi $first,\n\nThanks for your PAT testing request. Your reference is $ref.\n\n"
    . "Appliances: $count\nPrice: $priceText\n\n"
    . "We'll be in touch the same working day to agree a date. If you need us sooner, call or WhatsApp {$site['phone']}.\n\n"
    . "{$site['name']}\n{$site['url']}\n";
@mail($email, "Your PAT testing request ($ref)", $cust, $headers);

reply(true, ['ref' => $ref, 'price' => $q['price'], 'status' => $q['status']]);
