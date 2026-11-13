// Every line the game can say, for scripts/voice.py to record with Kokoro. Prints JSON: [{ key, text, py, voice }]
// where key is the text, or "villager:text" for what a villager says in their own voice, py is the numbered pinyin of each word ("wo3 kan3 le5 …", words split by "|"), taken from the game's own
// vocabulary so polyphones (只 zhī, 种 zhòng / 种子 zhǒngzi) and neutral tones are read the way the game teaches them.
// Lines not listed here are still voiced at runtime: speak() strings together the clips of their words.
import {
  type Part, type Word, V, BLOCKS, ALL_WORDS, RANKS, NPCS, STORIES, PLACES, SOUNDS, FOOD, EDIBLE, VERBS, WEEK, DIRS, RECIPES, SHOP,
  quest, chat, clQuiz, count, price, plain, numWord, oclock, syllables, state,
  WATER, AIR, DOOR_OPEN, SEEDS, SAPLING, PICKAXE, FISH, WHEAT, DOOR, CHEST,
} from '../src/words.ts'

// Kokoro voices (the ones Whisper understood best): the narrator says what you do and see, each villager speaks for themselves
const NARRATOR = 'zm_yunxi'
const VOICES: Record<string, string> = {
  teacher: 'zf_xiaoxiao', carpenter: 'zm_yunjian', farmer: 'zm_yunxia', fisher: 'zm_yunjian', smith: 'zm_yunjian', tailor: 'zf_xiaoyi',
  explorer: 'zm_yunxia', traveller: 'zf_xiaoyi', cook: 'zf_xiaoxiao', friend: 'zf_xiaoyi', merchant: 'zm_yunxia',
}
const lines = new Map<string, { text: string; voice: string }>()
const add = (parts: Part[] | string, who = '') => {
  const text = typeof parts === 'string' ? parts : plain(parts)
  lines.set(who ? `${who}:${text}` : text, { text, voice: who ? VOICES[who] : NARRATOR })
}

// words alone (the dictionary, exams, labels) and numbers up to 99
for (const x of [...ALL_WORDS, ...RANKS.map(r => r[1]), ...DIRS]) add(x.hz)
for (let n = 1; n < 100; n++) add(numWord(n).hz)
for (const s of STORIES) { add(s.title.hz); for (const l of s.lines) add(l.parts) }

// villagers: every request, both ways of asking, every amount; the first meeting; "not enough, still need …"
for (const k of Object.keys(NPCS)) {
  for (let i = 0; i < NPCS[k].asks.length * 12; i++) {
    const q = quest(k, i)
    add(q.parts, k)
    if (i < NPCS[k].asks.length) add([V.hello, '！', V.me, V.am, NPCS[k].w, '。', ...q.parts], k)
    if (q.item) for (let m = 1; m <= q.n; m++) add([V.notEnough, '。', V.still, V.need, ...count(m, q.item), '。'], k)
  }
  for (const c of [V.thanks, V.right]) add(c.hz + '！', k)
}
for (const k of Object.keys(VOICES)) add([V.goodnight, '！'], k)
add([V.you, V.need, V.buy, V.what, '？'], 'merchant')
add([V.hello, '！', V.we, V.chat, V.lets, '！'], 'friend')
add([V.congrats, '！', V.you, V.am, V.we, V.de, V.friend, V.le, '！'])
add(V.need.hz + plain(count(1, PICKAXE)))

// the friend's questions and answers (random; sample until no new ones turn up)
const ctx = (r: () => number) => ({ period: [V.morning, V.afternoon, V.evening][r() * 3 | 0], wet: r() < 0.5, hour: r() * 24, day: r() * 7 | 0, dirTo: () => DIRS[r() * 8 | 0] })
for (let money = 0; money < 60; money += 1) {
  state.money = money
  for (let i = 0; i < 300; i++) { const c = chat(ctx(Math.random)); add(c.ask.parts, 'friend'); c.options.forEach(o => add(o.parts)) }
}
state.money = 0
for (let i = 0; i < 20000; i++) add(clQuiz().reveal) // measure-word drill: 三块木头

