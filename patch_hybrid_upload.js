const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldProcessFile = `  const processFile = async (file: File) => {
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
  };`;

const newProcessFile = `  const processFile = async (file: File) => {
    if (!file) return;
    
    const isEpub = file.name.toLowerCase().endsWith('.epub');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    
    if (!isEpub && !isPdf) {
      alert("Please select a valid PDF or EPUB file.");
      return;
    }

    setIsExtracting(true);
    try {
      const localforage = (await import('localforage')).default;
      await localforage.setItem('quiet_file_blob', file);
      await localforage.setItem('quiet_file_type', isPdf ? 'pdf' : 'epub');
      
      router.push('/reader');
    } catch (err) {
      console.error("Error saving file:", err);
      alert("Could not read this file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };`;

code = code.replace(oldProcessFile, newProcessFile);
code = code.replace(/accept="\.epub"/g, 'accept=".epub,.pdf"');
code = code.replace(/Processing EPUB file\.\.\./g, 'Processing Document...');
code = code.replace(/Click or Drag & Drop an EPUB book here/g, 'Click or Drag & Drop a PDF or EPUB here');

fs.writeFileSync('src/app/page.tsx', code);
