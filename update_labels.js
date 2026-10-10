const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Using regex to replace the exact contents
code = code.replace(/Good\s*<br\s*\/>\s*Expressions/g, 'Expressions');
code = code.replace(/Good Expressions/g, 'Expressions');
code = code.replace(/Beautiful\s*<br\s*\/>\s*Sentences/g, 'Sentences');
code = code.replace(/Beautiful Sentences/g, 'Sentences');

fs.writeFileSync('src/app/page.tsx', code);
console.log('Regex update complete!');
