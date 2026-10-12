'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ReaderClient = nextDynamic(() => import('./ReaderClient'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-screen items-center justify-center bg-[#FAF9F6] text-[#6B7280]">
      <Loader2 className="w-8 h-8 animate-spin text-[#3D5A80] mb-4" />
      <p className="text-sm font-medium text-[#4A5568]">正在启动阅读引擎...</p>
    </div>
  )
});

export default function Page() {
  return <ReaderClient />;
}
