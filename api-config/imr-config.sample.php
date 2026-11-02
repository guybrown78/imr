<?php
// Copy to ~/imr-config.php on the server (ONE LEVEL ABOVE public_html) and fill in.
// Never commit the real file.
return [
    'db_dsn'   => 'mysql:host=localhost;dbname=CPANELUSER_imr;charset=utf8mb4',
    'db_user'  => 'CPANELUSER_imr',
    'db_pass'  => 'change-me',
    // Random string used to hash IPs (rate limiting). Generate: php -r "echo bin2hex(random_bytes(32));"
    'ip_salt'  => 'change-me',
    // Admin inbox password hash. Generate: php -r "echo password_hash('your-password', PASSWORD_DEFAULT);"
    'admin_hash' => '',
    // Optional override; otherwise the email from site.json is used.
    'notify_to' => null,
];
