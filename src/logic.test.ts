import test from 'node:test'
import assert from 'node:assert/strict'
import { numQuiz, radical, html as wordHtml, newNotes, NOTES, clQuiz, toneQuiz, BLOCKS as BB, STORIES, checkPinyin, rank, reviewWord, oclock, chat, DIRS, V as VV, numWord, price, trade, SHOP, question, syllables, ALL_WORDS, cn, quest, plain, level, see, V, AIR, WATER, BAMBOO, STONE, BLOCKS, NPCS, RECIPES, state, craft, canCraft, dirTo, WOOD, PLANK, loadClips, clipsFor } from './words.ts'
import * as world from './world.ts'

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
