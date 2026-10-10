const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const trackerEffect = `
  // Reading Time Tracker
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
  }, []);
`;

// Inject into ReaderClient
code = code.replace("const handleSelection = useCallback(() => {", trackerEffect + "\n  const handleSelection = useCallback(() => {");
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
