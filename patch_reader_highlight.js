const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Get highlight param
code = code.replace(
  "const id = searchParams.get('id');",
  "const id = searchParams.get('id');\n    const highlight = searchParams.get('highlight');\n    if (highlight) setHighlightText(highlight);"
);

// Add highlightText state
code = code.replace(
  "const [toast, setToast] = useState<string | null>(null);",
  "const [toast, setToast] = useState<string | null>(null);\n  const [highlightText, setHighlightText] = useState<string | null>(null);"
);

// Add rendering function
const renderFunc = `
  const renderHighlightedText = (text: string, highlight: string | null) => {
    if (!highlight) return text;
    // Simple case-insensitive exact substring split
    const parts = text.split(highlight);
    if (parts.length === 1) return text;
    
    return parts.reduce((prev: any, current: string, i: number) => {
      if (i === 0) return [current];
      return prev.concat(
        <mark key={i} id="highlight-target" className="bg-[#E07A5F]/40 text-inherit rounded-md px-1.5 py-0.5 shadow-sm transition-all animate-pulse">{highlight}</mark>,
        current
      );
    }, [] as any[]);
  };
`;
code = code.replace("const handleSaveWord = async () => {", renderFunc + "\n  const handleSaveWord = async () => {");

// Apply to rendering
const oldTextRender = "{fileData as string}";
const newTextRender = "{renderHighlightedText(fileData as string, highlightText)}";
code = code.replace(oldTextRender, newTextRender);

// Add scrolling effect
const scrollEffect = `
  useEffect(() => {
    if (fileType === 'text' && highlightText && fileData) {
      setTimeout(() => {
        const el = document.getElementById('highlight-target');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Temporarily remove animate-pulse after a few seconds so it doesn't blink forever
          setTimeout(() => el.classList.remove('animate-pulse'), 3000);
        }
      }, 300); // give it a moment to render
    }
  }, [fileType, highlightText, fileData]);
`;
code = code.replace("useEffect(() => {\n    if (fileType === 'text' && fileData && typeof fileData === 'string')", scrollEffect + "\n  useEffect(() => {\n    if (fileType === 'text' && fileData && typeof fileData === 'string')");

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Patched reader highlight');
