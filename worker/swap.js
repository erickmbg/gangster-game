const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const lines = content.split('\n');
const startMinhaRua = 475; // The line `         <div className="bg-[#121216] border border-zinc-800/80 rounded-[2rem] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative select-none">`
const endMinhaRua = 711; // `  </AnimatePresence>`
const startBossDossier = 712; // `      {/* CORE STAT DETAILS ROW */}`
const endBossDossier = 1060; // `    </div>`
const tagAfter = 1061; // `    </>`

const arr = [...lines];

const blockRua = arr.slice(startMinhaRua, endMinhaRua + 1);
const blockDossier = arr.slice(startBossDossier, endBossDossier + 1);

// Swap it
// we want: <> then blockDossier then blockRua then </> 

const newLines = [
  ...arr.slice(0, startMinhaRua),
  ...blockDossier,
  ...blockRua,
  ...arr.slice(endBossDossier + 1)
];

fs.writeFileSync('src/components/Dashboard.tsx', newLines.join('\n'));
console.log('Swapped properly!');
