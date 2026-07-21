const fs = require('fs');

const code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

let braces = 0;
let parens = 0;
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
    }
    if (braces < 0) {
        console.log(`Braces negative at line ${i+1}`);
        braces = 0;
    }
    if (parens < 0) {
        console.log(`Parens negative at line ${i+1}`);
        parens = 0;
    }
}
console.log(`Final braces: ${braces}, parens: ${parens}`);
