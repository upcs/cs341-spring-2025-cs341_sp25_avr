// Author: Chengen Li


const fs = require('fs');
const html = fs.readFileSync('geo.html', 'utf8');
document.body.innerHTML = html;



