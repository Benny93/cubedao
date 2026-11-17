import test from 'node:test'
import assert from 'node:assert/strict'
import { ACH, done, forget, untilHour, bedtime, ready, searchKey, searchHit, act, unact, did, complete, handOver, LETTER, hourOf, dayOf, period, count, numQuiz, radical, html as wordHtml, newNotes, NOTES, clQuiz, toneQuiz, BLOCKS as BB, STORIES, checkPinyin, rank, reviewWord, oclock, chat, DIRS, V as VV, numWord, price, trade, SHOP, question, syllables, ALL_WORDS, cn, quest, plain, level, see, V, AIR, WATER, BAMBOO, STONE, BLOCKS, NPCS, RECIPES, state, craft, canCraft, dirTo, WOOD, PLANK, loadClips, clipsFor, NO_SIZE, migratePets } from './words.ts'
import * as world from './world.ts'
import { t, setLang, langOf, LANGS } from './i18n.ts'
import de from './lang/de.ts'
import fr from './lang/fr.ts'
import es from './lang/es.ts'
import ru from './lang/ru.ts'

test('texts come in the chosen language, with their blanks filled; English when a table lacks one', () => {
  assert.equal(langOf(JSON.stringify({ opts: { lang: 1 } })), 1)
  assert.equal(langOf('{}'), 0); assert.equal(langOf('not json'), 0); assert.equal(langOf(JSON.stringify({ opts: { lang: 9 } })), 0)
  assert.equal(t('I have {0} yuan.', 5), 'I have 5 yuan.')
  setLang(1)
  assert.equal(t('no such text {0}', 'x'), 'no such text x')
  assert.match(t('I have {0} yuan.', 5), /5/)
  setLang(0)
  for (const [i, table] of [de, fr, es, ru].entries()) {
    const name = LANGS[i + 1], blanks = (s: string) => (s.match(/\{\d\}/g) ?? []).sort().join()
    assert.ok(Object.keys(table).length > 500, name)
    for (const [en, tr] of Object.entries(table)) {
      assert.equal(blanks(tr), blanks(en), `${name}: ${en}`) // every blank kept, none invented
      if (en.includes('right-click')) assert.ok(tr.includes(table['right-click']), `${name}: ${en}`) // touch screens swap it for 放
      if (/^[A-Z][a-z ]+: /.test(en) && ACH.some(a => a[1] === en)) assert.equal(tr.split(':').length, 2, `${name}: ${en}`) // achievement title: one colon
    }
  }
})

test('pinyin splits into one toned syllable per character, for every word', () => {
  assert.deepEqual(syllables('xióngmāo'), [['xióng', 2], ['māo', 1]])
  assert.deepEqual(syllables('niúnǎi'), [['niú', 2], ['nǎi', 3]])
  assert.deepEqual(syllables('píngguǒ'), [['píng', 2], ['guǒ', 3]])
  assert.deepEqual(syllables('yúgān'), [['yú', 2], ['gān', 1]])
  assert.deepEqual(syllables('nǐ hǎo'), [['nǐ', 3], ['hǎo', 3]])
  assert.deepEqual(syllables('xièxie'), [['xiè', 4], ['xie', 5]])
  for (const w of ALL_WORDS) assert.equal(syllables(w.py).length, [...w.hz].length, w.hz + ' ' + w.py)
})

test('chinese numerals', () => {
  assert.deepEqual([0, 7, 10, 11, 20, 25, 99, 100, 105, 112, 340].map(cn),
    ['零', '七', '十', '十一', '二十', '二十五', '九十九', '一百', '一百零五', '一百一十二', '三百四十'])
})

