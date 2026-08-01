// Creates the database tables directly via SQL, bypassing Prisma's CLI
// entirely — its schema engine is WASM-based and crashes with an
// Out-of-Memory error on NameHero's constrained hosting. This mirrors
// prisma/schema.prisma exactly. Safe to re-run (uses IF NOT EXISTS).
// mysql2 is pre-bundled into the deploy artifact by the CI build — do not
// attempt to npm install it here. CloudLinux's Node Selector refuses any
// npm install on the server since node_modules there isn't its managed
// venv symlink.
const mysql = require("mysql2/promise");

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(191) NOT NULL,
    \`email\` VARCHAR(191) NOT NULL,
    \`passwordHash\` VARCHAR(191) NOT NULL,
    \`role\` VARCHAR(191) NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`users_email_key\` (\`email\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS \`lpos\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`billNumber\` VARCHAR(191) NOT NULL,
    \`customerName\` VARCHAR(191) NOT NULL,
    \`deliveryLocation\` VARCHAR(191) NOT NULL,
    \`deliveryDate\` VARCHAR(191) NOT NULL,
    \`totalQuantity\` INT NOT NULL DEFAULT 0,
    \`notes\` VARCHAR(191) NOT NULL DEFAULT '',
    \`status\` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    \`doNumber\` VARCHAR(191) NOT NULL DEFAULT '',
    \`deliveredQuantity\` INT NULL,
    \`deliveredBags\` INT NULL,
    \`deliveredCartons\` INT NULL,
    \`createdById\` INT NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`lpos_createdById_fkey\` (\`createdById\`),
    CONSTRAINT \`lpos_createdById_fkey\` FOREIGN KEY (\`createdById\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS \`activity_logs\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`lpoId\` INT NOT NULL,
    \`changedById\` INT NOT NULL,
    \`oldStatus\` VARCHAR(191) NOT NULL,
    \`newStatus\` VARCHAR(191) NOT NULL,
    \`notes\` VARCHAR(191) NOT NULL DEFAULT '',
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`activity_logs_lpoId_fkey\` (\`lpoId\`),
    KEY \`activity_logs_changedById_fkey\` (\`changedById\`),
    CONSTRAINT \`activity_logs_lpoId_fkey\` FOREIGN KEY (\`lpoId\`) REFERENCES \`lpos\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT \`activity_logs_changedById_fkey\` FOREIGN KEY (\`changedById\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
];

function parseDbUrl(url) {
  const m = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/(.+)$/);
  if (!m) throw new Error("Could not parse DATABASE_URL");
  return { user: decodeURIComponent(m[1]), password: decodeURIComponent(m[2]), host: m[3], port: Number(m[4]), database: m[5] };
}

async function main() {
  const config = parseDbUrl(process.env.DATABASE_URL);
  const conn = await mysql.createConnection(config);
  for (const sql of STATEMENTS) {
    await conn.query(sql);
    console.log("OK:", sql.split("\n")[0]);
  }
  await conn.end();
  console.log("All tables created (or already existed).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
