<?php
// Read-only enquiries inbox. Password hash lives in ~/imr-config.php ('admin_hash').
declare(strict_types=1);
require dirname(__DIR__) . '/api/lib.php';
session_start(['cookie_httponly' => true, 'cookie_secure' => true, 'cookie_samesite' => 'Strict']);
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
$cfg = imr_config();

if (isset($_GET['logout'])) { session_destroy(); header('Location: ./'); exit; }
if (!empty($_POST['password']) && $cfg['admin_hash'] && password_verify((string) $_POST['password'], $cfg['admin_hash'])) {
    session_regenerate_id(true);
    $_SESSION['imr_admin'] = true;
    header('Location: ./'); exit;
}
if (empty($_SESSION['imr_admin'])) { usleep(300000); ?>
<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>IMR inbox</title>
<style>body{font:16px system-ui;background:#F3FAF6;display:grid;place-items:center;min-height:100vh;margin:0}form{background:#fff;padding:2rem;border-radius:12px;display:grid;gap:.75rem;border:1px solid #d4e6dc}input,button{font:inherit;padding:.7rem;border-radius:8px;border:1px solid #a9c9b8}button{background:#0B5D3B;color:#fff;border:0}</style>
<form method="post"><strong>IMR enquiries</strong><input type="password" name="password" placeholder="Password" autofocus required><button>Sign in</button></form>
<?php exit; }

$rows = imr_db()->query('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 300')->fetchAll();
$h = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES);
?>
<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>IMR inbox (<?= count($rows) ?>)</title>
<style>body{font:14px system-ui;background:#F3FAF6;color:#0B1F16;margin:0;padding:1rem}table{border-collapse:collapse;width:100%;background:#fff}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #d4e6dc;vertical-align:top}th{font:12px ui-monospace,monospace;text-transform:uppercase;color:#0B5D3B}.wrap{overflow-x:auto}a{color:#0B5D3B}</style>
<p><strong>Enquiries</strong> · latest <?= count($rows) ?> · <a href="?logout">Sign out</a></p>
<div class="wrap"><table><tr><th>When</th><th>Ref</th><th>Name / business</th><th>Contact</th><th>Items</th><th>Price</th><th>Postcode</th><th>When suits</th><th>Message</th></tr>
<?php foreach ($rows as $r): ?>
<tr><td><?= $h(date('d M H:i', strtotime($r['created_at']))) ?></td><td><?= $h($r['ref']) ?></td>
<td><?= $h($r['name']) ?><br><small><?= $h($r['business']) ?></small></td>
<td><a href="tel:<?= $h($r['phone']) ?>"><?= $h($r['phone']) ?></a><br><a href="mailto:<?= $h($r['email']) ?>"><?= $h($r['email']) ?></a></td>
<td><?= (int) $r['appliances'] ?></td><td><?= $h(imr_gbp($r['quoted_price'] !== null ? (float) $r['quoted_price'] : null)) ?><br><small><?= $h($r['quote_status']) ?></small></td>
<td><?= $h($r['postcode']) ?></td><td><?= $h($r['preferred']) ?></td><td><?= nl2br($h($r['message'])) ?></td></tr>
<?php endforeach; ?></table></div>
