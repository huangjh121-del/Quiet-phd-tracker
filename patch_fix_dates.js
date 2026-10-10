const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add displayDays to state
code = code.replace(
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} as Record<string, number> });",
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} as Record<string, number> });\n  const [displayDays, setDisplayDays] = useState<string[]>([]);"
);

// Fallback if previous replacement failed because streak: 0 initially
code = code.replace(
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[], history: {} as Record<string, number> });",
  "const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[], history: {} as Record<string, number> });\n  const [displayDays, setDisplayDays] = useState<string[]>([]);"
);


// 2. Add the generation logic inside the useEffect where localforage gets quiet_reading_stats
const oldFetch = `    // Fetch localforage stats
    localforage.getItem<any>('quiet_reading_stats').then(stats => {
      if (stats) {
        const todayStr = new Date().toDateString();
        setReadingStats({
          todayMins: stats[todayStr] || 0,
          streak: stats.streak || 1,
          activeDays: stats.activeDays || [new Date().getDay()],
          history: stats
        });
      } else {
        setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} });
      }
    });`;

const newFetch = `    // Fetch localforage stats
    localforage.getItem<any>('quiet_reading_stats').then(stats => {
      let days = [];
      const now = new Date();
      now.setHours(0,0,0,0);
      let startDate = new Date(now);

      if (stats) {
        const todayStr = new Date().toDateString();
        setReadingStats({
          todayMins: stats[todayStr] || 0,
          streak: stats.streak || 1,
          activeDays: stats.activeDays || [new Date().getDay()],
          history: stats
        });

        // Filter out metadata keys to find actual dates
        const historyKeys = Object.keys(stats).filter(k => k !== 'streak' && k !== 'activeDays' && stats[k] > 0);
        if (historyKeys.length > 0) {
          const timestamps = historyKeys.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
          if (timestamps.length > 0) {
            const firstActiveDay = new Date(Math.min(...timestamps));
            firstActiveDay.setHours(0,0,0,0);
            
            const diffDays = Math.floor((now.getTime() - firstActiveDay.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 30 && diffDays >= 0) {
              startDate = firstActiveDay;
            } else {
              startDate.setDate(startDate.getDate() - 29);
            }
          }
        }
      } else {
        setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} });
      }
      
      for (let i = 0; i < 30; i++) {
         const d = new Date(startDate);
         d.setDate(d.getDate() + i);
         days.push(d.toDateString());
      }
      setDisplayDays(days);
    });`;
code = code.replace(oldFetch, newFetch);


// 3. Clean up the render logic to just use `displayDays`
const oldRender = `{(() => {
                const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                
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
                });
                return (
                  <div className="grid grid-cols-10 gap-1.5 md:gap-2 ml-auto shrink-0 py-1">
                    {displayDays.map((dateStr, i) => {
                      const isRead = readingStats.history && readingStats.history[dateStr] > 0;
                      const color = colors[i % colors.length];
                      return (
                        <div 
                          key={dateStr}
                          className={\`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all border shadow-sm\`}
                          style={{
                            backgroundColor: isRead ? color : 'transparent',
                            borderColor: isRead ? color : '#E5E5E5',
                            opacity: isRead ? 1 : 0.5
                          }}
                          title={dateStr}
                        />
                      );
                    })}
                  </div>
                );
              })()}`;

const newRender = `{(() => {
                const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                // If not mounted/calculated yet, render empty placeholders to avoid layout shift
                const days = displayDays.length > 0 ? displayDays : Array.from({ length: 30 }).map((_, i) => 'placeholder-' + i);
                return (
                  <div className="grid grid-cols-10 gap-1.5 md:gap-2 ml-auto shrink-0 py-1">
                    {days.map((dateStr, i) => {
                      const isPlaceholder = dateStr.startsWith('placeholder-');
                      const isRead = !isPlaceholder && readingStats.history && readingStats.history[dateStr] > 0;
                      const color = colors[i % colors.length];
                      return (
                        <div 
                          key={dateStr}
                          className={\`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all border shadow-sm\`}
                          style={{
                            backgroundColor: isRead ? color : 'transparent',
                            borderColor: isRead ? color : '#E5E5E5',
                            opacity: isRead ? 1 : 0.5
                          }}
                          title={!isPlaceholder ? dateStr : undefined}
                        />
                      );
                    })}
                  </div>
                );
              })()}`;

code = code.replace(oldRender, newRender);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched tracker SSR and Nan error');
