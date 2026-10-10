const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const oldFn = `  const getWordFromPoint = (doc: Document, clientX: number, clientY: number) => {
    let range, textNode, offset;
    if ((doc as any).caretPositionFromPoint) {
      const pos = (doc as any).caretPositionFromPoint(clientX, clientY);
      if (!pos) return null;
      textNode = pos.offsetNode;
      offset = pos.offset;
    } else if ((doc as any).caretRangeFromPoint) {
      range = (doc as any).caretRangeFromPoint(clientX, clientY);
      if (!range) return null;
      textNode = range.startContainer;
      offset = range.startOffset;
    }

    if (textNode && textNode.nodeType === 3) {
      const text = textNode.textContent || '';
      let start = offset;
      let end = offset;
      while (start > 0 && /[a-zA-Z-]/.test(text[start - 1])) start--;
      while (end < text.length && /[a-zA-Z-]/.test(text[end])) end++;
      
      const word = text.slice(start, end);
      return word;
    }
    return null;
  };`;

const newFn = `  const getWordFromPoint = (doc: Document, clientX: number, clientY: number) => {
    // Prevent snapping to text when hovering over margins/whitespace
    const el = doc.elementFromPoint(clientX, clientY);
    if (!el) return null;
    
    // In Text mode, only allow hovering over the text container or its children
    // In PDF mode, the text layers are specific spans.
    // If the element is a generic full-width background wrapper, reject.
    const isBackground = el.tagName === 'MAIN' || el.classList.contains('overflow-y-auto') || el.classList.contains('bg-[#FAF9F6]');
    if (isBackground) return null;

    let range, textNode, offset;
    if ((doc as any).caretPositionFromPoint) {
      const pos = (doc as any).caretPositionFromPoint(clientX, clientY);
      if (!pos) return null;
      textNode = pos.offsetNode;
      offset = pos.offset;
    } else if ((doc as any).caretRangeFromPoint) {
      range = (doc as any).caretRangeFromPoint(clientX, clientY);
      if (!range) return null;
      textNode = range.startContainer;
      offset = range.startOffset;
    }

    if (textNode && textNode.nodeType === 3) {
      const text = textNode.textContent || '';
      let start = offset;
      let end = offset;
      while (start > 0 && /[a-zA-Z-]/.test(text[start - 1])) start--;
      while (end < text.length && /[a-zA-Z-]/.test(text[end])) end++;
      
      const word = text.slice(start, end);
      return word;
    }
    return null;
  };`;

code = code.replace(oldFn, newFn);
fs.writeFileSync('src/app/reader/page.tsx', code);
