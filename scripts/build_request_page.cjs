// Mirror the canonical request script without altering its page layout/configuration.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'New Petty Cash Request.html');
const source = fs.readFileSync(target, 'utf8'), script = fs.readFileSync(path.join(root, 'pettycash-api.js'), 'utf8').trim();
if ((source.match(/<script>/g) || []).length !== 1 || !/<script>[\s\S]*?<\/script>\s*$/.test(source)) throw new Error('Review request page script layout before rebuilding.');
if (/<\/script|\{%|\{\{/i.test(script)) throw new Error('Request script is not safe for inline publication.');
const generated = source.replace(/<script>[\s\S]*?<\/script>\s*$/, () => '<script>\n' + script + '\n</script>\n');
if (process.argv.includes('--check')) {
  if (source.replace(/\r\n/g, '\n') !== generated.replace(/\r\n/g, '\n')) throw new Error('Request inline script needs rebuilding.');
} else fs.writeFileSync(target, generated, 'utf8');
