// Usage: node scripts/hash-password.js   (prompts, so the password isn't left in shell history)
// Paste the output into the ADMIN_HASH environment variable in cPanel.
import { createInterface } from 'node:readline';
import { hashPassword } from '../lib/auth.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question('Admin password: ', (pw) => {
  rl.close();
  if (pw.length < 10) {
    console.error('Use at least 10 characters.');
    process.exit(1);
  }
  console.log('\nADMIN_HASH=' + hashPassword(pw));
});
