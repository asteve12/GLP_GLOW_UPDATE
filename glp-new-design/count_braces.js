const fs = require('fs');
const content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf-8');
console.log('CBRACE_OPEN:', content.split('{').length - 1);
console.log('CBRACE_CLOSE:', content.split('}').length - 1);
console.log('PAREN_OPEN:', content.split('(').length - 1);
console.log('PAREN_CLOSE:', content.split(')').length - 1);
console.log('TAG_OPEN:', content.split('<').length - 1);
console.log('TAG_CLOSE:', content.split('>').length - 1);
