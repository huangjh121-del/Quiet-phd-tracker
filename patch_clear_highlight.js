const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// We will use useSearchParams dynamically
code = code.replace(
  "const [highlightText, setHighlightText] = useState<string | null>(null);",
  "// Removed highlightText state in favor of dynamic searchParams"
);

// Inject useSearchParams hook at the top of the component
code = code.replace(
  "export default function Reader() {",
  "export default function Reader() {\n  const searchParamsHook = useSearchParams();\n  const highlightText = searchParamsHook.get('highlight');"
);

// Remove the old manual searchParams logic for highlight
code = code.replace(
  "const highlight = searchParams.get('highlight');\n    if (highlight) setHighlightText(highlight);",
  "// Highlight is now tracked reactively via useSearchParams"
);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Patched reader to clear highlight dynamically');
