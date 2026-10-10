const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Update readingStats state to hold raw history
code = code.replace(
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[] });",
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[], history: {} as Record<string, number> });"
);

// Update initialization to pass full stats object
code = code.replace(
  "activeDays: stats.activeDays || [new Date().getDay()]",
  "activeDays: stats.activeDays || [new Date().getDay()],\n          history: stats"
);
code = code.replace(
  "setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()] });",
  "setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} });"
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched readingStats state');
