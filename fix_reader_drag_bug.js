const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldGlobalMove = `const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    // If user is actively selecting text, do NOT show dictionary
    if ((window.getSelection()?.toString() || '').trim().length > 0) return;
    if (e.buttons > 0) return; // Mouse is held down (dragging)

    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);`;

const newGlobalMove = `const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    // Always clear timers first before returning!
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    // If user is actively selecting text, do NOT start a new dictionary timer
    if ((window.getSelection()?.toString() || '').trim().length > 0) return;
    if (e.buttons > 0) return; // Mouse is held down (dragging)`;

code = code.replace(oldGlobalMove, newGlobalMove);

const oldIframeMove = `const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    const doc = (e.target as Node)?.ownerDocument as any;`;

const newIframeMove = `const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    if (e.buttons > 0) return;
    try {
      const doc = (e.target as Node)?.ownerDocument as any;
      if (doc?.defaultView?.getSelection()?.toString().trim().length > 0) return;
    } catch(err) {}

    const doc = (e.target as Node)?.ownerDocument as any;`;

code = code.replace(oldIframeMove, newIframeMove);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
