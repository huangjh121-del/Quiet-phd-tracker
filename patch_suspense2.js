const fs = require('fs');

function wrapWithSuspense(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('Suspense')) return;

  code = code.replace(
    'export default function ',
    'function MainContent '
  );
  
  code = `import { Suspense } from 'react';\n` + code;
  
  const componentNameMatch = code.match(/function MainContent\s*\([^)]*\)\s*\{/);
  if (!componentNameMatch) return;
  
  code += `\n\nexport default function Page() {\n  return (\n    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>\n      <MainContent />\n    </Suspense>\n  );\n}`;
  
  fs.writeFileSync(filePath, code);
}

wrapWithSuspense('src/app/review/session/page.tsx');
wrapWithSuspense('src/app/review/learn/page.tsx');

console.log('Suspense added');
