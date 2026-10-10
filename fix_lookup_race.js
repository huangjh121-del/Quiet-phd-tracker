const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const oldFetchResult = `      if (data.html) {
        setActivePopup({
          word: cleanWord,
          html: data.html,
          x: clientX,
          y: clientY + 15,
          isLoading: false
        });
      } else {
        setActivePopup(null);
      }
    } catch (err) {
      console.error(err);
      setActivePopup(null);
    }`;

const newFetchResult = `      if (data.html) {
        setActivePopup(prev => prev?.word === cleanWord ? {
          word: cleanWord,
          html: data.html,
          x: clientX,
          y: clientY + 15,
          isLoading: false
        } : prev);
      } else {
        setActivePopup(prev => prev?.word === cleanWord ? null : prev);
      }
    } catch (err) {
      console.error(err);
      setActivePopup(prev => prev?.word === cleanWord ? null : prev);
    }`;

code = code.replace(oldFetchResult, newFetchResult);
fs.writeFileSync('src/app/reader/page.tsx', code);