test('quests use 两 before a measure word and the right classifier', () => {
  assert.equal(plain(quest('teacher', 0).parts), '你好！请给我两块木头。')
  assert.equal(plain(quest('teacher', 2).parts), '你好！请给我五朵红花。')
  assert.equal(plain(quest('teacher', 6).parts), '你好！请给我三根竹子。')
  assert.equal(plain(quest('farmer', 3).parts), '我想要两杯牛奶。')
  assert.equal(plain(quest('cook', 1).parts), '我饿了。请给我两条烤鱼。')
  assert.equal(plain(quest('explorer', 0).parts), '我很冷。请给我两团羊毛。')
  assert.equal(plain(quest('smith', 0).parts), '你能给我三块煤吗？')
  assert.equal(plain(quest('smith', 6).parts), '我没有煤了。请给我四块煤。')
  assert.equal(plain(quest('traveller', 0).parts), '我很渴。你有两杯牛奶吗？')
  assert.equal(plain(quest('traveller', 6).parts), '这里很热！我想吃四个苹果。')
  assert.deepEqual(['farmer', 'fisher', 'explorer', 'teacher', 'traveller'].map(k => plain(quest(k, NPCS[k].asks.length - 1).parts)),
    ['请种三颗种子。', '请钓三条鱼。', '请喂企鹅两条鱼。', '请读一本书。', '请骑骆驼。'])
  assert.deepEqual(['smith', 'cook', 'carpenter'].map(k => plain(quest(k, NPCS[k].asks.length - 1).parts)), ['请挖五块石头。', '请喝一杯牛奶。', '请放两个灯笼。'])
  assert.equal(plain(quest('tailor', 2).parts), '我喜欢蓝色。请给我两块蓝色的布。')
  assert.equal(plain(quest('tailor', 1).parts), '请把这封信给渔夫。')
  assert.equal(plain(quest('teacher', 18).parts), '你可以给我三块木头吗？')        // second lap: new pattern, one more
  assert.equal(plain(quest('farmer', 8).parts), '你有没有苹果？我想要四个。')
  assert.equal(plain(quest('cook', 6).parts), '我很饿。我想吃两个面包。')
  assert.equal(plain(oclock(14)), '两点')
  assert.equal(plain(oclock(0)), '十二点')
  assert.equal(plain(quest('teacher', 1).parts), '请找一头猪。')
  assert.equal(plain(quest('teacher', 3).parts), '请找一只熊猫。')
  assert.equal(plain(quest('teacher', 5).parts), '请找一只小猫。')
  assert.equal(plain(quest('teacher', 7).parts), '请找一头大牛。')
  assert.equal(plain(quest('teacher', 16).parts), '请找一头骆驼。')
  assert.equal(plain(quest('carpenter', 3).parts), '你有一张桌子吗？')
  assert.equal(plain(quest('farmer', 0).parts), '我想要三个苹果。')
  assert.equal(plain(quest('fisher', 1).parts), '我没有鱼。请给我两条鱼。')
  assert.equal(quest('teacher', 18).n, 3) // second lap asks for one more
})

test('every quest item is obtainable: gathered raw or craftable from raw', () => {
  const raw = new Set([1, 2, 3, 4, 6, 7, 8, 9, 24, 25, 27, 29, 30, 31, 33, 35, 41, 14, 49, 50, 11]) // glass is bought or earned // + gold, coal, iron from the rock // + seeds, wheat // world blocks + apple, egg, fish
  for (let grew = true; grew;) {
    grew = false
    for (const r of RECIPES) if (!raw.has(r.out[0]) && r.in.every(([id]) => raw.has(id))) { raw.add(r.out[0]); grew = true }
  }
  for (const npc of Object.values(NPCS)) for (const ask of npc.asks) if (Array.isArray(ask)) assert.ok(raw.has(ask[0]), BLOCKS[ask[0]].w.en)
})

test('crafting spends inputs and yields outputs', () => {
  assert.equal(canCraft(0), false)
  state.inv[WOOD] = 1
  assert.equal(craft(0), true)
  assert.deepEqual([state.inv[WOOD], state.inv[PLANK]], [0, 4])
  assert.equal(craft(0), false)
})

