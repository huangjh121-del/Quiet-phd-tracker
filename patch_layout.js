const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  '<html',
  '<html suppressHydrationWarning'
);

code = code.replace(
  '<body ',
  '<body suppressHydrationWarning '
);

fs.writeFileSync('src/app/layout.tsx', code);
