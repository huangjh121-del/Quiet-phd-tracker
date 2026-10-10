const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

code = code.replace("import 'react-pdf/dist/esm/Page/TextLayer.css';", "import 'react-pdf/dist/Page/TextLayer.css';");
code = code.replace("import 'react-pdf/dist/esm/Page/AnnotationLayer.css';", "import 'react-pdf/dist/Page/AnnotationLayer.css';");

fs.writeFileSync('src/app/reader/page.tsx', code);
