const fs = require('fs');
let code = fs.readFileSync('src/app/review/session/page.tsx', 'utf8');

// Add useSearchParams to import
code = code.replace("import { ArrowLeft, Loader2, PlayCircle, FileText } from 'lucide-react';", "import { ArrowLeft, Loader2, PlayCircle, FileText } from 'lucide-react';\nimport { useSearchParams } from 'next/navigation';");

// Use the hook
code = code.replace("export default function ReviewPage() {", "export default function ReviewPage() {\n  const searchParams = useSearchParams();\n  const reviewType = searchParams.get('type') || 'word';");

// Filter items fetched from API
code = code.replace(
  "if (data.items) setItems(data.items);",
  "if (data.items) setItems(data.items.filter((i: any) => i.type === reviewType));"
);

// Modify return Link to go back to Hub
code = code.replace(/href="\/"/g, 'href="/review"');

fs.writeFileSync('src/app/review/session/page.tsx', code);
