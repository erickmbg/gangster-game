const fs = require('fs');

const code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

let openDivs = 0;
const lines = code.split('\n');
for (let i = 475; i <= 1062; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    openDivs += opens - closes;
    if (openDivs < 0) {
        console.log("Mismatch around line", i, line);
        break;
    }
}
console.log("Final open divs:", openDivs);
