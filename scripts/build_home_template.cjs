// Self-contained Web Template, using the established page design and shared read helpers.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'Petty Cash Home.html');
const source = fs.readFileSync(target, 'utf8');
const css = ['pettycash-ui.css', 'pettycash-home.css'].map(file => fs.readFileSync(path.join(root, file), 'utf8').trim()).join('\n');
const script = fs.readFileSync(path.join(root, 'pettycash-home.js'), 'utf8').trim();
if (/<\/script|\{%|\{\{/i.test(script)) throw new Error('Home script is not safe for a Web Template');
for (const marker of ['PC HOME STYLES', 'PC HOME SCRIPT']) if (!source.includes('<!-- ' + marker + ' -->')) throw new Error('Missing Home marker');
const generated = source.replace(/<!-- PC HOME STYLES -->[\s\S]*?<!-- \/PC HOME STYLES -->/, () =>
  '<!-- PC HOME STYLES -->\n<style data-pc-home="v1">\n' + css + '\n</style>\n<!-- /PC HOME STYLES -->')
  .replace(/<!-- PC HOME SCRIPT -->[\s\S]*?<!-- \/PC HOME SCRIPT -->/, () =>
    '<!-- PC HOME SCRIPT -->\n<script>\n' + script + '\n</script>\n<!-- /PC HOME SCRIPT -->');
if (process.argv.includes('--check')) {
  if (source.replace(/\r\n/g, '\n') !== generated.replace(/\r\n/g, '\n')) throw new Error('Home template needs rebuilding');
} else fs.writeFileSync(target, generated, 'utf8');