test('numbers above ten keep one syllable per character', () => {
  assert.deepEqual([numWord(25).hz, numWord(25).py], ['二十五', 'èr shí wǔ'])
  assert.equal(syllables(numWord(72).py).length, 3)
  const big: [number, string][] = [[100, '一百'], [105, '一百零五'], [110, '一百一十'], [999, '九百九十九'], [1000, '一千'], [1005, '一千零五'], [1015, '一千零一十五'], [1200, '一千二百'],
    [2000, '两千'], [2020, '两千零二十'], [10000, '一万'], [20000, '两万'], [32000, '三万两千'], [100005, '十万零五'], [120000, '十二万']]
  for (const [n, hz] of big) assert.equal(cn(n), hz, String(n))
  assert.deepEqual([numWord(2500).hz, numWord(2500).py], ['两千五百', 'liǎng qiān wǔ bǎi'])
  assert.equal(plain(price(1500)), '一千五百块钱')
  assert.equal(plain(price(2)), '两块钱')
  assert.equal(plain(price(18)), '十八块钱')
})

test('trading moves money and goods, and refuses what you cannot afford', () => {
  state.money = 0; state.inv[SHOP.sell[6][0]] = 1
  assert.equal(trade('buy', 2), false)
  assert.equal(trade('sell', 6), true)      // one fish for 4
  assert.equal(trade('sell', 6), false)
  assert.equal(trade('buy', 2), true)       // a brick for 3
  assert.equal(state.money, 1)
})

test('exam questions have four distinct options including the answer', () => {
  for (let i = 0; i < 200; i++) {
    const q = question()
    assert.equal(new Set(q.options).size, 4)
    assert.equal(q.options[q.answer], q.listen ? q.word.hz : q.word.en)
  }
})

test('chat questions always have exactly one right reply among distinct options', () => {
  for (let i = 0; i < 500; i++) {
    const c = chat({ hour: i % 24, day: i, period: i % 2 ? VV.morning : VV.evening, wet: i % 3 === 0, dirTo: k => i % 5 ? DIRS[k.length % 8] : undefined })
    const texts = c.options.map(o => plain(o.parts))
    assert.equal(new Set(texts).size, texts.length, texts.join(' | '))
    assert.ok(texts.length >= 3 && c.answer >= 0 && c.answer < texts.length)
  }
  state.money = 0
  const broke = Array.from({ length: 300 }, () => chat({ hour: 9, day: 0, period: VV.noon, wet: false, dirTo: () => undefined })).find(c => c.ask.en.startsWith('How much'))!
  assert.equal(plain(broke.options[broke.answer].parts), '我没有钱。')
  state.money = 7
  const money = Array.from({ length: 300 }, () => chat({ hour: 14, day: 2, period: VV.noon, wet: false, dirTo: () => undefined })).find(c => c.ask.en.startsWith('How much'))!
  assert.equal(plain(money.options[money.answer].parts), '我有七块钱。')
})

test('typed pinyin: tone numbers or marks, spacing ignored, letters-only is a tone miss', () => {
  for (const ok of ['ni3 hao3', 'ni3hao3', 'nǐ hǎo', 'NI3HAO3']) assert.equal(checkPinyin(ok, VV.hello), 'right', ok)
  assert.equal(checkPinyin('ni hao', VV.hello), 'tones')
  assert.equal(checkPinyin('ni2 hao3', VV.hello), 'tones')
  assert.equal(checkPinyin('ni3 ha3', VV.hello), 'wrong')
  assert.equal(checkPinyin('xie4xie', VV.thanks), 'right')   // neutral tone needs no number
  assert.equal(checkPinyin('xie4xie5', VV.thanks), 'right')
  assert.equal(checkPinyin('mu4jiang', VV.carpenter), 'right')
  assert.equal(checkPinyin('wǎn ān', VV.goodnight), 'right')  // second syllable starts with a vowel
  assert.equal(checkPinyin('wan3 an1', VV.goodnight), 'right')
  assert.equal(checkPinyin('wǎn\'ān', VV.goodnight), 'right') // the apostrophe marks the syllable break, as in printed pinyin
  for (const typed of ['wan3’an1', 'wǎn’ān']) assert.equal(checkPinyin(typed, VV.goodnight), 'right', typed) // phones type a curly apostrophe
})

