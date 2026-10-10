const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

code = code.replace(
  "export default function RootLayout({ children }: LayoutProps<\"/\">) {",
  "export default function RootLayout({ children }: { children: React.ReactNode }) {"
);

fs.writeFileSync('src/app/layout.tsx', code);
console.log('Fixed layout props');
