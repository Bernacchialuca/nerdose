import { hashPassword } from '../src/domain/admin/admin-auth';

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
const password = Buffer.concat(chunks)
  .toString('utf8')
  .replace(/\r?\n$/, '');

if (password === '') {
  console.error(
    'Pasá la contraseña por stdin: echo -n "<contraseña>" | pnpm --filter api admin:hash',
  );
  process.exit(1);
}

console.log(await hashPassword(password));