test('ranks and review', () => {
  assert.deepEqual([0, 9, 10, 60, 500].map(n => rank(n)), [0, 0, 1, 3, 5])
  state.seen = { '猪': 50, '猫': 1, '狗': 1, '牛': 1 }
  const picks = Array.from({ length: 400 }, () => reviewWord().hz)
  assert.ok(picks.filter(h => h === '猪').length < 40, 'well-known words come up rarely')
  state.seen = {}
})

test('stories parse: every word is in the vocabulary', () => {
  assert.equal(STORIES.length, 14)
  assert.equal(plain(STORIES[0].lines[3].parts), '我每天给它一条鱼。')
  for (const s of STORIES) for (const l of s.lines) assert.ok(l.parts.length > 2 && l.en)
})

test('measure-word and tone drills are well formed', () => {
  for (let i = 0; i < 500; i++) {
    const q = clQuiz()
    assert.equal(new Set(q.options).size, 4)
    assert.ok(q.options[q.answer].startsWith(q.word.hz) && !q.options.some((o, k) => k !== q.answer && o.startsWith('个')))
    const thing = (q.prompt[2] as typeof VV.two).hz, wrong = q.options.filter((_, k) => k !== q.answer).map(o => o[0]) // a second right measure word is never offered as wrong
    assert.ok(!(thing === '鱼竿' && wrong.includes('把')) && !(thing === '羊' && wrong.includes('头')), thing + wrong)
    const t = toneQuiz()
    assert.equal(t.options[t.answer], t.word.py, t.word.hz)      // rebuilding the tone mark gives back the word's own pinyin
    assert.equal(new Set(t.options).size, 4)
  }
  assert.ok(BB.length > 40)
  for (let i = 0; i < 500; i++) {
    const q = numQuiz()
    assert.equal(new Set(q.options).size, 4, q.options.join())
    assert.equal(cn(+q.options[q.answer]), q.word.hz)
  }
})

test('grammar notes unlock once, when their word is first met', () => {
  state.seen = {}; state.notes = []
  assert.deepEqual(newNotes(), [])
  see(VV.two); see(VV.ma)
  assert.equal(newNotes().length, 3)          // tones (first word of all), 两, 吗
  assert.deepEqual(newNotes(), [])
  see(VV.my); see(VV.de)
  assert.equal(newNotes().length, 1)          // 的 and 我的 share one note
  assert.ok(NOTES.every(([, n]) => n.length < 220))
  state.seen = {}; state.notes = []
})

test('components show for single characters only', () => {
  assert.equal(radical('挖'), '扌 hand')
  assert.equal(radical('木头'), '')
  assert.ok(wordHtml(VV.eat).includes('口 mouth') && !wordHtml(VV.hello).includes('rad'))
})

test('compass: north is -z, east is +x', () => {
  assert.deepEqual([dirTo(0, -5), dirTo(5, 0), dirTo(3, 3), dirTo(-4, 0)].map(d => d.hz), ['北', '东', '东南', '西'])
})

test('words graduate from English to pinyin to hanzi only', () => {
  assert.equal(level(V.pig), 0)
  see(V.pig, 4); assert.equal(level(V.pig), 1)
  see(V.pig, 8); assert.equal(level(V.pig), 2)
})

test('world: deterministic island with a pavilion, bamboo and sea at the rim', () => {
  world.generate()
  assert.deepEqual(['snow', 'desert', 'islet', 'teacher'].map(k => world.biome(Math.floor(world.SPOTS[k].x), Math.floor(world.SPOTS[k].z))), [1, 2, 0, 0])
  assert.ok(world.data.includes(47), 'cactus grows somewhere')
  for (const ore of [49, 50, 14]) assert.ok(world.data.includes(ore), 'ore ' + ore)
  const snapshot = world.data.slice()
  world.generate()
  assert.deepEqual(world.data, snapshot)
  const { x, y, z } = world.HOME
  assert.equal(world.get(x, y - 1, z), STONE)      // floor
  assert.equal(world.get(x, y, z), AIR)            // room for the teacher
  assert.ok(BLOCKS[world.get(x, y + 3, z)].solid)  // roof
  assert.equal(world.get(0, world.SEA - 1, 0), WATER)
  assert.ok(world.data.includes(BAMBOO))
})

