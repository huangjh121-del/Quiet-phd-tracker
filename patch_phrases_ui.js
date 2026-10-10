const fs = require('fs');
let code = fs.readFileSync('src/app/review/phrases/page.tsx', 'utf8');

// Ensure Trash2 is imported
if (!code.includes('Trash2')) {
  code = code.replace('Flame, BookOpen } from \'lucide-react\';', 'Flame, BookOpen, Trash2 } from \'lucide-react\';');
}

// Add delete function
const deleteFunc = `
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phrase?')) return;
    try {
      await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phrase', id })
      });
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };
`;
code = code.replace('const now = Date.now();', deleteFunc + '\n  const now = Date.now();');

// Add trash button to UI
const badgeHTML = `                        )}
                      </div>`;
const newBadgeHTML = `                        )}
                        <button onClick={() => handleDelete(item.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>`;
code = code.replace(badgeHTML, newBadgeHTML);

fs.writeFileSync('src/app/review/phrases/page.tsx', code);
console.log('Patched phrases page with delete');
