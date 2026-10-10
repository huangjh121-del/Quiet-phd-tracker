const fs = require('fs');

// PATCH DASHBOARD FOR DRAG AND DROP
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add isDragging state
code = code.replace(
  'const [isExtracting, setIsExtracting] = useState(false);',
  'const [isExtracting, setIsExtracting] = useState(false);\n  const [isDragging, setIsDragging] = useState(false);'
);

// Add processFile function and handlers
const handlers = `
  const processFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert("Please select a valid EPUB file.");
      return;
    }

    setIsExtracting(true);
    try {
      // Store the raw Blob instead of ArrayBuffer to avoid IndexedDB serialization issues
      const localforage = (await import('localforage')).default;
      await localforage.setItem('quiet_epub_blob', file);
      
      router.push('/reader');
    } catch (err) {
      console.error("Error saving EPUB:", err);
      alert("Could not read this EPUB file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files?.[0]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
`;

code = code.replace(
  /const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?^\s*\};/m,
  handlers
);

// Update JSX for Dropzone
const oldDropzone = `className="border-2 border-dashed border-[#D1D5DB] hover:border-[#3D5A80] bg-[#FAF9F6] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}`;
const newDropzone = `className={"border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors " + (isDragging ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#D1D5DB] hover:border-[#3D5A80] bg-[#FAF9F6]')} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}`;

code = code.replace(oldDropzone, newDropzone);

// Also change "Click to upload an EPUB book" to "Click or Drag & Drop an EPUB book here"
code = code.replace('Click to upload an EPUB book', 'Click or Drag & Drop an EPUB book here');

fs.writeFileSync('src/app/page.tsx', code);

// PATCH READER FOR BETTER ARRAYBUFFER HANDLING
let readerCode = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    localforage.getItem<ArrayBuffer>('quiet_epub').then(data => {
      if (data) {
        setEpubData(data);
      }
    });
  }, []);`;

const newEffect = `  useEffect(() => {
    // Also support getting the blob
    localforage.getItem('quiet_epub_blob').then(async (blob: any) => {
      if (blob && blob instanceof Blob) {
        const buffer = await blob.arrayBuffer();
        setEpubData(buffer);
      } else {
        // Fallback for old arraybuffer
        localforage.getItem('quiet_epub').then((data: any) => {
          if (data) {
            // Ensure strict ArrayBuffer type
            let buffer = data;
            if (data.buffer && data instanceof Uint8Array) {
              buffer = data.buffer;
            }
            setEpubData(buffer);
          }
        });
      }
    });
  }, []);`;

readerCode = readerCode.replace(oldEffect, newEffect);
fs.writeFileSync('src/app/reader/page.tsx', readerCode);

