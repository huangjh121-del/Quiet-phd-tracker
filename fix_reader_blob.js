const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldBlobCheck = `    localforage.getItem(\`quiet_book_\${id}\`).then(async (blob: any) => {
      if (blob && blob instanceof Blob) {
        // Must check fileType from the blob or metadata. We can just check name/type
        if (blob.type === 'text/plain') {
          const text = await blob.text();
          setFileData(text);
        } else {
          const isPdf = blob.type === 'application/pdf' || (blob as File).name?.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            setFileData(blob as File);
          } else {
            const buffer = await blob.arrayBuffer();
            setFileData(buffer);
          }
        }
      }
    });`;

const newBlobCheck = `    localforage.getItem(\`quiet_book_\${id}\`).then(async (blob: any) => {
      if (!blob) {
        console.error("No blob found in localforage");
        return;
      }
      
      try {
        if (blob.type === 'text/plain') {
          const text = typeof blob.text === 'function' ? await blob.text() : await new Response(blob).text();
          setFileData(text);
        } else {
          const isPdf = blob.type === 'application/pdf' || (blob.name && blob.name.toLowerCase().endsWith('.pdf'));
          if (isPdf) {
            setFileData(blob);
          } else {
            const buffer = typeof blob.arrayBuffer === 'function' ? await blob.arrayBuffer() : await new Response(blob).arrayBuffer();
            setFileData(buffer);
          }
        }
      } catch (err) {
        console.error("Failed to parse blob:", err);
        setFileData(blob); // fallback
      }
    });`;

code = code.replace(oldBlobCheck, newBlobCheck);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
