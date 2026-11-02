// LIMITED LOCAL QA RENDERER, not a Power Pages runtime or cache/authorization engine.
// Renders the subset used by the supplied templates against synthetic context.
// Unknown tags/filters throw so fixtures cannot silently ignore template branches.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const truth = value => value !== undefined && value !== null && value !== false;
const split = (source, delimiter) => source.match(/'(?:[^']*)'|"(?:[^"]*)"|[^'"|,]+|[|,]/g)?.reduce((groups, token) => {
  if (token === delimiter) groups.push(''); else groups[groups.length - 1] += token;
  return groups;
}, ['']) || [''];
function value(source, scope) {
  const parts = split(source, '|');
  const expr = parts.shift().trim();
  let result;
  if (/^(['"])[\s\S]*\1$/.test(expr)) result = expr.slice(1, -1);
  else if (expr === 'true' || expr === 'false') result = expr === 'true';
  else if (expr === 'null' || expr === 'nil') result = null;
  else if (/^-?\d+(?:\.\d+)?$/.test(expr)) result = Number(expr);
  else {
    const path = expr.replace(/\[([^\]]+)\]/g, (_, key) => '.' + value(key, scope)).split('.');
    result = scope[path.shift()];
    for (const key of path) result = result == null ? undefined : key === 'size' ? result.length :
      key === 'first' ? result[0] : result[key];
  }
  for (const source of parts) {
    const index = source.indexOf(':'), filter = (index < 0 ? source : source.slice(0, index)).trim();
    const args = index < 0 ? [] : split(source.slice(index + 1), ',').map(arg => value(arg, scope));
    if (filter === 'escape' || filter === 'h') result = escape(result);
    else if (filter === 'default') { if (!truth(result) || result === '' || Array.isArray(result) && !result.length) result = args[0]; }
    else if (filter === 'boolean') result = result === true || result === 'true';
    else if (filter === 'downcase') result = String(result ?? '').toLowerCase();
    else if (filter === 'upcase') result = String(result ?? '').toUpperCase();
    else if (filter === 'slice') result = String(result ?? '').slice(args[0], args[0] + args[1]);
    else if (filter === 'split') result = String(result ?? '').split(args[0]);
    else if (filter === 'join') result = (result || []).join(args[0] || '');
    else throw new Error('Unsupported fixture filter: ' + filter);
  }
  return result;
}
function condition(source, scope) {
  // The known template conditions have no quoted " or " / " and " substrings.
  if (source.includes(' or ')) return source.split(' or ').some(part => condition(part, scope));
  if (source.includes(' and ')) return source.split(' and ').every(part => condition(part, scope));
  const comparison = source.match(/^(.+?)\s+(contains|==|!=|>|<)\s+(.+)$/);
  if (!comparison) return truth(value(source, scope));
  const left = value(comparison[1], scope), right = value(comparison[3], scope);
  return ({ contains: () => left != null && typeof left.includes === 'function' && left.includes(right),
    '==': () => left == right, '!=': () => left != right, '>': () => left > right, '<': () => left < right })[comparison[2]]();
}
function parse(source) {
  const tokens = source.split(/({%-?[\s\S]*?-?%}|{{-?[\s\S]*?-?}})/).filter(Boolean);
  let index = 0;
  const tag = token => token.startsWith('{%') ? token.slice(2, -2).replace(/^-|-$/g, '').trim() : '';
  function block(stops = []) {
    const nodes = [];
    while (index < tokens.length) {
      const token = tokens[index], code = tag(token), name = code.split(/\s/)[0];
      if (stops.includes(name)) break;
      index++;
      if (token.startsWith('{{')) nodes.push({ type: 'output', source: token.slice(2, -2).replace(/^-|-$/g, '').trim() });
      else if (!code) nodes.push({ type: 'text', source: token });
      else if (name === 'if' || name === 'unless') {
        const branches = [{ source: code.slice(name.length).trim(), body: block(['elsif', 'else', 'endif', 'endunless']) }];
        while (tag(tokens[index] || '').startsWith('elsif ')) {
          const source = tag(tokens[index++]).slice(6); branches.push({ source, body: block(['elsif', 'else', 'endif', 'endunless']) });
        }
        let otherwise = [];
        if (tag(tokens[index] || '') === 'else') { index++; otherwise = block(['endif', 'endunless']); }
        if (tag(tokens[index++] || '') !== 'end' + name) throw new Error('Unclosed fixture ' + name);
        nodes.push({ type: name, branches, otherwise });
      } else if (name === 'for') {
        const match = code.match(/^for (\w+) in (.+)$/); if (!match) throw new Error('Unknown for syntax');
        const body = block(['endfor']); if (tag(tokens[index++] || '') !== 'endfor') throw new Error('Unclosed for');
        nodes.push({ type: name, variable: match[1], source: match[2], body });
      } else if (name === 'case') {
        const expr = code.slice(5), branches = []; block(['when', 'endcase']);
        while (tag(tokens[index] || '').startsWith('when ')) {
          const source = tag(tokens[index++]).slice(5); branches.push({ source, body: block(['when', 'endcase']) });
        }
        if (tag(tokens[index++] || '') !== 'endcase') throw new Error('Unclosed case');
        nodes.push({ type: name, source: expr, branches });
      } else if (name === 'substitution') {
        const body = block(['endsubstitution']); if (tag(tokens[index++] || '') !== 'endsubstitution') throw new Error('Unclosed substitution');
        nodes.push({ type: name, body });
      } else if (['assign', 'include', 'editable'].includes(name)) nodes.push({ type: name, source: code.slice(name.length).trim() });
      else throw new Error('Unsupported fixture tag: ' + code);
    }
    return nodes;
  }
  return block();
}
function render(source, context, includes = {}) {
  function walk(nodes, scope) {
    return nodes.map(node => {
      if (node.type === 'text') return node.source;
      if (node.type === 'output') return String(value(node.source, scope) ?? '');
      if (node.type === 'assign') { const match = node.source.match(/^(\w+)\s*=\s*([\s\S]+)$/); scope[match[1]] = value(match[2], scope); return ''; }
      if (node.type === 'if' || node.type === 'unless') {
        const branch = node.branches.find(branch => node.type === 'unless' ? !condition(branch.source, scope) : condition(branch.source, scope));
        return walk(branch ? branch.body : node.otherwise, scope);
      }
      if (node.type === 'for') return (value(node.source, scope) || []).map((row, index, rows) =>
        walk(node.body, { ...scope, [node.variable]: row, forloop: { first: index === 0, last: index === rows.length - 1, index: index + 1 } })).join('');
      if (node.type === 'case') { const branch = node.branches.find(branch => value(branch.source, scope) === value(node.source, scope)); return branch ? walk(branch.body, scope) : ''; }
      if (node.type === 'substitution') return walk(node.body, scope);
      if (node.type === 'editable') { const match = node.source.match(/^snippets\s+(['"])(.+?)\1/); return match ? scope.snippets[match[2]] || '' : ''; }
      if (node.type === 'include') {
        const name = node.source.match(/^(['"])(.+?)\1/)?.[2];
        if (!(name in includes)) throw new Error('Unknown fixture include: ' + name);
        return render(includes[name], scope, includes);
      }
      throw new Error('Unsupported node');
    }).join('');
  }
  return walk(parse(source), { ...context });
}
module.exports = { render, parse, escape };
