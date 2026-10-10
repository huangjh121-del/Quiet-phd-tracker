const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const dictHtmlContainerMatch = /<div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup\.html }} \/>/;

if (code.includes('<div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup.html }} />')) {
  
  // Inject the handleDictClick function right before the return statement of the component
  const handleDictClickStr = `
  const handleDictClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      e.preventDefault();
      let wordToLookUp = anchor.innerText.trim();
      
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('entry://')) {
        wordToLookUp = decodeURIComponent(href.replace('entry://', ''));
      } else if (href && href.startsWith('dict://')) {
        wordToLookUp = decodeURIComponent(href.replace('dict://', ''));
      } else if (href && href.startsWith('bvg://')) {
        wordToLookUp = decodeURIComponent(href.replace('bvg://', ''));
      }
      
      // Clean up punctuation but allow spaces for phrasal verbs
      wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\\s]/g, '').toLowerCase().trim();
      
      if (wordToLookUp) {
        setActivePopup(prev => prev ? { ...prev, isLoading: true, word: wordToLookUp, html: undefined } : null);
        fetch(\`/api/dict?word=\${encodeURIComponent(wordToLookUp)}\`)
          .then(res => res.json())
          .then(data => {
            setActivePopup(prev => prev?.word === wordToLookUp ? {
              ...prev,
              isLoading: false,
              html: data.html
            } : prev);
          });
      }
    }
  };

  return (
    <div className="min-h-screen`;
    
  code = code.replace('  return (\n    <div className="min-h-screen', handleDictClickStr);
  
  // Add the onClick handler to the container
  code = code.replace(
    '<div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup.html }} />',
    '<div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup.html }} onClick={handleDictClick} />'
  );
  
  fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find dict-html-container");
}
