const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Modify the setActivePopup call in lookupWord
const oldPopupState = `    setActivePopup({
      word: cleanWord,
      x: clientX,
      y: clientY + 15,
      isLoading: true
    });`;

const newPopupState = `    const isUpwards = clientY > window.innerHeight - 500;
    setActivePopup({
      word: cleanWord,
      x: clientX,
      y: isUpwards ? clientY - 15 : clientY + 15,
      isUpwards,
      windowHeight: window.innerHeight,
      isLoading: true
    });`;

code = code.replace(oldPopupState, newPopupState);

// 2. Modify the style in the popup renderer
const oldStyle = 'style={{ left: activePopup.x, top: activePopup.y }}';
const newStyle = 'style={{ left: activePopup.x, ...(activePopup.isUpwards ? { bottom: (activePopup.windowHeight || window.innerHeight) - activePopup.y } : { top: activePopup.y }) }}';
code = code.replace(oldStyle, newStyle);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Fixed popup bounds');
