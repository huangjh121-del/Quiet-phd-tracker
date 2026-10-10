const fs = require('fs');
let code = fs.readFileSync('src/app/api/words/route.ts', 'utf8');

code = code.replace("const fetchD1 = (payload) =>", "const fetchD1 = (payload: any) =>");
code = code.replace("map(w =>", "map((w: any) =>");
code = code.replace("map(p =>", "map((p: any) =>");

fs.writeFileSync('src/app/api/words/route.ts', code);
