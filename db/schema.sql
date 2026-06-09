-- Q&A cache for the portfolio chatbot.
-- The server creates this automatically on startup, but you can also run it
-- manually in hPanel → phpMyAdmin if you prefer.

CREATE TABLE IF NOT EXISTS qa_pairs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question      VARCHAR(512) NOT NULL,
  question_norm VARCHAR(512) NOT NULL,
  answer        MEDIUMTEXT   NOT NULL,
  source        VARCHAR(16)  NOT NULL DEFAULT 'ai',   -- 'seed' or 'ai'
  hits          INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_norm (question_norm),
  FULLTEXT KEY ft_norm (question_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
