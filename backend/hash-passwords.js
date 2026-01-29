const bcrypt = require('bcrypt');

async function run() {
  const passwords = {
    'admin@intermetal.com': 'Admin@2024',
    'mouradc@intermetal.com': 'Mourad@2024',
    'achat@intermetal.com': 'Achat@2024',
    'export@intermetal.com': 'Export@2024',
  };

  const saltRounds = 10;

  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`${email} -> ${hash}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});