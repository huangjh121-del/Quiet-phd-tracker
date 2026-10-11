const fs = require('fs');

const files = [
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx'
];

files.forEach(p => {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    
    // Remove dynamic
    code = code.replace("export const dynamic = 'force-dynamic';\n\n", "");
    
    // Add suspense
    if (!code.includes('Suspense')) {
      code = code.replace('import { SignIn } from "@clerk/nextjs";', 'import { SignIn } from "@clerk/nextjs";\nimport { Suspense } from "react";');
      code = code.replace('import { SignUp } from "@clerk/nextjs";', 'import { SignUp } from "@clerk/nextjs";\nimport { Suspense } from "react";');
      
      code = code.replace('<SignIn />', '<Suspense fallback={<div>Loading...</div>}><SignIn /></Suspense>');
      code = code.replace('<SignUp />', '<Suspense fallback={<div>Loading...</div>}><SignUp /></Suspense>');
      
      fs.writeFileSync(p, code);
    }
  }
});

console.log('Patched auth suspense');
