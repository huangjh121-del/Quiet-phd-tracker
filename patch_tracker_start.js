const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldArrayLogic = `const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                const last30Days = Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  return d.toDateString();
                });`;

const newArrayLogic = `const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                
                // Determine the starting point for the 30-day view
                const historyKeys = Object.keys(readingStats.history || {}).filter(k => readingStats.history[k] > 0);
                const today = new Date();
                today.setHours(0,0,0,0);
                
                let startDate = new Date(today);
                
                if (historyKeys.length > 0) {
                  const timestamps = historyKeys.map(d => new Date(d).getTime());
                  const firstActiveDay = new Date(Math.min(...timestamps));
                  firstActiveDay.setHours(0,0,0,0);
                  
                  const diffDays = Math.floor((today.getTime() - firstActiveDay.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 30) {
                     // Still in their first 30 days! Start the grid on their very first day.
                     startDate = firstActiveDay;
                  } else {
                     // Over 30 days old, use a sliding 30-day window ending today
                     startDate.setDate(startDate.getDate() - 29);
                  }
                }
                
                const displayDays = Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date(startDate);
                  d.setDate(d.getDate() + i);
                  return d.toDateString();
                });`;

code = code.replace(oldArrayLogic, newArrayLogic);

// Replace mapping array name
code = code.replace(
  "{last30Days.map((dateStr, i) => {",
  "{displayDays.map((dateStr, i) => {"
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched tracker start logic');
