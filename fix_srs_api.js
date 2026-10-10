const fs = require('fs');
let code = fs.readFileSync('src/app/api/srs-review/route.ts', 'utf8');

code = code.replace(/\\`/g, "`");
code = code.replace(/\\\$/g, "$");

fs.writeFileSync('src/app/api/srs-review/route.ts', code);
