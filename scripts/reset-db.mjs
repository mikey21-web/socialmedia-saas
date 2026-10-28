import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'data');
let removed = 0;
for (const file of ['app.db', 'app.db-wal', 'app.db-shm']) {
  const target = path.join(dir, file);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
    removed += 1;
  }
}
console.log(removed ? `Removed ${removed} local database file(s).` : 'No local database found.');
console.log('Start the app with `npm run dev` to recreate and reseed data/app.db.');
