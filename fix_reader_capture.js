const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Modify the handleClick in useEffect to use capture phase and handle selectstart
const effectRegex = /const handleClick = \(e: MouseEvent\) => \{\n      if \(hoverTimer\.current\) clearTimeout\(hoverTimer\.current\);\n      if \(!\(e\.target as HTMLElement\)\.closest\('\.dict-popup'\)\) \{\n        setActivePopup\(null\);\n      \}\n    \};\n    window\.addEventListener\('mousedown', handleClick\);\n    return \(\) => window\.removeEventListener\('mousedown', handleClick\);/;

const effectReplacement = `const handleClick = (e: Event) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (e.type === 'mousedown' && !(e.target as HTMLElement).closest('.dict-popup')) {
        setActivePopup(null);
      }
    };
    
    // Use capture phase (true) so it fires BEFORE any child elements can stop propagation
    window.addEventListener('mousedown', handleClick, true);
    window.addEventListener('selectstart', handleClick, true);
    window.addEventListener('dragstart', handleClick, true);
    
    return () => {
      window.removeEventListener('mousedown', handleClick, true);
      window.removeEventListener('selectstart', handleClick, true);
      window.removeEventListener('dragstart', handleClick, true);
    };`;

code = code.replace(effectRegex, effectReplacement);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
