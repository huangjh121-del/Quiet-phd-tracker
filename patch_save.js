const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const oldHandleSave = `  const handleSaveWord = () => {
    if (activePopup && !savedWords.includes(activePopup.word)) {
      setSavedWords([...savedWords, activePopup.word]);
      setTimeout(() => setActivePopup(null), 1000);
    }
  };`;

const newHandleSave = `  const handleSaveWord = async () => {
    if (activePopup && !savedWords.includes(activePopup.word)) {
      const wordToSave = activePopup.word;
      const htmlToSave = activePopup.html || "";
      
      // Optimistic UI update
      setSavedWords([...savedWords, wordToSave]);
      setTimeout(() => setActivePopup(null), 1000);

      // Save to Cloudflare D1
      try {
        await fetch('/api/save-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: wordToSave, htmlDefinition: htmlToSave })
        });
      } catch (error) {
        console.error("Failed to save word remotely", error);
      }
    }
  };`;

code = code.replace(oldHandleSave, newHandleSave);
fs.writeFileSync('src/app/reader/page.tsx', code);
