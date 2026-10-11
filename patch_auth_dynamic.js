const fs = require('fs');

const files = [
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx'
];

files.forEach(p => {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    if (!code.includes('export const dynamic')) {
      code = "export const dynamic = 'force-dynamic';\n\n" + code;
      fs.writeFileSync(p, code);
    }
  }
});

console.log('Patched auth dynamic');
