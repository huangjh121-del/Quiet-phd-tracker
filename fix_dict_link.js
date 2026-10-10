const fs = require('fs');
let code = fs.readFileSync('src/app/api/dict/route.ts', 'utf8');

const regex = /const stmt = database\.prepare\("SELECT definition_html FROM dict_oald WHERE word COLLATE NOCASE \= \? LIMIT 1"\);\n    const result = stmt\.get\(word\);/;

const replacement = `const stmt = database.prepare("SELECT definition_html FROM dict_oald WHERE word COLLATE NOCASE = ? LIMIT 1");
    let result = stmt.get(word);

    if (result && result.definition_html.startsWith('@@@LINK=')) {
      const linkWord = result.definition_html.replace('@@@LINK=', '').trim();
      result = stmt.get(linkWord);
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/dict/route.ts', code);
