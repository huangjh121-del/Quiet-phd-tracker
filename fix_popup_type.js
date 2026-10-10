const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldType = `  const [activePopup, setActivePopup] = useState<{
    word: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
  } | null>(null);`;

const newType = `  const [activePopup, setActivePopup] = useState<{
    word: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
    isUpwards?: boolean;
    windowHeight?: number;
  } | null>(null);`;

code = code.replace(oldType, newType);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Fixed type');
