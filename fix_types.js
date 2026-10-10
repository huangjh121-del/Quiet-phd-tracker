const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace("const processFile = async (file) => {", "const processFile = async (file: File) => {");
code = code.replace("const handleFileUpload = (e) =>", "const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) =>");
code = code.replace("const handleDragOver = (e) =>", "const handleDragOver = (e: React.DragEvent) =>");
code = code.replace("const handleDragLeave = (e) =>", "const handleDragLeave = (e: React.DragEvent) =>");
code = code.replace("const handleDrop = (e) =>", "const handleDrop = (e: React.DragEvent) =>");

fs.writeFileSync('src/app/page.tsx', code);
