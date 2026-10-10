const fs = require('fs');
let code = fs.readFileSync('src/app/sentences/page.tsx', 'utf8');

if (!code.includes('import localforage')) {
  code = code.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport localforage from 'localforage';");
}

code = code.replace(
  "const [isLoading, setIsLoading] = useState(true);",
  "const [isLoading, setIsLoading] = useState(true);\n  const [library, setLibrary] = useState<any[]>([]);"
);

const oldUseEffect = `  useEffect(() => {
    fetch('/api/sentences')
      .then(res => res.json())
      .then(data => {
        if (data.sentences) setSentences(data.sentences);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sentences", err);
        setIsLoading(false);
      });
  }, []);`;

const newUseEffect = `  useEffect(() => {
    fetch('/api/sentences?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.sentences) setSentences(data.sentences);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sentences", err);
        setIsLoading(false);
      });
      
    localforage.getItem<any[]>('quiet_library').then(lib => {
      if (lib) setLibrary(lib);
    });
  }, []);`;
  
code = code.replace(oldUseEffect, newUseEffect);

const oldList = `<div className="space-y-12">
            {sentences.map((item, idx) => (
              <div key={item.id} className="group flex flex-col items-center text-center relative px-8 py-4">
                <Quote className="absolute top-0 left-0 w-8 h-8 text-[#E07A5F]/10 transform -translate-x-4 -translate-y-4" />
                <p className="text-xl md:text-2xl font-serif text-[#374151] leading-relaxed mb-6">
                  {item.sentence}
                </p>
                <div className="flex items-center gap-2 text-[#9CA3AF] text-sm uppercase tracking-widest font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>{item.source_title || 'Unknown Source'}</span>
                </div>
                {idx !== sentences.length - 1 && (
                  <div className="w-12 h-px bg-[#E5E5E5] mt-12"></div>
                )}
              </div>
            ))}
          </div>`;
          
const newList = `<div className="flex flex-col gap-3">
            {sentences.map((item) => {
              const book = library.find(b => b.title === item.source_title);
              const href = book ? \`/reader?id=\${book.id}\` : '#';
              return (
                <div key={item.id} className="group flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-[#E5E5E5] hover:shadow-md transition-all">
                  <Link href={href} className="flex-1 pr-6 cursor-pointer block">
                    <p className="font-serif text-lg text-[#111827] leading-relaxed group-hover:text-[#3D5A80] transition-colors">
                      {item.sentence}
                    </p>
                  </Link>
                  <div className="shrink-0 flex items-center">
                    <button onClick={() => handleDelete(item.id)} className="text-[#D1D5DB] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>`;
          
code = code.replace(oldList, newList);

fs.writeFileSync('src/app/sentences/page.tsx', code);
console.log('Patched sentences page layout');
