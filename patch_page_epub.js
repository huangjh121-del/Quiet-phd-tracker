const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldImportModal = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please select a valid PDF file.");
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\\n\\n";
      }
      
      setImportText(fullText.trim());
    } catch (err) {
      console.error("Error extracting PDF:", err);
      alert("Could not extract text from this PDF. It might be a scanned image or protected.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };`;

const newImportModal = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert("Please select a valid EPUB file.");
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // We must dynamically import localforage so it only runs on the client side
      const localforage = (await import('localforage')).default;
      await localforage.setItem('quiet_epub', arrayBuffer);
      
      router.push('/reader');
    } catch (err) {
      console.error("Error saving EPUB:", err);
      alert("Could not read this EPUB file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };`;

code = code.replace(oldImportModal, newImportModal);

// Also replace the input accept attribute and the text
code = code.replace(/accept="application\/pdf"/g, 'accept=".epub"');
code = code.replace(/Extracting text from PDF\.\.\./g, 'Processing EPUB file...');
code = code.replace(/Click to upload a PDF/g, 'Click to upload an EPUB book');
code = code.replace(/import \* as pdfjsLib from 'pdfjs-dist';/g, '');
code = code.replace(/if \(typeof window !== 'undefined'\) {\n  pdfjsLib.GlobalWorkerOptions.*\n}/g, '');

fs.writeFileSync('src/app/page.tsx', code);
