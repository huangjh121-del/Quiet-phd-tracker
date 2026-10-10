const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// Replace the imports to include useRouter and useSearchParams
code = code.replace(
  "import Link from 'next/link';",
  "import Link from 'next/link';\nimport { useRouter, useSearchParams } from 'next/navigation';"
);

// We need to wrap the whole default export in a Suspense, or just read window.location.search if we don't want to use useSearchParams
// Wait, since this is a Next.js App router, using `useSearchParams` will cause the route to be dynamically rendered unless wrapped in Suspense.
// But we are in a purely client-side app right now, so it's fine. Still, using `window.location.search` in useEffect is safer for avoiding hydration errors or Next.js build errors.

const stateInitRe = `  const \\[fileData, setFileData\\] = useState<File \\| ArrayBuffer \\| null>\\(null\\);\n  const \\[fileType, setFileType\\] = useState<'pdf' \\| 'epub' \\| null>\\(null\\);`;
const stateInitNew = `  const [fileData, setFileData] = useState<File | ArrayBuffer | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');`;

code = code.replace(new RegExp(stateInitRe), stateInitNew);

const effectRe = `  useEffect\\(\\(\\) => \\{
    localforage\\.getItem\\('quiet_file_type'\\)\\.then\\(\\(type: any\\) => \\{
      setFileType\\(type\\);
      localforage\\.getItem\\('quiet_file_blob'\\)\\.then\\(async \\(blob: any\\) => \\{
        if \\(blob && blob instanceof Blob\\) \\{
          if \\(type === 'pdf'\\) \\{
            // react-pdf can accept the File object directly
            setFileData\\(blob as File\\);
          \\} else \\{
            // epubjs needs ArrayBuffer
            const buffer = await blob\\.arrayBuffer\\(\\);
            setFileData\\(buffer\\);
          \\}
        \\}
      \\}\\);
    \\}\\);
  \\}, \\[\\]\\);`;

const effectNew = `  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    if (!id) return;
    setBookId(id);

    localforage.getItem<any[]>('quiet_library').then(lib => {
      if (lib) {
        const bookInfo = lib.find(b => b.id === id);
        if (bookInfo) {
          setBookTitle(bookInfo.title);
          setFileType(bookInfo.type);
          if (bookInfo.type === 'pdf') {
            setPageNumber(Number(bookInfo.currentLocation) || 1);
          } else {
            setLocation(bookInfo.currentLocation || 0);
          }
        }
      }
    });

    localforage.getItem(\`quiet_book_\${id}\`).then(async (blob: any) => {
      if (blob && blob instanceof Blob) {
        // Must check fileType from the blob or metadata. We can just check name/type
        const isPdf = blob.type === 'application/pdf' || blob.name?.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          setFileData(blob as File);
        } else {
          const buffer = await blob.arrayBuffer();
          setFileData(buffer);
        }
      }
    });
  }, []);

  const saveProgress = async (currentLoc: string | number, progressPercent: number, totalPages: number = 0) => {
    if (!bookId) return;
    const lib = await localforage.getItem<any[]>('quiet_library') || [];
    const idx = lib.findIndex(b => b.id === bookId);
    if (idx !== -1) {
      lib[idx].currentLocation = currentLoc;
      lib[idx].progress = progressPercent;
      lib[idx].lastReadAt = Date.now();
      if (totalPages) lib[idx].totalSize = totalPages;
      await localforage.setItem('quiet_library', lib);
    }
  };
`;

code = code.replace(new RegExp(effectRe), effectNew);

// Update PDF pagination logic to call saveProgress
code = code.replace(
  `setPageNumber(p => Math.min(numPages, p + 1));`,
  `setPageNumber(p => { const next = Math.min(numPages, p + 1); saveProgress(next, Math.round((next/numPages)*100), numPages); return next; });`
);
code = code.replace(
  `setPageNumber(p => Math.max(1, p - 1));`,
  `setPageNumber(p => { const next = Math.max(1, p - 1); saveProgress(next, Math.round((next/numPages)*100), numPages); return next; });`
);

// Update header buttons for PDF page changing
code = code.replace(
  `onClick={() => setPageNumber(p => p - 1)}`,
  `onClick={() => setPageNumber(p => { const next = p - 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}`
);
code = code.replace(
  `onClick={() => setPageNumber(p => p + 1)}`,
  `onClick={() => setPageNumber(p => { const next = p + 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}`
);

// Fix title display
code = code.replace(
  `{fileType === 'pdf' ? 'Imported PDF' : 'Imported EPUB'}`,
  `{bookTitle || (fileType === 'pdf' ? 'PDF Document' : 'EPUB Document')}`
);

// Update EPUB location change
const oldEpubChange = `locationChanged={(epubcifi: string) => setLocation(epubcifi)}`;
const newEpubChange = `locationChanged={(epubcifi: string) => {
              setLocation(epubcifi);
              // Calculate progress
              if (renditionRef.current) {
                const loc = renditionRef.current.currentLocation();
                if (loc && loc.start) {
                  const percent = Math.round(loc.start.percentage * 100);
                  saveProgress(epubcifi, percent || 0);
                } else {
                  saveProgress(epubcifi, 0);
                }
              }
            }}`;

code = code.replace(oldEpubChange, newEpubChange);

// Ensure renditionRef is defined in the component (I added it in an earlier patch, but need to check if it's there)
// Wait, I might have overwritten renditionRef in previous patches.
if (!code.includes('const renditionRef = useRef<any>(null);')) {
  code = code.replace(
    'const hoverTimer = useRef<NodeJS.Timeout | null>(null);',
    'const hoverTimer = useRef<NodeJS.Timeout | null>(null);\n  const renditionRef = useRef<any>(null);'
  );
}

// Ensure rendition is assigned to ref
code = code.replace(
  `getRendition={(rendition) => {
              rendition.themes.fontSize(\\\`\\\${fontSize}%\\\`);`,
  `getRendition={(rendition) => {
              renditionRef.current = rendition;
              rendition.themes.fontSize(\\\`\\\${fontSize}%\\\`);`
);

fs.writeFileSync('src/app/reader/page.tsx', code);
