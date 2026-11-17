import 'dotenv/config'
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Explicit command only. Never invoked by server startup. MySQL DDL auto-commits.
const migrations = { community: '001_community', 'aws-practice': '002_aws_practice' }
const target = process.argv[2] || 'community'
if (!Object.hasOwn(migrations, target)) throw new Error('Unknown migration target: ' + target)
const version = migrations[target]
if (!process.env.DB_HOST || !process.env.DB_NAME) throw new Error('DB_HOST and DB_NAME are required')
const connection = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME })
let locked = false
try {
  const [[lock]] = await connection.query("SELECT GET_LOCK('portfolio_schema_migrations', 10) AS acquired")
  if (lock.acquired !== 1) throw new Error('Another migration is running')
  locked = true
  if (target === 'community') {
    const [users] = await connection.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id'")
    if (users.length !== 1 || !/^int(?:\(\d+\))?$/i.test(users[0].COLUMN_TYPE)) throw new Error('Expected existing users.id signed INT. Verify the deployed admin schema before migrating.')
    const [[engine]] = await connection.query("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'")
    if (engine?.ENGINE !== 'InnoDB') throw new Error('Existing users table must use InnoDB; no automatic conversion will be attempted.')
  }
  const sql = await readFile(new URL('../db/migrations/' + version + '.sql', import.meta.url), 'utf8')
  const checksum = createHash('sha256').update(sql).digest('hex')
  await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(80) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB')
  const [applied] = await connection.query('SELECT checksum FROM schema_migrations WHERE version = ?', [version])
  if (applied.length) {
    if (applied[0].checksum !== checksum) throw new Error('Applied migration checksum mismatch')
    console.log(version + ' migration already applied.')
  } else {
    for (const statement of sql.split(';').map(item => item.trim()).filter(Boolean)) await connection.query(statement)
    await connection.query('INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)', [version, checksum])
    console.log(version + ' migration applied.' + (target === 'community' ? ' Feature remains disabled until configured by admin.' : ''))
  }
} finally {
  if (locked) await connection.query("SELECT RELEASE_LOCK('portfolio_schema_migrations')")
  await connection.end()
}
