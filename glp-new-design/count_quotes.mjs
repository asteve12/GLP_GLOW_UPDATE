import fs from 'fs';
const content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf-8');
const dq = (content.match(/\"/g) || []).length;
const sq = (content.match(/\'/g) || []).length;
const bq = (content.match(/\`/g) || []).length;
console.log('DQ:', dq);
console.log('SQ:', sq);
console.log('BQ:', bq);
