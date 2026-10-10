const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldTracker = `  // Reading Time Tracker
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const interval = setInterval(async () => {
      // Add 1 minute every 60 seconds
      let stats = await localforage.getItem<any>('quiet_reading_stats') || { streak: 1, activeDays: [new Date().getDay()] };
      stats[todayStr] = (stats[todayStr] || 0) + 1;
      
      // Update active days
      const currentDayIndex = new Date().getDay();
      if (!stats.activeDays.includes(currentDayIndex)) {
        stats.activeDays.push(currentDayIndex);
        // Simple streak logic (if they didn't read yesterday, technically it breaks, but for now we just increment active days)
      }
      
      await localforage.setItem('quiet_reading_stats', stats);
    }, 60000);

    return () => clearInterval(interval);
  }, []);`;

const newTracker = `  // Reading Time Tracker
  useEffect(() => {
    const todayStr = new Date().toDateString();
    
    // Helper to log a minute
    const logMinute = async () => {
      let stats = await localforage.getItem<any>('quiet_reading_stats') || { streak: 1, activeDays: [new Date().getDay()] };
      stats[todayStr] = (stats[todayStr] || 0) + 1;
      
      const currentDayIndex = new Date().getDay();
      if (!stats.activeDays.includes(currentDayIndex)) {
        stats.activeDays.push(currentDayIndex);
      }
      
      await localforage.setItem('quiet_reading_stats', stats);
    };

    // Log 1 minute immediately when they open the reader so they get instant feedback
    logMinute();

    // Then log 1 minute every 60 seconds they stay
    const interval = setInterval(logMinute, 60000);

    return () => clearInterval(interval);
  }, []);`;

code = code.replace(oldTracker, newTracker);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