test('lanterns light the air around them, fading with distance and stopped by solid blocks', () => {
  world.generate()
  const { x, y, z } = world.HOME, L = (dx: number, dy: number, dz: number) => world.light[world.idx(x + dx, y + dy, z + dz)]
  world.relight()
  assert.equal(L(0, 2, 0), 15)                 // the pavilion's own lantern
  assert.equal(L(0, 1, 0), 14)
  assert.equal(L(0, 0, 3), 15 - 2 - 3)         // two down, three across
  assert.equal(L(0, 3, 0), 0)                  // the tile roof block above is opaque: no light inside it
  world.set(x, y + 2, z, AIR)
  world.relight()
  assert.equal(L(0, 1, 0), 0)                  // lantern gone: dark here (the cook's stove still glows far away)
  world.generate()
})

test('raycast finds the block and the face it entered through', () => {
  world.generate()
  const { x, y, z } = world.HOME
  const hit = world.raycast([x + 0.5, y + 1.5, z + 0.5], [0, -1, 0], 6, id => id !== AIR)
  assert.deepEqual(hit && [hit.x, hit.y, hit.z, hit.ny], [x, y - 1, z, 1])
  assert.equal(world.raycast([x + 0.5, y + 1.5, z + 0.5], [0, -1, 0], 1, id => id !== AIR), null)
  assert.equal(world.rayBox([0, 0, 0], [0, 0, -1], [-1, -1, -5], [1, 1, -3]), 3)
  assert.equal(world.rayBox([0, 0, 0], [0, 0, 1], [-1, -1, -5], [1, 1, -3]), Infinity)
})

test('voice clips: own line, a villager in their voice, borrowed by the narrator, else word by word', () => {
  loadClips({ '我': 'a', '我的': 'b', '猫': 'c', '谢谢！': 'd', 'teacher:谢谢！': 'e', 'cook:我饿了。': 'f' })
  assert.deepEqual(clipsFor('谢谢！'), ['d'])
  assert.deepEqual(clipsFor('谢谢！', 'teacher'), ['e'])
  assert.deepEqual(clipsFor('谢谢！', 'farmer'), ['d']) // no voice of their own for it: the narrator's
  assert.deepEqual(clipsFor('我饿了。'), ['f']) // the narrator borrows the cook's line
  assert.deepEqual(clipsFor('我的猫。'), ['b', 'c']) // longest match: 我的, not 我 + 的
  assert.equal(clipsFor('我的狗'), undefined) // 狗 has no clip: the browser voice says it all
})

test('no size + animal name that reads as slang or another animal', () => {
  assert.deepEqual([...NO_SIZE].map(([a, s]) => s.hz + a.hz).sort(), ['大鸟', '大鸡', '小熊猫'].sort())
})

test('old saves: a big chicken or small panda pet comes back as a plain one', () => {
  assert.deepEqual(migratePets(['鸡大', '熊猫小', '猫小', '鸡']), ['鸡', '熊猫', '猫小'])
})

test('两, not 二, as the numeral before a measure word: counts, prices, hours, the measure-word drill', () => {
  for (let n = 1; n <= 30; n++) {
    const want = n === 2 ? '两' : numWord(n).hz
    assert.equal((count(n, WOOD)[0] as typeof VV.two).hz, want)
    assert.equal((price(n)[0] as typeof VV.two).hz, want)
  }
  for (let h = 1; h <= 12; h++) assert.equal((oclock(h)[0] as typeof VV.two).hz, h === 2 ? '两' : numWord(h).hz)
  for (let i = 0; i < 300; i++) {
    const q = clQuiz(), n = +q.en.split(' ')[0], num = q.prompt[0] as typeof VV.two
    assert.equal(num.hz, n === 2 ? '两' : numWord(n).hz)
    assert.equal(q.reveal[0], num)
  }
})

