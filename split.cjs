const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = 830; 
const endIndex = 1067; 

const block = lines.slice(startIndex, 1065);
const blockString = `{subTab === "rua" && (\n` + block.join('\n') + `\n)}\n`;

const newLines = [
  ...lines.slice(0, 830),
  '    </div>',
  ')}',
  '',
  blockString,
  '',
  ...lines.slice(1068)
];

fs.writeFileSync('src/components/Dashboard.tsx', newLines.join('\n'));
