const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldTracker = `<div className="flex items-center gap-4">
                {['M','T','W','T','F','S','S'].map((day, i) => {
                  const dayMap = [1, 2, 3, 4, 5, 6, 0]; // Monday = 1, Sunday = 0
                  const isRead = readingStats.activeDays.includes(dayMap[i]);
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={\`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all \${isRead ? 'bg-[#3D5A80] border-[#3D5A80] text-white shadow-md' : 'bg-transparent border-[#E5E5E5] text-transparent'}\`}>
                        {isRead && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <span className="text-[11px] font-bold text-[#9CA3AF]">{day}</span>
                    </div>
                  );
                })}
              </div>`;

const newTracker = `{(() => {
                const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                const last30Days = Array.from({ length: 30 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - i));
                  return d.toDateString();
                });
                return (
                  <div className="flex items-center justify-end gap-1.5 flex-wrap flex-1 ml-4">
                    {last30Days.map((dateStr, i) => {
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

code = code.replace(oldTracker, newTracker);
code = code.replace(
  '<span className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF]">Daily Reading Habit</span>',
  '<span className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF] hidden md:block">30-Day Habit</span>'
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched habit tracker');
