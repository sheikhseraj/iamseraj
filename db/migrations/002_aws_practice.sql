CREATE TABLE IF NOT EXISTS aws_practice_accounts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  password_hash VARCHAR(192) CHARACTER SET ascii NOT NULL,
  progress JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  progress_updated_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS aws_practice_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  account_id INT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  INDEX aws_practice_sessions_expiration (expires_at),
  CONSTRAINT aws_practice_session_account FOREIGN KEY (account_id)
    REFERENCES aws_practice_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
