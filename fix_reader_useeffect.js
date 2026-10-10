const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const regex = /document\.addEventListener\('mouseup', handleSelection\);\n    return \(\) => document\.removeEventListener\('mouseup', handleSelection\);\n\n    const searchParams = new URLSearchParams\(window\.location\.search\);/;

const replacement = `document.addEventListener('mouseup', handleSelection);

    const searchParams = new URLSearchParams(window.location.search);`;

code = code.replace(regex, replacement);

const endOfUseEffect = /          setFileData\(new TextDecoder\(\)\.decode\(ab\)\);\n        \}\n      \}\n    \}\);\n  \}, \[\]\);/;

const endReplacement = `          setFileData(new TextDecoder().decode(ab));
        }
      }
    });
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);`;

code = code.replace(endOfUseEffect, endReplacement);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
