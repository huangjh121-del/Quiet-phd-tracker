const fs = require('fs');
let code = fs.readFileSync('src/app/api/mark-learned/route.ts', 'utf8');

code = code.replace(
  'sql: `UPDATE ${tableName} SET repetition = 1, next_review_at = ? WHERE ${idColumn} = ?`',
  'sql: `UPDATE ${tableName} SET ${type === "phrase" ? "repetitions" : "repetition"} = 1, next_review_at = ? WHERE ${idColumn} = ?`'
);

fs.writeFileSync('src/app/api/mark-learned/route.ts', code);
console.log('Fixed mark-learned API');
