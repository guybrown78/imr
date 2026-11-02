-- IMR Services enquiries. Run once in phpMyAdmin (cPanel → phpMyAdmin → your DB → SQL).
CREATE TABLE IF NOT EXISTS enquiries (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ref           VARCHAR(16)  NOT NULL UNIQUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name          VARCHAR(80)  NOT NULL,
  business      VARCHAR(120) NULL,
  email         VARCHAR(120) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  postcode      VARCHAR(9)   NULL,
  appliances    INT UNSIGNED NOT NULL,
  quoted_price  DECIMAL(8,2) NULL,
  quote_status  VARCHAR(10)  NOT NULL,
  preferred     VARCHAR(60)  NULL,
  message       TEXT         NULL,
  source_page   VARCHAR(80)  NULL,
  status        ENUM('new','contacted','booked','done','lost') NOT NULL DEFAULT 'new',
  ip_hash       CHAR(64)     NOT NULL,
  INDEX idx_created (created_at),
  INDEX idx_ip (ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