test('the game clock: eight on Monday at the start, 20 s an hour, a new day at midnight', () => {
  assert.equal(hourOf(0), 8)
  assert.equal(hourOf(20), 9)
  assert.equal(hourOf(16 * 20), 0)                   // midnight
  assert.equal(dayOf(16 * 20 - 1), 0)
  assert.equal(dayOf(16 * 20), 1)                    // Tuesday begins at midnight
  assert.equal(dayOf(16 * 20 + 480 * 6), 7)          // a week later: Monday again
  assert.equal(hourOf(480 * 3 + 10), 8.5)
  assert.deepEqual([0, 4.9, 5, 8.9, 9, 12, 13, 17.9, 18, 23].map(h => period(h).hz),
    [V.dawn, V.dawn, V.morning, V.morning, V.forenoon, V.noon, V.afternoon, V.afternoon, V.evening, V.evening].map(w => w.hz))
})

test('quest progress: rewards, counting what you do from when it was asked, letters, the festival', () => {
  const saved = structuredClone({ quests: state.quests, did: state.did, base: state.base, letters: state.letters, inv: state.inv, money: state.money, won: state.won, seen: state.seen })
  Object.assign(state, { quests: { carpenter: 7 }, did: { lamp: 5 }, base: {}, letters: {}, inv: {}, money: 0, won: false })
  const reward = quest('carpenter').reward
  assert.equal(complete('carpenter'), false)
  assert.equal(state.inv[reward], 12)
  assert.equal(state.money, 3)
  assert.equal(quest('carpenter').act, 'lamp')        // next: 请放两个灯笼, counted from now
  assert.equal(did('carpenter'), 0)
  act('lamp'); assert.equal(did('carpenter'), 1)
  unact('lamp'); unact('lamp'); assert.equal(did('carpenter'), 0)  // taking lanterns back never makes it owe more
  assert.equal(state.did.lamp, 4); assert.equal(state.base.carpenter, 4)
  act('lamp'); act('lamp'); assert.equal(did('carpenter'), 2)
  state.did.lamp = 0; unact('lamp'); assert.equal(state.did.lamp, 0)

  state.quests = { carpenter: 1 }                     // next errand is a letter for the tailor: it comes with the reward
  complete('carpenter')
  assert.equal(quest('carpenter').deliver, 'tailor')
  assert.equal(state.letters.carpenter, 1); assert.equal(state.inv[LETTER], 1); assert.equal(state.seen['把字句'], 1)
  assert.equal(handOver('fisher'), undefined)
  assert.equal(handOver('tailor'), 'carpenter')
  assert.deepEqual(state.letters, {}); assert.equal(state.inv[LETTER], 0)
  assert.equal(handOver('tailor'), undefined)

  state.quests = Object.fromEntries(Object.entries(NPCS).map(([k, n]) => [k, n.asks.length - (k === 'cook' ? 1 : 0)]))
  assert.equal(complete('cook'), true)                // the last request of the last list: the festival
  assert.equal(state.won, true)
  assert.equal(complete('cook'), false)               // only once
  Object.assign(state, saved)
})

test('dictionary search: characters, pinyin with or without tones and spaces, ü as v or u, English', () => {
  const hit = (w: { hz: string; py: string; en: string }, q: string) => searchHit(searchKey(w), q)
  const nihao = { hz: '你好', py: 'nǐ hǎo', en: 'Hello' }, green = { hz: '绿色', py: 'lǜsè', en: 'green' }
  for (const q of ['你', '你好', 'nǐ hǎo', 'nǐhǎo', 'ni hao', 'nihao', ' NiHao ', 'hello', 'HELLO', '']) assert.ok(hit(nihao, q), q)
  for (const q of ['lǜsè', 'lvse', 'luse', 'lv', 'lüse', 'LÜ', 'green', '绿']) assert.ok(hit(green, q), q) // ü typed as itself too (German keyboards)
  for (const q of ['mu tou', 'mù tou', 'mutou']) assert.ok(hit({ hz: '木头', py: 'mùtou', en: 'wood' }, q), q) // stored without a space, typed with one
  for (const q of ['fünf', 'FÜNF', 'fün']) assert.ok(hit({ hz: '五', py: 'wǔ', en: 'fünf' }, q), q) // a German gloss with ü
  for (const q of ['ni3', 'goodbye', '他']) assert.ok(!hit(nihao, q), q)
})

