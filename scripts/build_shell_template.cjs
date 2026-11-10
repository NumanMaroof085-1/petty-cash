// Embed shell assets in the existing Header Web Template. No JS/CSS Web Files required.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'shared/shell/Header.html'), source = fs.readFileSync(target, 'utf8');
const css = fs.readFileSync(path.join(root, 'shared/shell/pettycash-shell.css'), 'utf8').trim();
const script = fs.readFileSync(path.join(root, 'shared/shell/pettycash-shell.js'), 'utf8').trim();
if (/<\/script|\{%|\{\{/i.test(script)) throw new Error('Shell script is not safe for a Web Template');
for (const marker of ['PC SHELL STYLES', 'PC SHELL SCRIPT']) if (!source.includes('<!-- ' + marker + ' -->')) throw new Error('Missing shell marker');
const generated = source.replace(/<!-- PC SHELL STYLES -->[\s\S]*?<!-- \/PC SHELL STYLES -->/, () =>
  '<!-- PC SHELL STYLES -->\n<style data-pc-shell="v1">\n' + css + '\n</style>\n<!-- /PC SHELL STYLES -->')
  .replace(/<!-- PC SHELL SCRIPT -->[\s\S]*?<!-- \/PC SHELL SCRIPT -->/, () =>
    '<!-- PC SHELL SCRIPT -->\n<script>\n' + script + '\n</script>\n<!-- /PC SHELL SCRIPT -->');
if (process.argv.includes('--check')) {
  if (source.replace(/\r\n/g, '\n') !== generated.replace(/\r\n/g, '\n')) throw new Error('Header needs rebuilding');
} else fs.writeFileSync(target, generated, 'utf8');
