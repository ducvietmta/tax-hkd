const fs = require('fs');
const b64 = fs.readFileSync('public/favicon-128.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <image href="data:image/png;base64,${b64}" width="128" height="128" />
</svg>
`;
fs.writeFileSync('public/favicon.svg', svg);
console.log('Successfully updated public/favicon.svg');
