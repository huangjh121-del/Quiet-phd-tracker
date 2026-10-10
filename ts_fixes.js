const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace("const fileInputRef = useRef(null);", "const fileInputRef = useRef<HTMLInputElement>(null);");
code = code.replace("const handleFileUpload = async (e) => {", "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {");
code = code.replace("const pageText = textContent.items.map((item) => item.str).join(\\\" \\\\\\\"\\\");", "const pageText = textContent.items.map((item: any) => item.str).join(\\\" \\\");");
code = code.replace("const pageText = textContent.items.map((item) => item.str).join(\" \");", "const pageText = textContent.items.map((item: any) => item.str).join(\" \");");

fs.writeFileSync('src/app/page.tsx', code);
