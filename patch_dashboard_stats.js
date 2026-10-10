const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add stats state
const stateMatch = /const \[isExtracting, setIsExtracting\] = useState\(false\);/;
const newState = `const [isExtracting, setIsExtracting] = useState(false);
  const [libStats, setLibStats] = useState({ words: 0, phrases: 0, sentences: 0, dueWords: 0, duePhrases: 0 });
  const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[] });`;
code = code.replace(stateMatch, newState);

// Add useEffect to fetch stats
const effectMatch = /useEffect\(\(\) => \{\n    loadLibrary\(\);\n  \}, \[\]\);/;
const newEffect = `useEffect(() => {
    loadLibrary();
    
    // Fetch D1 stats
    Promise.all([
      fetch('/api/library-items?type=word').then(r => r.json()),
      fetch('/api/library-items?type=phrase').then(r => r.json()),
      fetch('/api/sentences').then(r => r.json())
    ]).then(([wRes, pRes, sRes]) => {
      const words = wRes.items || [];
      const phrases = pRes.items || [];
      const sentences = sRes.sentences || [];
      const now = Date.now();
      setLibStats({
        words: words.length,
        phrases: phrases.length,
        sentences: sentences.length,
        dueWords: words.filter((w: any) => w.next_review_at <= now).length,
        duePhrases: phrases.filter((p: any) => p.next_review_at <= now).length
      });
    });

    // Fetch localforage stats
    localforage.getItem<any>('quiet_reading_stats').then(stats => {
      if (stats) {
        const todayStr = new Date().toDateString();
        setReadingStats({
          todayMins: stats[todayStr] || 0,
          streak: stats.streak || 1,
          activeDays: stats.activeDays || [new Date().getDay()]
        });
      } else {
        setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()] });
      }
    });

  }, []);`;
code = code.replace(effectMatch, newEffect);

// Replace hardcoded Review box
const reviewRegex = /<div className="text-center">\n                  <span className="block text-4xl font-bold font-serif text-\\[#111827\\]">12<\/span>\n                  <span className="text-\\[10px\\] font-bold uppercase tracking-widest text-\\[#6B7280\\]">Words<\/span>\n                <\/div>\n                <div className="text-center">\n                  <span className="block text-4xl font-bold font-serif text-\\[#111827\\]">0<\/span>\n                  <span className="text-\\[10px\\] font-bold uppercase tracking-widest text-\\[#6B7280\\]">Phrases<\/span>\n                <\/div>/;

const newReview = `<div className="text-center">
                  <span className="block text-4xl font-bold font-serif text-[#111827]">{libStats.words}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Words</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-bold font-serif text-[#111827]">{libStats.phrases}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Phrases</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-bold font-serif text-[#111827]">{libStats.sentences}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Sentences</span>
                </div>`;
code = code.replace(reviewRegex, newReview);

// Replace "Due for Review" title with "Knowledge Library"
code = code.replace('<h2 className="text-2xl font-serif font-semibold text-[#111827]">Due for Review</h2>', '<h2 className="text-2xl font-serif font-semibold text-[#111827]">Knowledge Library</h2>');

// Replace "Start SRS Review" button text to show due counts
code = code.replace('Start SRS Review <ChevronRight className="w-4 h-4" />', 'Go to Hub ({libStats.dueWords + libStats.duePhrases} Due) <ChevronRight className="w-4 h-4" />');

// Replace hardcoded Reading time
const timeRegex = /<span className="text-xl font-serif font-bold text-\\[#111827\\]">45<\/span>\n                  <span className="text-xs text-\\[#6B7280\\] font-medium">\/ 120 mins<\/span>/;
const newTime = `<span className="text-xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>
                  <span className="text-xs text-[#6B7280] font-medium">/ 120 mins</span>`;
code = code.replace(timeRegex, newTime);

// Replace hardcoded Streak
const streakRegex = /<span className="text-xs font-bold text-\\[#E07A5F\\]">12 Days<\/span>/;
code = code.replace(streakRegex, '<span className="text-xs font-bold text-[#E07A5F]">{readingStats.streak} Days</span>');

// Replace hardcoded streak in header
const headerStreakRegex = /<span className="font-semibold text-sm tracking-wide text-\\[#374151\\]">12-DAY STREAK<\/span>/;
code = code.replace(headerStreakRegex, '<span className="font-semibold text-sm tracking-wide text-[#374151]">{readingStats.streak}-DAY STREAK</span>');


// Replace activeDays rendering map
const activeDaysRegex = /\{daysOfWeek\.map\(\(day, i\) => \(\n[\s\S]*?\{activeDays\.includes\(i\) \? <CheckCircle2 className="w-4 h-4" \/> : null\}\n[\s\S]*?<\/div>\n[\s\S]*?<\/div>\n                \)\)\}/;

const newActiveDays = `{['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={\`w-6 h-6 rounded-full flex items-center justify-center \${readingStats.activeDays.includes(i) ? 'bg-[#5B8266] text-white' : 'bg-[#F3F4F6] text-[#D1D5DB]'}\`}>
                      {readingStats.activeDays.includes(i) ? <CheckCircle2 className="w-4 h-4" /> : null}
                    </div>
                    <span className="text-[9px] font-bold text-[#6B7280]">{day}</span>
                  </div>
                ))}`;
code = code.replace(activeDaysRegex, newActiveDays);

fs.writeFileSync('src/app/page.tsx', code);
