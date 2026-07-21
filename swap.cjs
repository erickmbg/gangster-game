const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const lines = content.split('\n');

const ruaStartStr = `<div className="bg-[#121216] border border-zinc-800/80 rounded-[2rem] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative select-none">`;
const ruaEndStr = `</AnimatePresence>`;

const statStartStr = `{/* CORE STAT DETAILS ROW */}`;
const statEndStr = `</div>`; // matching the end of CORE STAT DETAILS ROW

// Let's find exactly
let idx1 = -1;
let idx2 = -1;
let idx3 = -1;
let idx4 = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(ruaStartStr)) { idx1 = i; break; }
}
for (let i = idx1; i < lines.length; i++) {
  if (lines[i].includes(ruaEndStr)) { idx2 = i; break; }
}

for (let i = idx2; i < lines.length; i++) {
  if (lines[i].includes(statStartStr)) { idx3 = i - 1; break; } // including the blank line
}
// Find the end by looking for line 1060
// Or simply find `<>` that wraps both
for (let i = idx3 + 1; i < lines.length; i++) {
  if (lines[i] === ('    </>')) { idx4 = i - 1; break; }
}


if (idx1 > -1 && idx2 > -1 && idx3 > -1 && idx4 > -1) {
    const blockRua = lines.slice(idx1, idx2 + 1);
    const blockStat = lines.slice(idx3, idx4 + 1);

    const newLines = [
        ...lines.slice(0, idx1),
        ...blockStat,
        '',
        ...blockRua,
        ...lines.slice(idx4 + 1)
    ];

    fs.writeFileSync('src/components/Dashboard.tsx', newLines.join('\n'));
    console.log("Success");
} else {
    console.log("FAILED to find indices", idx1, idx2, idx3, idx4);
}
