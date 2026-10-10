const fs = require('fs');

// 1. Move page.tsx to ReaderClient.tsx
const oldCode = fs.readFileSync('src/app/reader/page.tsx', 'utf8');
fs.writeFileSync('src/app/reader/ReaderClient.tsx', oldCode);

// 2. Rewrite page.tsx to be a dynamic wrapper
const newPageCode = `import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ReaderClient = dynamic(() => import('./ReaderClient'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#FAF9F6] text-[#6B7280]">
      <Loader2 className="w-8 h-8 animate-spin text-[#3D5A80] mb-4" />
    </div>
  )
});

export default function Page() {
  return <ReaderClient />;
}
`;
fs.writeFileSync('src/app/reader/page.tsx', newPageCode);
