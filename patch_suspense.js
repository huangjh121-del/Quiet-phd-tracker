const fs = require('fs');
let code = fs.readFileSync('src/app/review/learn/page.tsx', 'utf8');

code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, Suspense } from 'react';");

code = code.replace(
  "export default function LearnSession() {",
  "function LearnSessionInner() {"
);

const outer = `
export default function LearnSession() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">Loading...</div>}>
      <LearnSessionInner />
    </Suspense>
  );
}
`;

code = code + outer;

fs.writeFileSync('src/app/review/learn/page.tsx', code);
console.log('Added Suspense');
