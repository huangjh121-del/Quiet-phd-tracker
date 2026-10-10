const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace("                    )}}", "                    )}");
code = code.replace("                    }`}", "                    )}");
fs.writeFileSync('src/app/page.tsx', code);
