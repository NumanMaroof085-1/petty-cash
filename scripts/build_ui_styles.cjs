// Keep each Power Pages fragment self-contained. No new tenant asset or include.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'pettycash-ui.css'), 'utf8').trim();
const block = '<!-- PC UI styles: generated from pettycash-ui.css -->\n<style data-pc-ui="v1">\n' + css + '\n</style>\n<!-- /PC UI styles -->';
for (const file of ['New Petty Cash Request.html', 'My Petty Cash Requests.html', 'Finance Cash Management.html', 'Admin Users.html']) {
  const target = path.join(root, file), source = fs.readFileSync(target, 'utf8');
  const pattern = /<!-- PC UI styles: generated from pettycash-ui.css -->[\s\S]*?<!-- \/PC UI styles -->/;
  if (!pattern.test(source)) throw new Error('Missing UI style marker in ' + file);
  const generated = source.replace(pattern, () => block);
  if (process.argv.includes('--check')) {
    if (source.replace(/\r\n/g, '\n') !== generated.replace(/\r\n/g, '\n')) throw new Error('Styles need rebuilding in ' + file);
  } else fs.writeFileSync(target, generated, 'utf8');
}
