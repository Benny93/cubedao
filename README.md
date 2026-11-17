# 方块岛 CubeDao

A block-building island where everything is named, written and spoken in Mandarin Chinese.
You learn by living there: look at things to read them, dig and build to hear them, and do
what the villagers ask — in Chinese.

```
npm install
npm run dev      # play at http://localhost:5173
npm test         # logic checks (vocabulary, quests, crafting, world)
npm run e2e      # builds, then plays the game in headless Chrome: a smoke test, the exam and every quest line (needs Chrome)
npm run build    # static site in dist/ — deploy as-is (Vercel detects Vite)
```

## How the learning works

- **Everything has a name.** Blocks, animals, water, clouds, the sun and the stars show 汉字
  with tone-coloured pinyin and English. As you meet a word its English fades, then its
  pinyin. Hold `T` to peek; `C` opens your dictionary (with a search box: 字, pinyin with or without tones, or English).
- **Villagers ask in sentences**, each in their own pattern and always with the right
  measure word: 请给我两块木头 · 你有一张桌子吗？ · 我想要两杯牛奶 · 我没有鱼。请给我两条鱼 ·
  我饿了。请给我一个面包 · 我喜欢蓝色。请给我两块蓝色的布 · 请找一只小猫. They also send
  you on errands (请把这封信给裁缝) and ask you to do things (请种三颗种子 · 请钓三条鱼 ·
  请喂企鹅两条鱼 · 请读一本书 · 请骑骆驼). On later rounds
  they switch pattern (你可以给我…吗？ · 你有没有…？ · 我需要…). Each villager speaks in a voice
  of their own; what you do is said by a narrator.
- **Doing is saying.** 我砍了一块木头 · 我放了一块砖 · 猪吃苹果 / 猪不吃竹子 · 开门 / 关门 ·
  种一颗种子 … 小麦熟了 · 我喝了一杯牛奶。好吃！ · 下雨了 · 这里很冷！ · 小猫睡觉了. Choosing the item
  to hold says its name; animals nearby make their noise now and then (喵！ 汪汪！).
- **Crafting (`E`)** is written as counting phrases: 三块木板 + 两根棍子 → 一把镐.
- **The merchant** buys and sells for 块钱. **The friend** asks about the world as it is
  right now (现在几点？ 下雨了吗？ 老师在哪里？).
- **The blackboard** in the school has eight activities: a listening/reading exam, sentence
  building, typing pinyin with tones, a measure-word drill (三＿木头), a tone drill, numbers by
  ear (十四 or 四十?), short stories to read, and saying a word into the microphone (where the browser supports
  speech recognition). Exams favour the words you
  know least, and a wrong answer brings that word's pinyin and English back.
- **Characters come apart.** Single-character words show the part that carries the meaning
  (扌 hand in 挖, 口 mouth in 吃, 氵 water in 海).
- **Grammar notes** unlock the first time a pattern shows up (measure words, 两, 吗, 了, 的,
  不/没有, 很, 把 …) and stay in the dictionary, where every word can be clicked to hear it.
- **The world keeps time in Chinese**: 星期一 早上八点 · 晴天. `M` is a map with the places
  written in characters (a gold ring marks where the request you follow leads; the minimap points there from its rim); `B` is your bag, as 我有… sentences; `Q` lists what everyone is
  asking for (✔: you can hand it in now); `H` takes you home (我回家).

## Playing

Start with the teacher (老师) in the pavilion; the first quests carry a hint, and the item
in your hand says what it does. Farm, fish, cook, tame a pet, build a home around a bed and
light it with lanterns (they really glow at night), dig for coal, iron and gold, carry letters between villagers (请把这封信给裁缝), craft a boat and
sail to the snow island, the sand island and the treasure islet. Finish every villager's
list once for the festival. Animals turn to watch you, graze, peck and wag, lie down to sleep
at night (小猫睡觉了), and a sheep stays shorn for a while after you take its wool.

The game opens on a splash and a main menu that flies over the village; `Enter` or 开始 plays,
`Esc` (or ☰ on touch) pauses back to it. Progress is saved in the browser (with the game open in two tabs, the one you are not playing in picks up the other's save rather than overwriting it); the menu's 存档 page
can export it as text and import it elsewhere, and 设置 has switches for pinyin, English, the voice, the music (a quiet pentatonic zither, made up as it plays), and a listening-only mode in
which what villagers say is blurred until you hold `T` (`R` repeats the last line slowly).

The menu's 成就 page lists achievements (first request, 50 and 150 words, first fish, a pet,
a home, the treasure chest, the festival …), worked out from the save, so older saves get theirs too; one
reached while playing pops up in gold. A minimap in the corner names the places near you; `P` hides
everything for a photo. The item you hold shows in your hand and swings as you dig. Dry nights have fireflies and crickets; days have the odd bird. A villager whose request you can fulfil right now has a gold bubble with a ✔. Words you have not met yet carry a red 新 mark; reading one for two seconds meets it. 设置 also has a text size switch. A new player first gets a card with the four controls that matter. Sleeping in your bed at night ends the day with a card: 今天我学了…个词 with the day's new words to hear again, the requests finished and the money earned.

Desktop: `WASD` move · `Space` jump · `Shift` run · click dig/talk (hold to keep digging) ·
right-click or `F` place/use/feed · wheel or `1-9` select. A gamepad works too (sticks walk and look, A jump, RT dig, LT place, LB/RB item, Y repeat, d-pad up map, Start pause). Touch devices get a stick and
buttons labelled 挖 / 放 / 跳 / 做 / 译 / 典 / 家 / 再 / ☰ (push the stick to its rim to run). On a phone held upright the hotbar is a single row of icons below the controls (picking one says its name).

## Code

| file | what |
|---|---|
| `src/words.ts` | vocabulary, blocks, save state, quests, recipes, shop, exam, chat (no DOM) |
| `src/world.ts` | voxel data, island generation, ray casting, chunk meshing (no DOM) |
| `src/atlas.ts` | procedural textures |
| `src/main.ts` | rendering, input, HUD, gameplay |
| `e2e/` | browser checks driven through `window.cubedao`, the game's debug handle |
| `scripts/voice-lines.ts` | every line the game can say, with pinyin, for the recorder |
| `scripts/voice.py` | records the lines with Kokoro into `public/voice/` |

No font or texture assets: textures are painted in code and sounds are synthesised; the one image is the icon, `public/icon.svg` (`node scripts/icons.mjs` renders its PNGs for home screens). Speech is
pre-recorded with [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) into `public/voice/` (one mp3
per line, `index.json` maps text to file). The phonemes come from the game's own pinyin, so polyphones
and neutral tones are read the way the game spells them; a single character is recorded inside 这是X字。 and cut
back out, because said alone Kokoro often gets its tone wrong. A line without a clip of its own is said
word by word from the word clips; only text no clip covers falls back to the browser's `zh-CN` voice
(`npm run e2e` lists such lines). Progress lives in `localStorage`.

After changing vocabulary or sentences, record the new lines (only missing clips are made):

```
uv run --with "kokoro>=0.9.4" --with "misaki[zh]" --with soundfile python scripts/voice.py
```

## License

[MIT](LICENSE). The voice clips in `public/voice/` were generated with
[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0); [three.js](https://threejs.org) is MIT.
