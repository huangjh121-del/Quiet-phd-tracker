const fs = require('fs');
let code = fs.readFileSync('src/app/review/learn/page.tsx', 'utf8');

code = code.replace(
  "import { ArrowLeft, Loader2, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';",
  "import { ArrowLeft, Loader2, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';\nimport { useSearchParams } from 'next/navigation';"
);

code = code.replace(
  "export default function LearnSession() {",
  "export default function LearnSession() {\n  const searchParams = useSearchParams();\n  const type = searchParams.get('type') || 'word';"
);

// Fix fetch URL
code = code.replace(
  "fetch('/api/library-items?type=word&t=' + Date.now())",
  "fetch(`/api/library-items?type=${type}&t=` + Date.now())"
);

// Fix filter condition: phrase uses `repetitions`, word uses `repetition`
code = code.replace(
  "setItems(data.items.filter((i: any) => i.repetition === 0));",
  "setItems(data.items.filter((i: any) => type === 'phrase' ? i.repetitions === 0 : i.repetition === 0));"
);

// Fix POST payload
code = code.replace(
  "type: 'word',",
  "type,"
);

// Update wording based on type
code = code.replace(
  "All Caught Up!",
  "{type === 'phrase' ? 'All Caught Up!' : 'All Caught Up!'}"
);

code = code.replace(
  "You have learned all your new words. They will appear in your review queue starting tomorrow.",
  "{type === 'phrase' ? 'You have learned all your new expressions. They will appear in your review queue starting tomorrow.' : 'You have learned all your new words. They will appear in your review queue starting tomorrow.'}"
);

code = code.replace(
  />Back to Vocabulary<\/a>/g,
  ">{type === 'phrase' ? 'Back to Expressions' : 'Back to Vocabulary'}</a>"
);

// Link back URL
code = code.replace(
  /href="\/review\/words"/g,
  "href={type === 'phrase' ? '/review/phrases' : '/review/words'}"
);

// Title
code = code.replace(
  '<h1 className="font-serif font-bold text-lg text-[#111827]">Learning New Words</h1>',
  '<h1 className="font-serif font-bold text-lg text-[#111827]">{type === \'phrase\' ? \'Learning New Expressions\' : \'Learning New Words\'}</h1>'
);

// Display word/phrase
code = code.replace(
  '<h2 className="text-5xl font-serif font-bold text-[#111827] capitalize">{currentItem.word}</h2>',
  '<h2 className="text-5xl font-serif font-bold text-[#111827] capitalize">{type === \'phrase\' ? currentItem.phrase : currentItem.word}</h2>'
);

// The dictionary HTML container: phrases don't have html_definition, but they have context and source_title
// Wait, if it's a phrase, what should be in the learning card?
// The user wants: "点进去之后的页面排版，以及学习和复习这两栏做和生词一模一样的排版、调整和修改"
// In `phrases/page.tsx` right now, they only show: `phrase` and `context` and `source_title`. They don't have a dictionary definition.
// So for phrases, we should show the context prominently, and maybe a placeholder or empty dict section, or just hide the dict section.

const dictSection = `<div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-4">Dictionary Definition</h4>
              <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentItem.html_definition }} />
            </div>`;

const newDictSection = `{type === 'word' && (<div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-4">Dictionary Definition</h4>
              <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentItem.html_definition }} />
            </div>)}
            {type === 'phrase' && (<div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-4">Source</h4>
              <div className="text-sm font-bold text-[#111827]">{currentItem.source_title || 'Unknown Source'}</div>
            </div>)}`;

code = code.replace(dictSection, newDictSection);

// Make sure component uses Suspense? `useSearchParams` needs Suspense boundary, but in Next.js it can just be used. Wait, Next.js warns if `useSearchParams` is used without Suspense.
// I will wrap it in a Suspense component later if Next.js complains.

fs.writeFileSync('src/app/review/learn/page.tsx', code);
console.log('Generalized learn page');
