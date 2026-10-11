const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('Suspense fallback')) {
    console.log(filePath + ' already fixed');
    return;
  }
  
  // replace "export default function [Name]" with "function MainContent"
  code = code.replace(/export default function \w+/, 'function MainContent');
  
  if (!code.includes('import { Suspense }')) {
    code = code.replace("'use client';", "'use client';\n\nimport { Suspense } from 'react';");
  }
  
  code += `\n\nexport default function Page() {\n  return (\n    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}>\n      <MainContent />\n    </Suspense>\n  );\n}\n`;
  
  fs.writeFileSync(filePath, code);
  console.log('Fixed ' + filePath);
}

fixFile('src/app/review/session/page.tsx');
fixFile('src/app/review/learn/page.tsx');
