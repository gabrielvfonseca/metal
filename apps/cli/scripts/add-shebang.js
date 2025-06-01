const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist/index.js');
const shebang = '#!/usr/bin/env node\n';

const content = fs.readFileSync(distPath, 'utf8');
if (!content.startsWith(shebang)) {
  fs.writeFileSync(distPath, shebang + content);
}
