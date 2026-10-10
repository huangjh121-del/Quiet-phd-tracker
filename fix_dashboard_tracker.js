const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix Today's Reading static 45
code = code.replace('<span className="text-xl font-serif font-bold text-[#111827]">45</span>', '<span className="text-xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>');

// 1b. Fix SVG Arc strokeDasharray
code = code.replace('strokeDasharray="65, 100"', 'strokeDasharray={`${Math.min((readingStats.todayMins / 120) * 100, 100)}, 100`}');

// 2. Remove old consistency tracker from header
const oldConsistencyStart = '{/* Consistency Tracker */}';
const oldConsistencyEnd = '</div>\n          </div>\n        </header>';
const startOld = code.indexOf(oldConsistencyStart);
if (startOld !== -1) {
  const endOld = code.indexOf(oldConsistencyEnd, startOld);
  if (endOld !== -1) {
    code = code.substring(0, startOld) + '          </div>\n        </header>' + code.substring(endOld + oldConsistencyEnd.length);
  }
}

// 3. Add new long Consistency Tracker under the shelves
const shelvesEnd = 'Articles\n                </span>\n              </Link>\n            </section>';
const startShelvesEnd = code.indexOf(shelvesEnd);
if (startShelvesEnd !== -1) {
  const newConsistencyBar = `Articles
                </span>
              </Link>
            </section>

            {/* Wide Consistency Tracker */}
            <section className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm flex items-center justify-between mt-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#E07A5F]/10 px-3 py-1.5 rounded-xl">
                  <Flame className="w-5 h-5 text-[#E07A5F]" />
                  <span className="text-sm font-bold text-[#E07A5F] tracking-wide">{readingStats.streak} Day Streak</span>
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF]">Daily Reading Habit</span>
              </div>
              <div className="flex items-center gap-4">
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
              </div>
            </section>`;
            
  code = code.replace(shelvesEnd, newConsistencyBar);
} else {
  console.log("Could not find shelves end string.");
}

fs.writeFileSync('src/app/page.tsx', code);
console.log("Done");