test('a request is ready to hand in: enough done, or enough in the bag; finding and letters are not', () => {
  const saved = structuredClone({ quests: state.quests, did: state.did, base: state.base, inv: state.inv })
  Object.assign(state, { quests: { teacher: 0, carpenter: 8, tailor: 1 }, did: {}, base: {}, inv: {} })
  assert.equal(quest('teacher').item, WOOD)            // 两块木头
  assert.equal(ready('teacher'), false)
  state.inv[WOOD] = 1; assert.equal(ready('teacher'), false)
  state.inv[WOOD] = 2; assert.equal(ready('teacher'), true)
  state.quests.teacher = 1; assert.equal(ready('teacher'), false)    // 请找一头猪: answered by clicking the pig
  assert.equal(ready('carpenter'), false)              // 请放两个灯笼
  act('lamp'); act('lamp'); assert.equal(ready('carpenter'), true)
  assert.equal(quest('tailor').deliver, 'fisher'); assert.equal(ready('tailor'), false)
  Object.assign(state, saved)
})

test('sleeping: villagers turn in at nine, a bed sleeps you through to six', () => {
  assert.deepEqual([20.9, 21, 23, 0, 4.9, 5, 12].map(bedtime), [false, true, true, true, true, false, false])
  for (const c of [0, 100, 13 * 20, 22 * 20 + 7, 480 * 5 + 333]) {
    const s = untilHour(c, 6)
    assert.ok(s >= 0 && s < 480)
    assert.ok(Math.abs(hourOf(c + s) - 6) < 1e-9, String(c))
  }
  assert.equal(untilHour(0, 6), 22 * 20)               // from eight in the morning, round to six the next
})

test('a wrong answer makes a word less known, but a met word stays met', () => {
  const w = { hz: '测试字', py: 'cè shì zì', en: 'test' }
  see(w, 12); assert.equal(level(w), 2)
  forget(w, 1); assert.equal(level(w), 1)              // the pinyin comes back
  forget(w, 2); assert.equal(state.seen[w.hz], 9)
  forget(w, 20); assert.equal(state.seen[w.hz], 1)    // still in the dictionary, and still asked
  state.seen[w.hz] = 0.5; forget(w, 2); assert.equal(state.seen[w.hz], 0.5) // only glimpsed: not raised to met either
  forget({ hz: '没见过', py: '', en: '' }, 2); assert.equal(state.seen['没见过'], 0)
  delete state.seen[w.hz]; delete state.seen['没见过']
})

test('achievements unlock off the save: each one by its own condition', () => {
  const saved = structuredClone({ quests: state.quests, did: state.did, pets: state.pets, home: state.home, read: state.read, money: state.money, chest: state.chest, won: state.won, seen: state.seen })
  Object.assign(state, { quests: {}, did: {}, pets: [], home: undefined, read: [], money: 0, chest: false, won: false, seen: {} })
  const on = () => ACH.filter(a => a[2]()).map(a => a[0].hz)
  assert.deepEqual(on(), [])
  assert.equal(ACH.length, 14)
  assert.equal(ACH[0][0].en, 'New friend')             // the English name is the part before the colon
  state.quests = { teacher: 1 }; assert.deepEqual(on(), ['新朋友'])
  state.quests = { teacher: 12, cook: 8 }; assert.equal(done(), 20); assert.deepEqual(on(), ['新朋友', '好帮手'])
  state.quests = {}
  for (const w of ALL_WORDS.slice(0, 50)) state.seen[w.hz] = 1
  assert.deepEqual(on(), ['小学生'])
  for (const w of ALL_WORDS.slice(0, 150)) state.seen[w.hz] = 1
  assert.deepEqual(on(), ['小学生', '大学生'])
  state.seen = {}
  const each: [() => void, string][] = [
    [() => { state.did.fish = 1 }, '钓鱼'], [() => { state.did.plant = 1 }, '农民'], [() => { state.did.mine = 1 }, '矿工'],
    [() => { state.pets = ['猫'] }, '宠物'], [() => { state.home = [1, 2, 3] }, '我的家'], [() => { state.read = [0] }, '读书'],
    [() => { state.did.ride = 1 }, '骑骆驼'], [() => { state.money = 100 }, '有钱人'], [() => { state.chest = true }, '宝藏'], [() => { state.won = true }, '节日'],
  ]
  for (const [make, hz] of each) {
    Object.assign(state, { did: {}, pets: [], home: undefined, read: [], money: 99, chest: false, won: false })
    make(); assert.deepEqual(on(), [hz])
  }
  Object.assign(state, saved)
})

