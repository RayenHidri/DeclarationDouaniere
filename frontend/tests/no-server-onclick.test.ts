const fs = require('fs');
const path = require('path');

test('no server components should contain inline onClick handlers', () => {
  const appDir = path.join(__dirname, '..', 'app');
  const filesToCheck: string[] = [];

  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
        filesToCheck.push(full);
      }
    }
  }

  walk(appDir);

  const offending: string[] = [];

  for (const file of filesToCheck) {
    const txt = fs.readFileSync(file, 'utf8');
    if (txt.includes('export default async function') && txt.includes('onClick=')) {
      offending.push(path.relative(process.cwd(), file));
    }
  }

  if (offending.length > 0) {
    throw new Error('Found server components with inline onClick handlers:\n' + offending.join('\n'));
  }
});