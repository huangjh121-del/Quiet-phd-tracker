const fs = require('fs');
let code = fs.readFileSync('src/app/sentences/page.tsx', 'utf8');

if (!code.includes('Trash2')) {
  code = code.replace('Quote, BookOpen } from \'lucide-react\';', 'Quote, BookOpen, Trash2 } from \'lucide-react\';');
}

const deleteFunc = `
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return;
    try {
      await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sentence', id })
      });
      setSentences(sentences.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };
`;

code = code.replace('return (', deleteFunc + '\n  return (');

const badgeHTML = `<div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">
                    <BookOpen className="w-3.5 h-3.5" /> <span>{s.source_title}</span>
                  </div>`;
const newBadgeHTML = `<div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                      <BookOpen className="w-3.5 h-3.5" /> <span>{s.source_title}</span>
                    </div>
                    <button onClick={() => handleDelete(s.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>`;
code = code.replace(badgeHTML, newBadgeHTML);

fs.writeFileSync('src/app/sentences/page.tsx', code);
console.log('Patched sentences page with delete');
