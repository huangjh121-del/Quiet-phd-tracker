const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

// Ensure Trash2 is imported
if (!code.includes('Trash2')) {
  code = code.replace('Flame } from \'lucide-react\';', 'Flame, Trash2 } from \'lucide-react\';');
}

// Add delete function
const deleteFunc = `
  const handleDelete = async (word: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'word', id: word })
      });
      setItems(items.filter(i => i.word !== word));
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
                        <button onClick={() => handleDelete(item.word)} className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>`;
code = code.replace(badgeHTML, newBadgeHTML);

fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log('Patched words page with delete');
