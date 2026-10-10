const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

code = code.replace(
  "className=\"shadow-2xl cursor-text\"\n              onClick={(e) => e.stopPropagation()} // Prevent document clicks from bubbling if we want native text selection",
  "className=\"shadow-2xl cursor-text\""
);

fs.writeFileSync('src/app/reader/page.tsx', code);
