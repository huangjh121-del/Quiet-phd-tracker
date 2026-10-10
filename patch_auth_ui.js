const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!code.includes("import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'")) {
  code = code.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport { SignInButton, SignUpButton, SignedOut, SignedIn, UserButton } from '@clerk/nextjs';"
  );
  
  const oldNav = `<div className="flex items-center gap-4">
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" /> Import
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Settings className="w-5 h-5" /></button>
          </div>`;
          
  const newNav = `<div className="flex items-center gap-4">
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" /> Import
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Settings className="w-5 h-5" /></button>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-bold text-[#111827] hover:text-[#3D5A80] transition-colors ml-2">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="ml-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>`;

  code = code.replace(oldNav, newNav);
  fs.writeFileSync('src/app/page.tsx', code);
  console.log('Added auth UI controls to page.tsx');
}
