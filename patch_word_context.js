const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Modify getWordFromPoint to return context
const oldGetWord = `      const word = text.slice(start, end);
      return word;
    }
    return null;
  };`;

const newGetWord = `      const word = text.slice(start, end);
      
      let context = text;
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const match = sentences.find(s => s.includes(word));
      if (match) context = match.trim();

      return { word, context };
    }
    return null;
  };`;

code = code.replace(oldGetWord, newGetWord);

// 2. Modify lookupWord signature and usage
code = code.replace(
  'const lookupWord = async (word: string, clientX: number, clientY: number) => {',
  'const lookupWord = async (word: string, context: string, clientX: number, clientY: number) => {'
);

code = code.replace(
  'const word = getWordFromPoint(doc, e.clientX, e.clientY);\n    \n    if (word && word.length > 1) {\n      // Hovering over a valid word, start lookup timer\n      hoverTimer.current = setTimeout(() => {\n        lookupWord(word, e.clientX, e.clientY);',
  'const result = getWordFromPoint(doc, e.clientX, e.clientY);\n    \n    if (result && result.word.length > 1) {\n      // Hovering over a valid word, start lookup timer\n      hoverTimer.current = setTimeout(() => {\n        lookupWord(result.word, result.context, e.clientX, e.clientY);'
);

code = code.replace(
  'const word = getWordFromPoint(doc, e.clientX, e.clientY);\n    if (word && word.length > 1) {\n      hoverTimer.current = setTimeout(() => {\n        const iframe = document.querySelector(\'iframe\');\n        const iframeRect = iframe?.getBoundingClientRect();\n        const adjustedX = e.clientX + (iframeRect?.left || 0);\n        const adjustedY = e.clientY + (iframeRect?.top || 0);\n        \n        lookupWord(word, adjustedX, adjustedY);',
  'const result = getWordFromPoint(doc, e.clientX, e.clientY);\n    if (result && result.word.length > 1) {\n      hoverTimer.current = setTimeout(() => {\n        const iframe = document.querySelector(\'iframe\');\n        const iframeRect = iframe?.getBoundingClientRect();\n        const adjustedX = e.clientX + (iframeRect?.left || 0);\n        const adjustedY = e.clientY + (iframeRect?.top || 0);\n        \n        lookupWord(result.word, result.context, adjustedX, adjustedY);'
);

// 3. Add context to activePopup state type
const oldType = `    word: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
    isUpwards?: boolean;
    windowHeight?: number;
  } | null>(null);`;

const newType = `    word: string;
    context?: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
    isUpwards?: boolean;
    windowHeight?: number;
  } | null>(null);`;

code = code.replace(oldType, newType);

// 4. Update setActivePopup inside lookupWord
code = code.replace(
  'word: cleanWord,\n      x: clientX,\n      y: isUpwards ? clientY - 15 : clientY + 15,\n      isUpwards,\n      windowHeight: window.innerHeight,\n      isLoading: true\n    });',
  'word: cleanWord,\n      context,\n      x: clientX,\n      y: isUpwards ? clientY - 15 : clientY + 15,\n      isUpwards,\n      windowHeight: window.innerHeight,\n      isLoading: true\n    });'
);

// 5. Update save API call to send context
const oldSaveApi = `      const res = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToSave, htmlDefinition: htmlToSave })
      });`;

const newSaveApi = `      const res = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToSave, htmlDefinition: htmlToSave, context: activePopup.context || "" })
      });`;

code = code.replace(oldSaveApi, newSaveApi);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Done');