// doing things: 我砍了一块木头 · 我放了一块砖 · 种一颗种子 · 我喝了一杯牛奶。好喝！
const solid = BLOCKS.map((_, id) => id).filter(id => ![AIR, WATER, DOOR_OPEN].includes(id))
for (const id of solid) {
  add([V.me, VERBS.get(id) ?? V.dig, V.le, ...count(1, id), '。'])
  if (!BLOCKS[id].item) add([V.me, id === SAPLING ? V.plant : V.put, V.le, ...count(1, id), '。'])
}
add([V.plant, ...count(1, SEEDS), '。'])
for (const [id, verb] of EDIBLE) add([V.me, verb, V.le, ...count(1, id), '。', verb === V.drink ? V.tastyDrink : V.tasty, '！'])
// feeding: what each animal does and doesn't eat, for the foods there are
const foods = [...new Set([...FOOD.values(), ...EDIBLE.keys(), FISH, WHEAT])]
for (const animal of FOOD.keys()) for (const id of foods) {
  const verb = EDIBLE.get(id) === V.drink ? V.drink : V.eat, likes = FOOD.get(animal) === id
  add(likes ? [animal, verb, BLOCKS[id].w, '。'] : [animal, V.not, verb, BLOCKS[id].w, '。'])
}
// animals: 小猫。喵！ · 我的大狗。汪汪！ · 不对。这是小羊。 · 这是我的小猫！ · 我骑骆驼。
const SWIMS_OR_FLIES = [V.bird, V.butterfly, BLOCKS[FISH].w]
const animals = [V.pig, V.chicken, V.cat, V.cow, V.sheep, V.dog, V.bird, V.butterfly, V.panda, V.penguin, V.camel, BLOCKS[FISH].w]
for (const a of animals) for (const size of [undefined, V.small, V.big]) for (const pet of [false, true]) {
  const name: Part[] = [...(pet ? [V.my] : []), ...(size ? [size] : []), a], sound = SOUNDS.get(a)
  add(plain(name) + (sound ? '。' + sound.hz + '！' : ''))
  if (!pet) add([V.wrong, '。', V.this, V.am, ...name, '。'])
  if (!pet && !SWIMS_OR_FLIES.includes(a)) add([...name, V.sleep, V.le, '。']) // clicked while asleep (pets stay up)
  if (pet) {
    const verb = EDIBLE.get(FOOD.get(a) ?? 0) === V.drink ? V.drink : V.eat
    if (FOOD.has(a)) add(plain([a, verb, BLOCKS[FOOD.get(a)!].w, '。']) + plain([V.this, V.am, ...name, '！']))
  }
  if (a === V.camel && !pet) add([V.me, V.ride, ...name, '。'])
}
// crafting (做四块木板) and the merchant (买一颗种子，两块钱。)
for (const r of RECIPES) add(V.make.hz + plain(count(r.out[1], r.out[0])))
for (const kind of ['buy', 'sell'] as const) for (const [id, c] of SHOP[kind]) add([V[kind], ...count(1, id), '，', ...price(c), '。'])
for (const sound of SOUNDS.values()) add(sound.hz + '！') // an animal nearby, unprompted
// doors, beds, the chest, fishing, the boat, going home, places, the day, the weather
add([V.open, BLOCKS[DOOR].w, '。']); add([V.close, BLOCKS[DOOR].w, '。'])
add([V.sleep, '。']); add([V.this, V.am, V.my, V.home, '。'])
add([BLOCKS[CHEST].w, V.am, V.empty, V.de, '。']); add([V.openUp, BLOCKS[CHEST].w, '！ +', ...price(50)])
add(V.notHave.hz + BLOCKS[FISH].w.hz)
for (const dest of [V.home, PLACES.teacher]) add([V.me, V.goBack, dest, '。'])
for (const [k, place] of Object.entries(PLACES)) {
  const feel = k === 'snow' ? V.cold : k === 'desert' ? V.hot : undefined
  add(feel ? [place, '。', V.here, V.very, feel, '！'] : [place])
}
for (const per of [V.morning, V.forenoon, V.noon, V.afternoon, V.evening]) add([per, V.good, '！'])
for (let day = 1; day <= 30; day++) add([V.morning, V.good, '！', V.today, V.am, V.di, numWord(day), V.day, '。'])
for (const w of [V.rain, V.snowing]) add([w, V.le, '！'])
add([V.clear, V.le, '！'])
for (const [, title] of RANKS) add([V.you, V.am, title, V.le, '！'])
for (let h = 0; h < 24; h++) add([V.now, ...oclock(h), '。'])
for (const d of WEEK) add([V.today, d, '。'])

// --- numbered pinyin, word by word: longest match against the vocabulary ---
const extra: Word[] = [{ hz: '百', py: 'bǎi', en: '' }, { hz: '把', py: 'bǎ', en: '' }]
const lex = new Map<string, string>()
for (const x of [...ALL_WORDS, ...RANKS.map(r => r[1]), ...DIRS, ...extra]) lex.set(x.hz, syllables(x.py).map(([s, t]) => strip(s) + t).join(' '))
const longest = Math.max(...[...lex.keys()].map(k => k.length))
function strip(s: string) {
  const BARE: Record<string, string> = Object.fromEntries(['aāáǎà', 'eēéěè', 'iīíǐì', 'oōóǒò', 'uūúǔù', 'üǖǘǚǜ'].flatMap(g => [...g].map(ch => [ch, g[0]])))
  return [...s].map(ch => BARE[ch] ?? ch).join('').replace('ü', 'v')
}
/** "我砍了…" -> "wo3|kan3|le5|…"; punctuation passes through; characters the game does not teach stay as they are */
function pinyin(text: string) {
  const out: string[] = []
  for (let i = 0; i < text.length;) {
    let len = Math.min(longest, text.length - i)
    while (len > 0 && !lex.has(text.slice(i, i + len))) len--
    if (len) { out.push(lex.get(text.slice(i, i + len))!); i += len } else out.push(text[i++])
  }
  return out.join('|')
}

console.log(JSON.stringify([...lines].filter(([, l]) => /[\u4e00-\u9fff]/.test(l.text)).sort().map(([key, l]) => ({ key, ...l, py: pinyin(l.text) }))))