test('world edits: recorded in the save, the chunks to redraw, light, and a grown tree', () => {
  world.generate()
  const edits: Record<number, number> = {}
  world.load(edits)
  const y = 44, key = (c: [number, number][]) => c.map(([a, b]) => a + ',' + b).sort().join(' ')
  // high in the air, nothing lit: a cell inside a chunk redraws just that chunk; on an edge, the neighbour too; in a corner, four
  assert.equal(key(world.edit(100, y, 100, STONE)), '6,6')
  assert.equal(world.get(100, y, 100), STONE); assert.equal(edits[world.idx(100, y, 100)], STONE)
  assert.equal(key(world.edit(96, y, 100, STONE)), '5,6 6,6')       // x 96 starts chunk 6
  assert.equal(key(world.edit(111, y, 100, STONE)), '6,6 7,6')      // x 111 ends it
  assert.equal(key(world.edit(111, y, 111, STONE)), '6,6 6,7 7,6 7,7')
  assert.equal(key(world.edit(96, y, 96, AIR)), '5,5 5,6 6,5 6,6')
  // a lantern lights its surroundings and redraws all nine chunks; so does taking it away, and building right next to its light
  const LANTERN = BLOCKS.findIndex(b => b.w.hz === '灯笼')
  assert.equal(world.edit(104, y, 104, LANTERN).length, 9)
  assert.equal(world.light[world.idx(105, y, 104)], 14)
  assert.equal(world.edit(106, y, 104, STONE).length, 9)
  assert.equal(world.edit(104, y, 104, AIR).length, 9)
  assert.equal(world.light[world.idx(105, y, 104)], 0)
  assert.equal(world.edit(108, y, 104, AIR).length, 1)             // the light is gone: back to one chunk
  // a sapling grows: the tree's blocks, and only they, go into the save (as a whole-island comparison would find them)
  const SAPLING = BLOCKS.findIndex(b => b.w.en === 'sapling'), sx = 60, sz = 200, sy = world.surface(sx, sz)
  world.set(sx, sy, sz, SAPLING)
  for (const k in edits) delete edits[k]
  const before = world.data.slice()
  assert.equal(world.growTree(sx, sy, sz, 5).length, 9)
  const changed: Record<number, number> = {}
  world.data.forEach((b, j) => { if (b !== before[j]) changed[j] = b })
  assert.ok(Object.keys(changed).length > 10)
  assert.deepEqual(edits, changed)
  assert.equal(world.get(sx, sy, sz), WOOD)
  // animals find a floor under a roof (surface() would give the roof), step up one, never into a wall or water
  const fy = 30
  for (let x = 150; x < 154; x++) for (let z = 150; z < 152; z++) { world.set(x, fy - 1, z, STONE); for (let y = fy; y < fy + 3; y++) world.set(x, y, z, AIR); world.set(x, fy + 3, z, STONE) }
  world.set(151, fy, 150, STONE); world.set(152, fy, 150, STONE); world.set(152, fy + 1, 150, STONE); world.set(153, fy, 150, WATER)
  assert.equal(world.surface(150, 150), fy + 4)          // the roof
  assert.equal(world.floorNear(150, fy, 150), fy)        // the room under it
  assert.equal(world.floorNear(151, fy, 150), fy + 1)    // a step up
  assert.equal(world.floorNear(152, fy, 150), -1)        // a wall two high
  assert.equal(world.floorNear(153, fy, 150), -1)        // water
  world.load({})
  world.generate()
})
