const fs = require('fs');

const code = fs.readFileSync('/src/components/Dashboard.tsx', 'utf8');

// Simple regex scanner for JSX tags
const tagRegex = /<\/?[A-Za-z0-9_:\-.]+(?:\s+[A-Za-z5-9_:\-.]+(?:\s*=\s*(?:'[^']*'|"[^"]*"|{[\s\S]*?}))?)*\s*\/?>/g;

// Since regex is hard for complex JSX, let's parse line-by-line or track key JSX tags
// Better yet, let's parse tags, keeping track of opens and closes.
let lineNum = 1;
const stack = [];
let insideComment = false;

// We can look at how standard tag scanner works.
const lines = code.split('\n');
lines.forEach((line, idx) => {
  const currentLine = idx + 1;
  
  // Clean line of strings, comments and regex to avoid false matches
  let cleanLine = line.replace(/\{?(\/\*[\s\S]*?\*\/|\/\/.*)\}/g, ''); // React comments
  cleanLine = cleanLine.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""'); // Double quoted strings
  cleanLine = cleanLine.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''"); // Single quoted strings
  cleanLine = cleanLine.replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, "``"); // Template literals

  // Find tags
  const matches = cleanLine.match(/<[A-Za-z0-9_.:\-]+|<\/:[A-Za-z0-9_.:\-]+|<\/[A-Za-z0-9_.:\-]+|<>|<\/>/g);
  if (matches) {
    matches.forEach(m => {
      // Check for self closing tags or specific ones
      if (m.startsWith('</')) {
        const tagName = m.substring(2);
        if (stack.length === 0) {
          console.log(`Error: found close tag ${tagName} at line ${currentLine} but stack is empty`);
        } else {
          const last = stack.pop();
          if (last.tag === '<>' && m === '</>') {
            // matches
          } else if (last.tag.substring(1) !== tagName) {
            // If we have standard div mismatch or others, report it
            if (tagName === 'div' || tagName === 'button' || tagName === 'g' || tagName === 'svg') {
              console.log(`Mismatch: found close tag ${tagName} at line ${currentLine} matching ${last.tag} from line ${last.line}`);
            }
          }
        }
      } else if (m.endsWith('/>')) {
        // self closing
      } else {
        // excluding some self-closing like <br>, <img>, <hr>, <input> if outside of JSX, but in TSX all must be closed anyway.
        // Let's filter common HTML tags that might be self-closing but we assume properly formatted.
        // In react, tags like <hr>, <br>, <input>, <img>, <rect>, <line>, <circle>, <ellipse>, <path>, <use> can be self-closing.
        // Let's check if the raw tag in the original line ends with '/>'
        const tagIndex = line.indexOf(m);
        const rest = line.substring(tagIndex);
        const selfClosing = rest.match(/^<[A-Za-z0-9_.:\-]+[^>]*\/>/);
        
        if (!selfClosing) {
          stack.push({ tag: m, line: currentLine });
        }
      }
    });
  }
});

console.log('Unclosed tags remaining on stack:');
stack.forEach(s => {
  console.log(`- ${s.tag} opened on line ${s.line}`);
});
