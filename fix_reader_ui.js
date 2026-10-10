const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Suppress hover dictionary when text is selected
const mouseMoveRegex = /const handleMouseMoveGlobal = \(e: MouseEvent \| React\.MouseEvent\) => \{/;
const mouseMoveFix = `const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    // If user is actively selecting text, do NOT show dictionary
    if (window.getSelection()?.toString().trim().length > 0) return;
    if (e.buttons > 0) return; // Mouse is held down (dragging)
`;
code = code.replace(mouseMoveRegex, mouseMoveFix);

// 2. Replace alert with Toast
const stateRegex = /const \[selectionMenu, setSelectionMenu\] = useState<[^>]+>\(null\);/;
const stateFix = `const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string, context: string, show: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
`;
code = code.replace(stateRegex, stateFix);

// Replace the alerts
code = code.replace("alert('Saved to Good Expressions!');", "showToast('Saved to Good Expressions!');");
code = code.replace("alert('Saved to Sentences Library!');", "showToast('Saved to Sentences Library!');");

// Add Toast UI
const toastUI = `
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in slide-in-from-bottom-5 font-bold tracking-wide text-sm">
          {toast}
        </div>
      )}
`;
code = code.replace("{/* Selection Menu */}", toastUI + "\n      {/* Selection Menu */}");

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
