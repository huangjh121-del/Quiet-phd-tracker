const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// Add isClient state
code = code.replace(
  "const [pdfDoc, setPdfDoc] = useState<any>(null);",
  "const [pdfDoc, setPdfDoc] = useState<any>(null);\n  const [isClient, setIsClient] = useState(false);"
);

// Set isClient to true on mount
code = code.replace(
  "useEffect(() => {",
  "useEffect(() => {\n    setIsClient(true);"
);

// Return null if not client
const oldReturn = "return (\n    <div className=";
const newReturn = "if (!isClient) return null;\n\n  return (\n    <div className=";
code = code.replace(oldReturn, newReturn);

fs.writeFileSync('src/app/reader/page.tsx', code);
