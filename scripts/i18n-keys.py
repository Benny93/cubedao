# Lists every English text the game shows, the keys of src/lang/*.ts; with a language code, only the ones that table lacks.
# python3 scripts/i18n-keys.py [de|fr|es|ru]
import re, sys, json, os
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
Q = r"""('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")"""  # a quoted literal
lit = lambda s: json.loads('"' + s[1:-1].replace('\\\'', "'").replace('"', '\\"') + '"') if s[0] == "'" else json.loads(s)
keys = []
add = lambda s: keys.append(s) if s not in keys else None
words, main = open('src/words.ts').read(), open('src/main.ts').read()
for src in (words, main):
    for m in re.finditer(r'\bt\(([^()]*?)' + Q, src):  # t('…') and t(cond ? '…' : '…', …): every literal before the args
        head = m.group(1)
        if head.strip() and '?' not in head: continue
        for x in re.findall(Q, m.group(0)): add(lit(x))
        rest = src[m.end():m.end() + 200]
        if '?' in head and (n := re.match(r"\s*:\s*" + Q, rest)): add(lit(n.group(1)))
    for m in re.finditer(r"\bw\('[^']*', [^,]+, " + Q + r"\)", src): add(lit(m.group(1)))  # word glosses
    for m in re.finditer(r"\bS\('[^']*', " + Q + r"\)", src): add(lit(m.group(1)))  # story lines
    for m in re.finditer(r"\bL\(t\(" + Q, src): add(lit(m.group(1)))
def block(src, start, end):
    i = src.index(start); return src[i:src.index(end, i)]
for x in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']: add(x)
for m in re.finditer(r"\['[^']+', " + Q, block(words, 'const RADICALS', '\n]\n')): add(lit(m.group(1)))
for m in re.finditer(r"\['[^']+', " + Q + r"\]", block(words, 'export const NOTES', '\n]\n')): add(lit(m.group(1)))
for m in re.finditer(r"\['[^']+', '[^']+', " + Q, block(words, 'export const ACH', '] as const')): add(lit(m.group(1)))
for x in re.findall(Q, block(main, 'const HINTS', '].map')): add(lit(x))
for x in re.findall(Q, block(main, 'const PAST', '\n'))[0:]: add(lit(x)) if '{0}' in x else None
for m in re.finditer(r"\['[^']+', " + Q + ", " + Q + r"\]", block(main, "draw: () => `<h2>${html(V.hello)}", '.map(')): add(lit(m.group(1))); add(lit(m.group(2)))
o = block(main, "...([['py'", '] as const)')
for x in re.findall(Q, o): s = lit(x); add(s) if s not in ('py', 'en', 'voice', 'ear', 'music', 'ui', 'look', 'invert') else None
for m in re.finditer(r'<(\w+)[^>]*\bdata-t\b[^>]*>(.*?)</\1>', open('index.html').read(), re.S): add(m.group(2).strip())
if len(sys.argv) > 1:
    have = set(re.findall(Q + r'\s*:', open(f'src/lang/{sys.argv[1]}.ts').read()))
    have = {lit(x) for x in have}
    keys = [k for k in keys if k not in have]
print(json.dumps(keys, ensure_ascii=False, indent=0))
