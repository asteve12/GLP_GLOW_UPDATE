import fs from 'fs';
const content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');
let inTemplate = false;
let inComment = false;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // This is hard because of comments, etc.
    // But let's check for single line mismatch first.
    const quotes = (line.match(/\"/g) || []).length;
    if (quotes % 2 !== 0) {
        console.log('Odd DQ on line', i + 1, ':', line.trim());
    }
}
