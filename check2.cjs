const fs = require('fs');

const code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = code.split('\n');

let openTags = [];

const matchTag = /<\/?([a-zA-Z0-9_.]+)[^>]*>/g;

for (let i = 474; i <= 1060; i++) {
    const line = lines[i];
    
    // Ignore comments
    let normalizedLine = line.replace(/\{\/\*.*?\*\/\}/g, '');
    
    let match;
    while ((match = matchTag.exec(normalizedLine)) !== null) {
        if (match[0].endsWith('/>')) continue; 
        if (match[1] === '') {
             // <> or </>
             if (match[0].startsWith('</')) openTags.pop();
             else openTags.push('Fragment');
             continue;
        }
        if (match[0].startsWith('</')) {
            const popped = openTags.pop();
            if (popped !== match[1]) {
                 console.log(`[Line ${i+1}] Tag mismatch: Expected </${popped}>, got ${match[0]}`);
            }
        } else {
            openTags.push(match[1]);
        }
    }
}
console.log("Open Tags at 1060:", openTags.join(', '));
