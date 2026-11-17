// Vocabulary, block definitions, learning progress and quests. No DOM/three imports: testable in node.
import { t } from './i18n.ts'

export interface Word { hz: string; py: string; en: string }
const w = (hz: string, py: string, en: string): Word => ({ hz, py, en: t(en) }) // en: the meaning in the learner's language

export const NUM = [
  w('零', 'líng', 'zero'), w('一', 'yī', 'one'), w('二', 'èr', 'two'), w('三', 'sān', 'three'),
  w('四', 'sì', 'four'), w('五', 'wǔ', 'five'), w('六', 'liù', 'six'), w('七', 'qī', 'seven'),
  w('八', 'bā', 'eight'), w('九', 'jiǔ', 'nine'), w('十', 'shí', 'ten'),
]

export const V = {
  hello: w('你好', 'nǐ hǎo', 'hello'),
  please: w('请', 'qǐng', 'please'),
  give: w('给', 'gěi', 'give'),
  me: w('我', 'wǒ', 'I / me'),
  thanks: w('谢谢', 'xièxie', 'thank you'),
  notEnough: w('不够', 'bù gòu', 'not enough'),
  still: w('还', 'hái', 'still, more'),
  two: w('两', 'liǎng', 'two (when counting things)'),
  you: w('你', 'nǐ', 'you'),
  am: w('是', 'shì', 'am / is'),
  want: w('想要', 'xiǎngyào', 'would like'),
  have: w('有', 'yǒu', 'have'),
  notHave: w('没有', 'méiyǒu', "don't have"),
  ma: w('吗', 'ma', '(yes/no question)'),
  make: w('做', 'zuò', 'make'),
  find: w('找', 'zhǎo', 'find / look for'),
  zhi: w('只', 'zhī', 'counter: animals'),
  tou: w('头', 'tóu', 'counter: large animals'),
  big: w('大', 'dà', 'big'),
  small: w('小', 'xiǎo', 'small'),
  open: w('开', 'kāi', 'open'),
  openUp: w('打开', 'dǎkāi', 'open up'),
  empty: w('空', 'kōng', 'empty'),
  close: w('关', 'guān', 'close'),
  sleep: w('睡觉', 'shuìjiào', 'sleep'),
  sleepy: w('困', 'kùn', 'sleepy'),
  learn: w('学', 'xué', 'learn'),
  zi: w('词', 'cí', 'word'),
  star: w('星星', 'xīngxing', 'stars'),
  right: w('对了', 'duì le', 'correct'),
  wrong: w('不对', 'bù duì', 'wrong'),
  this: w('这', 'zhè', 'this'),
  eat: w('吃', 'chī', 'eat'),
  drink: w('喝', 'hē', 'drink'),
  tasty: w('好吃', 'hǎochī', 'tasty'),
  tastyDrink: w('好喝', 'hǎohē', 'tasty (of a drink)'),
  pull: w('拔', 'bá', 'pull up'),
  equals: w('等于', 'děngyú', 'equals'),
  dawn: w('凌晨', 'língchén', 'the small hours'),
  forenoon: w('上午', 'shàngwǔ', 'late morning'),
  dig: w('挖', 'wā', 'dig'),
  chop: w('砍', 'kǎn', 'chop'),
  pick: w('摘', 'zhāi', 'pick'),
  cut: w('割', 'gē', 'cut'),
  take: w('拿', 'ná', 'take'),
  put: w('放', 'fàng', 'put down'),
  can: w('可以', 'kěyǐ', 'can, may'),
  require: w('需要', 'xūyào', 'need'),
  wantTo: w('想', 'xiǎng', 'want to'),
  bag: w('背包', 'bēibāo', 'backpack'),
  grammar: w('语法', 'yǔfǎ', 'grammar'),
  tasks: w('任务', 'rènwu', 'tasks'),
  my: w('我的', 'wǒ de', 'my'),
  it: w('它', 'tā', 'it'),
  onTop: w('上', 'shàng', 'on'),
  fear: w('怕', 'pà', 'be afraid of, mind'),
  he: w('他', 'tā', 'he'),
  and: w('和', 'hé', 'and'),
  go: w('去', 'qù', 'go'),
  look: w('看', 'kàn', 'look at, read'),
  live: w('住', 'zhù', 'live (somewhere)'),
  inside: w('里', 'lǐ', 'inside'),
  everyDay: w('每天', 'měitiān', 'every day'),
  happy: w('高兴', 'gāoxìng', 'happy'),
  lots: w('很多', 'hěn duō', 'a lot of'),
  together: w('一起', 'yīqǐ', 'together'),
  read: w('读', 'dú', 'read aloud'),
  say: w('说', 'shuō', 'say, speak'),
  heard: w('听到', 'tīngdào', 'heard'),
  done: w('完', 'wán', 'finished'),
  tree: w('树', 'shù', 'tree'),
  grow: w('长大', 'zhǎngdà', 'grow up'),
  congrats: w('恭喜', 'gōngxǐ', 'congratulations'),
  home: w('家', 'jiā', 'home'),
  goBack: w('回', 'huí', 'go back to'),
  goodnight: w('晚安', 'wǎn ān', 'good night'),
  not: w('不', 'bù', 'not'),
  like: w('喜欢', 'xǐhuan', 'like'),
  walk: w('走', 'zǒu', 'walk'),
  run: w('跑', 'pǎo', 'run'),
  jump: w('跳', 'tiào', 'jump'),
  swim: w('游泳', 'yóuyǒng', 'swim'),
  stand: w('站', 'zhàn', 'stand'),
  row: w('划船', 'huáchuán', 'row a boat'),
  ride: w('骑', 'qí', 'ride'),
  angle: w('钓', 'diào', 'catch (fish) with a rod'),
  feed: w('喂', 'wèi', 'feed'),
  sun: w('太阳', 'tàiyáng', 'sun'),
  moon: w('月亮', 'yuèliang', 'moon'),
  sky: w('天空', 'tiānkōng', 'sky'),
  sea: w('海', 'hǎi', 'sea'),
  sunny: w('晴天', 'qíngtiān', 'sunny'),
  rain: w('下雨', 'xiàyǔ', 'raining'),
  snowing: w('下雪', 'xiàxuě', 'snowing'),
  clear: w('天晴', 'tiān qíng', 'the sky clears'),
  le: w('了', 'le', '(change of state)'),
  need: w('要', 'yào', 'want, need'),
  things: w('东西', 'dōngxi', 'things'),
  meter: w('米', 'mǐ', 'metre'),
  ge: w('个', 'gè', 'counter: general'),
  dui: w('堆', 'duī', 'counter: piles'),
  ba: w('把', 'bǎ', 'counter: things with handles'),
  zhang: w('张', 'zhāng', 'counter: flat things'),
  shan: w('扇', 'shàn', 'counter: doors, windows'),
  ben: w('本', 'běn', 'counter: books'),
  tiao: w('条', 'tiáo', 'counter: long things'),
  bei: w('杯', 'bēi', 'counter: cups'),
  feng: w('封', 'fēng', 'counter: letters'),
  ke: w('颗', 'kē', 'counter: small round things'),
  ke2: w('棵', 'kē', 'counter: plants'),
  kuai: w('块', 'kuài', 'counter: chunks'),
  duo: w('朵', 'duǒ', 'counter: flowers'),
  gen: w('根', 'gēn', 'counter: sticks'),
  pian: w('片', 'piàn', 'counter: thin flat things'),
  teacher: w('老师', 'lǎoshī', 'teacher'),
  carpenter: w('木匠', 'mùjiang', 'carpenter'),
  farmer: w('农民', 'nóngmín', 'farmer'),
  fisher: w('渔夫', 'yúfū', 'fisherman'),
  merchant: w('商人', 'shāngrén', 'merchant'),
  cook: w('厨师', 'chúshī', 'cook'),
  smith: w('铁匠', 'tiějiang', 'blacksmith'),
  able: w('能', 'néng', 'can, be able to'),
  explorer: w('探险家', 'tànxiǎnjiā', 'explorer'),
  traveller: w('旅行者', 'lǚxíngzhě', 'traveller'),
  thirsty: w('渴', 'kě', 'thirsty'),
  friend: w('朋友', 'péngyou', 'friend'),
  we: w('我们', 'wǒmen', 'we'),
  chat: w('聊天', 'liáotiān', 'chat'),
  lets: w('吧', 'ba', "(let's …)"),
  very: w('很', 'hěn', 'very'),
  call: w('叫', 'jiào', 'be called'),
  name: w('名字', 'míngzi', 'name'),
  xiaofang: w('小方', 'xiǎo fāng', 'Xiao Fang (Little Cube)'),
  welcome: w('不客气', 'bù kèqi', "you're welcome"),
  bye: w('再见', 'zàijiàn', 'goodbye'),
  at: w('在', 'zài', 'be at'),
  where: w('哪里', 'nǎlǐ', 'where'),
  side: w('边', 'biān', 'side'),
  now: w('现在', 'xiànzài', 'now'),
  plus: w('加', 'jiā', 'plus'),
  howMuch: w('多少', 'duōshao', 'how much'),
  howMany: w('几', 'jǐ', 'how many'),
  oclock: w('点', 'diǎn', "o'clock"),
  today: w('今天', 'jīntiān', 'today'),
  di: w('第', 'dì', '(makes a number ordinal: 第三 = third)'),
  day: w('天', 'tiān', 'day'),
  whichDay: w('星期几', 'xīngqī jǐ', 'which day of the week'),
  tailor: w('裁缝', 'cáifeng', 'tailor'),
  de: w('的', 'de', "(links a description to a thing)"),
  cloth: w('布', 'bù', 'cloth'),
  red: w('红色', 'hóngsè', 'red'),
  yellow: w('黄色', 'huángsè', 'yellow'),
  blue: w('蓝色', 'lánsè', 'blue'),
  white: w('白色', 'báisè', 'white'),
  colour: w('颜色', 'yánsè', 'colour'),
  who: w('谁', 'shéi', 'who'),
  tuan: w('团', 'tuán', 'counter: balls of something'),
  hungry: w('饿', 'è', 'hungry'),
  plant: w('种', 'zhòng', 'to plant'),
  ripe: w('熟', 'shú', 'ripe'),
  buy: w('买', 'mǎi', 'buy'),
  sell: w('卖', 'mài', 'sell'),
  what: w('什么', 'shénme', 'what'),
  money: w('钱', 'qián', 'money'),
  exam: w('考试', 'kǎoshì', 'exam'),
  compose: w('造句', 'zàojù', 'make a sentence'),
  write: w('写', 'xiě', 'write'),
  pinyin: w('拼音', 'pīnyīn', 'pinyin'),
  tone: w('声调', 'shēngdiào', 'tone'),
  measure: w('量词', 'liàngcí', 'measure word'),
  number: w('数字', 'shùzì', 'number'),
  map: w('地图', 'dìtú', 'map'),
  cloud: w('云', 'yún', 'cloud'),
  listen: w('听', 'tīng', 'listen'),
  next: w('下一个', 'xià yī gè', 'next one'),
  pig: w('猪', 'zhū', 'pig'),
  chicken: w('鸡', 'jī', 'chicken'),
  cat: w('猫', 'māo', 'cat'),
  panda: w('熊猫', 'xióngmāo', 'panda'),
  cow: w('牛', 'niú', 'cow'),
  sheep: w('羊', 'yáng', 'sheep'),
  dog: w('狗', 'gǒu', 'dog'),
  bird: w('鸟', 'niǎo', 'bird'),
  butterfly: w('蝴蝶', 'húdié', 'butterfly'),
  penguin: w('企鹅', 'qǐ é', 'penguin'),
  camel: w('骆驼', 'luòtuo', 'camel'),
  here: w('这里', 'zhèlǐ', 'here'),
  cold: w('冷', 'lěng', 'cold'),
  hot: w('热', 'rè', 'hot'),
  morning: w('早上', 'zǎoshang', 'morning'),
  noon: w('中午', 'zhōngwǔ', 'noon'),
  afternoon: w('下午', 'xiàwǔ', 'afternoon'),
  evening: w('晚上', 'wǎnshang', 'evening'),
  good: w('好', 'hǎo', 'good'),
  north: w('北', 'běi', 'north'),
  east: w('东', 'dōng', 'east'),
  south: w('南', 'nán', 'south'),
  west: w('西', 'xī', 'west'),
}

export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, WATER = 5, WOOD = 6, LEAVES = 7,
  FLOWER = 8, BAMBOO = 9, BRICK = 10, GLASS = 11, LANTERN = 12, TILE = 13, GOLD = 14,
  PLANK = 15, STICK = 16, PICKAXE = 17, TABLE = 18, CHAIR = 19, DOOR = 20, BED = 21,
  PAPER = 22, BOOK = 23, APPLE = 24, EGG = 25, BOAT = 26, FISH = 27, ROD = 28, YFLOWER = 29, BFLOWER = 30, MILK = 31, BLACKBOARD = 32,
  SEEDS = 33, SPROUT = 34, WHEAT = 35, BREAD = 36, CAKE = 37, GRILLED = 38, DOOR_OPEN = 39, SNOW = 40, WOOL = 41, RCLOTH = 42, YCLOTH = 43, BCLOTH = 44, CHEST = 45, SAPLING = 46, CACTUS = 47, LETTER = 48, COAL = 49, IRON = 50, STOVE = 51, SHELF = 52, WINDOW = 53, PATH = 54

// t = atlas tiles [top, side, bottom]; cl = measure word; opaque = hides neighbour faces;
// solid = collides; item = lives in the inventory only, cannot be placed
// shape = boxes [x0,y0,z0,x1,y1,z1] drawn instead of a cube (collision stays a full cube); st = tile for all shape faces
export interface Block { w: Word; cl: Word; t: number[]; opaque?: boolean; solid?: boolean; plant?: boolean; item?: boolean; shape?: number[][]; st?: number }
const full = { opaque: true, solid: true }, item = { item: true }
const legs = (a: number, b: number, h: number) => [a, b].flatMap(x => [a, b].map(z => [x, 0, z, x + 0.14, h, z + 0.14]))
const C = V // measure words live in V
export const BLOCKS: Block[] = [
  { w: w('空气', 'kōngqì', 'air'), cl: C.ge, t: [0, 0, 0] },
  { w: w('草', 'cǎo', 'grass'), cl: C.kuai, t: [0, 1, 2], ...full },
  { w: w('土', 'tǔ', 'dirt'), cl: C.kuai, t: [2, 2, 2], ...full },
  { w: w('石头', 'shítou', 'stone'), cl: C.kuai, t: [3, 3, 3], ...full },
  { w: w('沙子', 'shāzi', 'sand'), cl: C.dui, t: [4, 4, 4], ...full },
  { w: w('水', 'shuǐ', 'water'), cl: C.ge, t: [5, 5, 5] },
  { w: w('木头', 'mùtou', 'wood'), cl: C.kuai, t: [7, 6, 7], ...full },
  { w: w('树叶', 'shùyè', 'leaves'), cl: C.pian, t: [8, 8, 8], solid: true },
  { w: w('红花', 'hónghuā', 'red flower'), cl: C.duo, t: [9, 9, 9], plant: true },
  { w: w('竹子', 'zhúzi', 'bamboo'), cl: C.gen, t: [10, 10, 10], plant: true },
  { w: w('砖', 'zhuān', 'brick'), cl: C.kuai, t: [11, 11, 11], ...full },
  { w: w('玻璃', 'bōli', 'glass'), cl: C.kuai, t: [12, 12, 12], solid: true },
  { w: w('灯笼', 'dēnglong', 'lantern'), cl: C.ge, t: [13, 13, 13], ...full },
  { w: w('瓦', 'wǎ', 'roof tile'), cl: C.pian, t: [14, 14, 14], ...full },
  { w: w('金子', 'jīnzi', 'gold'), cl: C.kuai, t: [15, 15, 15], ...full },
  { w: w('木板', 'mùbǎn', 'plank'), cl: C.kuai, t: [16, 16, 16], ...full },
  { w: w('棍子', 'gùnzi', 'stick'), cl: C.gen, t: [17, 17, 17], ...item },
  { w: w('镐', 'gǎo', 'pickaxe'), cl: C.ba, t: [18, 18, 18], ...item },
  { w: w('桌子', 'zhuōzi', 'table'), cl: C.zhang, t: [16, 19, 63], solid: true, st: 16, shape: [[0, 0.8, 0, 1, 1, 1], ...legs(0.06, 0.8, 0.8)] },
  { w: w('椅子', 'yǐzi', 'chair'), cl: C.ba, t: [16, 20, 63], solid: true, st: 16, shape: [[0.15, 0.4, 0.15, 0.85, 0.5, 0.85], [0.15, 0.5, 0.75, 0.85, 1.1, 0.85], ...legs(0.15, 0.71, 0.4)] },
  { w: w('门', 'mén', 'door'), cl: C.shan, t: [16, 21, 16], solid: true, shape: [[0, 0, 0.4, 1, 1, 0.6]] },
  { w: w('床', 'chuáng', 'bed'), cl: C.zhang, t: [23, 22, 16], solid: true, shape: [[0, 0, 0, 1, 0.5, 1]] },
  { w: w('纸', 'zhǐ', 'paper'), cl: C.zhang, t: [24, 24, 24], ...item },
  { w: w('书', 'shū', 'book'), cl: C.ben, t: [25, 25, 25], ...item },
  { w: w('苹果', 'píngguǒ', 'apple'), cl: C.ge, t: [26, 26, 26], ...item },
  { w: w('鸡蛋', 'jīdàn', 'egg'), cl: C.ge, t: [27, 27, 27], ...item },
  { w: w('船', 'chuán', 'boat'), cl: C.tiao, t: [28, 28, 28], ...item },
  { w: w('鱼', 'yú', 'fish'), cl: C.tiao, t: [29, 29, 29], ...item },
  { w: w('鱼竿', 'yúgān', 'fishing rod'), cl: C.gen, t: [30, 30, 30], ...item },
  { w: w('黄花', 'huánghuā', 'yellow flower'), cl: C.duo, t: [31, 31, 31], plant: true },
  { w: w('蓝花', 'lánhuā', 'blue flower'), cl: C.duo, t: [32, 32, 32], plant: true },
  { w: w('牛奶', 'niúnǎi', 'milk'), cl: C.bei, t: [33, 33, 33], ...item },
  { w: w('黑板', 'hēibǎn', 'blackboard'), cl: C.kuai, t: [16, 34, 16], ...full },
  { w: w('种子', 'zhǒngzi', 'seed'), cl: C.ke, t: [35, 35, 35], ...item },
  { w: w('苗', 'miáo', 'sprout'), cl: C.ke2, t: [36, 36, 36], plant: true },
  { w: w('小麦', 'xiǎomài', 'wheat'), cl: C.ke2, t: [37, 37, 37], plant: true },
  { w: w('面包', 'miànbāo', 'bread'), cl: C.ge, t: [38, 38, 38], ...item },
  { w: w('蛋糕', 'dàngāo', 'cake'), cl: C.kuai, t: [39, 39, 39], ...item },
  { w: w('烤鱼', 'kǎoyú', 'grilled fish'), cl: C.tiao, t: [40, 40, 40], ...item },
  { w: w('门', 'mén', 'door'), cl: C.shan, t: [16, 21, 16], shape: [[0, 0, 0, 0.2, 1, 1]] }, // open: swung aside, walk through
  { w: w('雪', 'xuě', 'snow'), cl: C.kuai, t: [41, 41, 41], ...full },
  { w: w('羊毛', 'yángmáo', 'wool'), cl: C.tuan, t: [42, 42, 42], ...full },
  { w: w('红布', 'hóngbù', 'red cloth'), cl: C.kuai, t: [43, 43, 43], ...full },
  { w: w('黄布', 'huángbù', 'yellow cloth'), cl: C.kuai, t: [44, 44, 44], ...full },
  { w: w('蓝布', 'lánbù', 'blue cloth'), cl: C.kuai, t: [45, 45, 45], ...full },
  { w: w('宝箱', 'bǎoxiāng', 'treasure chest'), cl: C.ge, t: [16, 46, 16], ...full },
  { w: w('树苗', 'shùmiáo', 'sapling'), cl: C.ke2, t: [47, 47, 47], plant: true },
  { w: w('仙人掌', 'xiānrénzhǎng', 'cactus'), cl: C.ke2, t: [48, 48, 48], plant: true },
  { w: w('信', 'xìn', 'letter'), cl: C.feng, t: [49, 49, 49], ...item },
  { w: w('煤', 'méi', 'coal'), cl: C.kuai, t: [50, 50, 50], ...full },
  { w: w('铁', 'tiě', 'iron'), cl: C.kuai, t: [51, 51, 51], ...full },
  { w: w('炉子', 'lúzi', 'stove'), cl: C.ge, t: [53, 52, 3], ...full },
  { w: w('书架', 'shūjià', 'bookshelf'), cl: C.ge, t: [16, 54, 16], ...full },
  { w: w('窗户', 'chuānghu', 'window'), cl: C.shan, t: [55, 55, 55], solid: true },
  { w: w('路', 'lù', 'path, road'), cl: C.tiao, t: [56, 56, 2], ...full },
]

export const WEEK = ['一', '二', '三', '四', '五', '六', '日'].map((d, i) =>
  w('星期' + d, 'xīngqī ' + (i < 6 ? NUM[i + 1].py : 'rì'), ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]))
/** "八点", "两点": the hour on a 12-hour clock (the time of day word goes in front) */
export const oclock = (hour: number): Part[] => { const h = Math.floor(hour) % 12 || 12; return [countNum(h), V.oclock] }

/** the game clock, from seconds played: 20 s an hour, 8 min a day, starting at eight on Monday morning */
export const hourOf = (clock: number) => (8 + clock / 20) % 24
/** seconds of play from now until the clock next shows that hour */
export const untilHour = (clock: number, hour: number) => ((24 + hour - hourOf(clock)) % 24) * 20
/** villagers and animals sleep from nine at night until five */
export const bedtime = (hour: number) => hour >= 21 || hour < 5
/** days since the first Monday: 0 on the first day */
export const dayOf = (clock: number) => Math.floor((160 + clock) / 480)
/** the part of the day an hour falls in: 早上, 中午 … */
export const period = (h: number) => h < 5 ? V.dawn : h < 9 ? V.morning : h < 12 ? V.forenoon : h < 13 ? V.noon : h < 18 ? V.afternoon : V.evening

// eight compass points, clockwise from north (-z); east is +x
export const DIRS = [V.north, w('东北', 'dōngběi', 'northeast'), V.east, w('东南', 'dōngnán', 'southeast'),
  V.south, w('西南', 'xīnán', 'southwest'), V.west, w('西北', 'xīběi', 'northwest')]
export const dirTo = (dx: number, dz: number) => DIRS[(Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8]

export const ALL_WORDS: Word[] = [...WEEK, ...BLOCKS.slice(1).filter((_, i) => i + 1 !== DOOR_OPEN).map(b => b.w), ...Object.values(V), ...DIRS.filter((_, i) => i % 2), ...NUM]

/** size words a species never takes: 大鸡 and 大鸟 read as slang for genitals, 小熊猫 is the red panda */
export const NO_SIZE = new Map<Word, Word>([[V.chicken, V.big], [V.bird, V.big], [V.panda, V.small]])
/** pets saved before NO_SIZE (key = kind + size, e.g. 鸡大) become the plain kind, one per key */
export const migratePets = (keys: string[]) => [...new Set(keys.map(k => [...NO_SIZE].find(([a, z]) => k === a.hz + z.hz)?.[0].hz ?? k))]

// --- progress (localStorage) ---
interface Save { ach?: string[]; welcomed?: boolean; dayFrom?: { words: number; done: number; money: number; met?: string[] }; did: Record<string, number>; base: Record<string, number>; notes: string[]; letters: Record<string, 1>; read: number[]; won: boolean; placed: Record<number, 1>; home?: number[]; world: number; chest: boolean; pets: string[]; rank: number; clock: number; opts: { py: number; en: number; voice: number; ear: number; look: number; invert: number; music: number; ui: number; lang: number }; pos?: number[]; crops: Record<number, number>; seen: Record<string, number>; quests: Record<string, number>; track: string; money: number; inv: Record<number, number>; edits: Record<number, number> }
export const state: Save = (() => {
  const fresh: Save = { did: {}, base: {}, notes: [], letters: {}, read: [], won: false, placed: {}, world: 0, chest: false, pets: [], rank: 0, clock: 0, opts: { py: 0, en: 0, voice: 0, ear: 0, look: 0, invert: 0, music: 0, ui: 0, lang: 0 }, crops: {}, seen: {}, quests: {}, track: 'teacher', money: 0, inv: {}, edits: {} }
  try {
    const old = JSON.parse(localStorage.getItem('cubedao') ?? '{}')
    if (old.quest) { old.quests = { teacher: old.quest }; delete old.quest } // v1 save
    if (old.pets) old.pets = migratePets(old.pets)
    return { ...fresh, ...old, opts: { ...fresh.opts, ...old.opts } }
  } catch { return fresh }
})()
export const persist = () => { try { localStorage.setItem('cubedao', JSON.stringify(state)) } catch { /* private mode: play without saving */ } }

export const see = (word: Word, n = 1) => { state.seen[word.hz] = (state.seen[word.hz] ?? 0) + n }
/** a wrong answer: the word counts as met n times fewer, so its pinyin and English can come back; a word you have met
 * stays met (at 1), or it would leave the dictionary and the review pool just when it needs reviewing */
export const forget = (word: Word, n: number) => { const c = state.seen[word.hz] ?? 0; state.seen[word.hz] = Math.max(Math.min(c, 1), c - n) }
// 0 = new (hanzi + pinyin + English), 1 = familiar (hanzi + pinyin), 2 = mastered (hanzi only)
export const level = (word: Word) => { const c = state.seen[word.hz] ?? 0; return c < 4 ? 0 : c < 12 ? 1 : 2 }

// --- tones: split pinyin into syllables so every character can be coloured by its tone ---
const VOW = 'aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
// initial consonants + vowels + a final n/ng/r that is not the start of the next syllable
const SYL = new RegExp(`[^${VOW}\\s]*[${VOW}]+(?:ng(?![${VOW}])|n(?![${VOW}])|r(?![${VOW}]))?`, 'g')
const MARKS = ['āēīōūǖ', 'áéíóúǘ', 'ǎěǐǒǔǚ', 'àèìòùǜ']
/** [syllable, tone 1-5] per character; 5 = neutral */
export function syllables(py: string): [string, number][] {
  return (py.match(SYL) ?? []).map(s => [s, MARKS.findIndex(m => [...s].some(ch => m.includes(ch))) + 1 || 5])
}

// --- components: the part of a character that hints at its meaning, for the single characters the game teaches ---
const RADICALS: [string, string, string][] = [ // [component, what it means, characters that carry it]
  ['扌', 'hand', '挖找拔摘把'], ['手', 'hand', '拿'], ['口', 'mouth', '吃喝吗叫喵哞咩'], ['氵', 'water', '海渴'], ['讠', 'speech', '请说读词谁'],
  ['木', 'tree, wood', '树棵根'], ['犭', 'animal', '猫狗猪'], ['艹', 'plant', '草花苗'], ['亻', 'person', '你他住做'],
  ['钅', 'metal', '钱铁镐'], ['日', 'sun', '晴'], ['雨', 'rain', '雪'], ['冫', 'ice', '冷'], ['灬', 'fire', '热熟'], ['火', 'fire', '煤'],
  ['饣', 'food', '饿'], ['足', 'foot', '跑跳'], ['目', 'eye', '看'], ['忄', 'feeling', '怕'], ['纟', 'thread', '纸'], ['土', 'earth', '块堆'],
  ['鸟', 'bird', '鸡'], ['马', 'horse', '骑'], ['宀', 'roof', '家'],
]
/** "扌 hand" for 挖; empty for words of several characters or without a listed component */
export const radical = (hz: string) => { const r = RADICALS.find(x => x[2].includes(hz)); return r && [...hz].length === 1 ? `${r[0]} ${t(r[1])}` : '' }

export function html(word: Word) {
  const syl = syllables(word.py), chars = [...word.hz]
  const ruby = syl.length === chars.length
    ? chars.map((ch, i) => `<ruby class="t${syl[i][1]}">${ch}<rt>${syl[i][0]}</rt></ruby>`).join('')
    : `<ruby>${word.hz}<rt>${word.py}</rt></ruby>`
  const rad = radical(word.hz)
  return `<span class="w l${level(word)}">${ruby}<span class="en"> ${word.en}${rad ? ` <i class="rad">${rad}</i>` : ''}</span></span>`
}

/** 0..99 999 999 as Chinese numerals: 一百零五, 一千零一十五, 两千, 三万两千 */
export function cn(n: number): string {
  n = Math.max(0, Math.min(Math.floor(n), 99999999))
  const d = (i: number) => NUM[i].hz
  if (n <= 10) return d(n)
  if (n < 20) return '十' + d(n % 10)
  if (n < 100) return d(n / 10 | 0) + '十' + (n % 10 ? d(n % 10) : '')
  // after 百, 千 or 万: a gap of a whole place is said 零, and a lone ten is 一十 (一百一十, 一千零一十五)
  const tail = (r: number, unit: number) => !r ? '' : r < unit / 10 ? '零' + (r < 20 && r >= 10 ? '一' : '') + cn(r) : (r < 20 ? '一' : '') + cn(r)
  if (n < 1000) return d(n / 100 | 0) + '百' + tail(n % 100, 100)
  const lead = (k: number) => k === 2 ? '两' : cn(k) // 两千, 两万: a single 2 before 千 and 万 is 两
  if (n < 10000) return lead(n / 1000 | 0) + '千' + tail(n % 1000, 1000)
  return lead(n / 10000 | 0) + '万' + tail(n % 10000, 10000)
}

// --- counting, quests, crafting ---
export type Part = Word | string
/** the numeral that goes before a measure word: 两, not 二 */
export function countNum(n: number): Word { return n === 2 ? V.two : numWord(n) }
/** "三块木头": number + measure word + noun */
export const count = (n: number, id: number): Part[] => [countNum(n), BLOCKS[id].cl, BLOCKS[id].w]
/** any number as a word, with spaced pinyin so each syllable keeps its tone */
export function numWord(n: number): Word {
  if (n <= 10) return NUM[n]
  const hz = cn(n)
  return { hz, py: [...hz].map(ch => ({ 百: 'bǎi', 千: 'qiān', 万: 'wàn', 两: 'liǎng' } as Record<string, string>)[ch] ?? NUM.find(x => x.hz === ch)!.py).join(' '), en: String(n) }
}
/** "五块钱": a price. 块 is the everyday word for yuan. */
export const price = (n: number): Part[] => [countNum(n), V.kuai, V.money]

// --- the merchant: [item, price] ---
export const SHOP: Record<'buy' | 'sell', [number, number][]> = {
  buy: [[SEEDS, 2], [SAPLING, 3], [BRICK, 3], [TILE, 4], [GLASS, 5], [LANTERN, 12], [PICKAXE, 15], [ROD, 18], [GOLD, 45]],
  sell: [[FLOWER, 1], [YFLOWER, 1], [BFLOWER, 1], [PLANK, 1], [APPLE, 2], [EGG, 3], [FISH, 4], [MILK, 4], [CHAIR, 6], [TABLE, 8], [BOOK, 11], [BREAD, 5], [GRILLED, 7], [CAKE, 14], [WOOL, 3], [RCLOTH, 6], [YCLOTH, 6], [BCLOTH, 6], [COAL, 2], [IRON, 5], [GOLD, 20]],
}
export function trade(kind: 'buy' | 'sell', i: number) {
  const [id, cost] = SHOP[kind][i], have = state.inv[id] ?? 0
  if (kind === 'buy' ? state.money < cost : have < 1) return false
  state.money += kind === 'buy' ? -cost : cost
  state.inv[id] = have + (kind === 'buy' ? 1 : -1)
  return true
}

// --- chatting with the friend: questions about the world as it is right now ---
export interface Line { parts: Part[]; en: string }
export interface Chat { ask: Line; icon?: number; options: Line[]; answer: number }
/** ctx: the current time-of-day word, whether it rains, and the compass word towards a villager (undefined when next to them) */
export function chat(ctx: { period: Word; wet: boolean; hour: number; day: number; dirTo: (k: string) => Word | undefined }, rand = Math.random): Chat {
  const pick = <T>(a: T[]) => a[Math.floor(rand() * a.length)]
  const L = (en: string, ...parts: Part[]): Line => ({ parts, en })
  const things = [WOOD, STONE, APPLE, FISH, FLOWER, EGG, PLANK, SEEDS, BAMBOO, MILK]
  const kinds: (() => [Line, Line, Line[], number?] | undefined)[] = [
    () => [L(t('How are you?'), V.you, V.good, V.ma, '？'), L(t("I'm very well, thanks."), V.me, V.very, V.good, '，', V.thanks, '。'),
      [L(t('I am wood.'), V.me, V.am, BLOCKS[WOOD].w, '。'), L(t('Goodbye!'), V.bye, '！')]],
    () => [L(t("What's your name?"), V.you, V.call, V.what, V.name, '？'), L(t('My name is Xiao Fang.'), V.me, V.call, V.xiaofang, '。'),
      [L(t("I'm very well."), V.me, V.very, V.good, '。'), L(t("You're welcome."), V.welcome, '。')]],
    () => [L(t('Thank you!'), V.thanks, V.you, '！'), L(t("You're welcome."), V.welcome, '。'), [L(t('Hello!'), V.hello, '！'), L(t("I'm hungry."), V.me, V.hungry, V.le, '。')]],
    () => [L(t('Goodbye!'), V.bye, '！'), L(t('Goodbye!'), V.bye, '！'), [L(t('Hello!'), V.hello, '！'), L(t('Thanks.'), V.thanks, '。')]],
    () => {
      const p = pick([V.morning, V.afternoon, V.evening]), yes = L(t('Yes.'), V.am, '。'), no = L(t('No.'), V.not, V.am, '。')
      return [L(t('Is it {0} now?', p.en), V.now, V.am, p, V.ma, '？'), p === ctx.period ? yes : no, [p === ctx.period ? no : yes, L(t('Thanks.'), V.thanks, '。')]]
    },
    () => {
      const yes = L(t("It's raining."), V.rain, V.le, '。'), no = L(t("It isn't raining."), V.notHave, V.rain, '。')
      return [L(t('Is it raining?'), V.rain, V.le, V.ma, '？'), ctx.wet ? yes : no, [ctx.wet ? no : yes, L(t("You're welcome."), V.welcome, '。')]]
    },
    () => {
      const it = BLOCKS[pick(things)].w, id = BLOCKS.findIndex(b => b.w === it)
      const yes = L(t('I have {0}.', it.en), V.me, V.have, it, '。'), no = L(t("I don't have {0}.", it.en), V.me, V.notHave, it, '。')
      return [L(t('Do you have {0}?', it.en), V.you, V.have, it, V.ma, '？'), state.inv[id] ? yes : no, [state.inv[id] ? no : yes, L(t('I am {0}.', it.en), V.me, V.am, it, '。')], id]
    },
    () => {
      const m = state.money
      const say = (n: number) => n ? L(t('I have {0} yuan.', n), V.me, V.have, ...price(n), '。') : L(t('I have no money.'), V.me, V.notHave, V.money, '。')
      return [L(t('How much money do you have?'), V.you, V.have, V.howMuch, V.money, '？'), say(m), [say(m + 1), say(m + 3)]]
    },
    () => {
      const [a, b, c] = [...things].sort(() => rand() - 0.5), say = (id: number) => L(t('This is {0}.', BLOCKS[id].w.en), V.this, V.am, BLOCKS[id].w, '。')
      return [L(t('What is this?'), V.this, V.am, V.what, '？'), say(a), [say(b), say(c)], a]
    },
    () => {
      const [a, ...rest] = [...FOOD.keys()].sort(() => rand() - 0.5), say = (id: number) => L(t('The {0} eats {1}.', a.en, BLOCKS[id].w.en), a, V.eat, BLOCKS[id].w, '。')
      const wrong = [...new Set(rest.map(x => FOOD.get(x)!))].filter(id => id !== FOOD.get(a)).slice(0, 2)
      return [L(t('What does the {0} eat?', a.en), a, V.eat, V.what, '？'), say(FOOD.get(a)!), wrong.map(say)]
    },
    () => {
      const k = pick(Object.keys(NPCS)), who = NPCS[k].w, d = ctx.dirTo(k)
      if (!d) return undefined
      const say = (x: Word) => L(t('The {0} is to the {1}.', who.en, x.en), who, V.at, x, V.side, '。'), i = DIRS.indexOf(d)
      return [L(t('Where is the {0}?', who.en), who, V.at, V.where, '？'), say(d), [say(DIRS[(i + 3) % 8]), say(DIRS[(i + 5) % 8])]]
    },
    () => {
      const a = 1 + Math.floor(rand() * 5), b = 1 + Math.floor(rand() * 5), say = (n: number) => L(String(n), NUM[n], '。')
      return [L(`${a} + ${b} = ?`, NUM[a], V.plus, NUM[b], V.equals, V.howMany, '？'), say(a + b), [say(a + b - 1), say(a + b === 10 ? 8 : a + b + 1)]]
    },
    () => {
      const say = (h: number) => L(t("It's {0} o'clock now.", Math.floor(h) % 12 || 12), V.now, ...oclock(h), '。')
      return [L(t('What time is it now?'), V.now, V.howMany, V.oclock, '？'), say(ctx.hour), [say(ctx.hour + 2), say(ctx.hour + 5)]]
    },
    () => { // 什么颜色: the picture is a flower, cloth or wool
      const [id, col] = pick<[number, Word]>([[FLOWER, V.red], [YFLOWER, V.yellow], [BFLOWER, V.blue], [RCLOTH, V.red], [YCLOTH, V.yellow], [BCLOTH, V.blue], [WOOL, V.white], [SNOW, V.white]])
      const say = (x: Word) => L(t('This is {0}.', x.en), V.this, V.am, x, V.de, '。')
      return [L(t('What colour is this?'), V.this, V.am, V.what, V.colour, V.de, '？'), say(col), [V.red, V.yellow, V.blue, V.white].filter(x => x !== col).slice(0, 2).map(say), id]
    },
    () => { // 住在哪里
      const [who, place, at] = pick<[Word, Word, string]>([[V.penguin, PLACES.snow, 'on'], [V.camel, PLACES.desert, 'on'], [V.teacher, PLACES.teacher, 'at'], [V.farmer, PLACES.farmer, 'on']])
      const say = (x: Word) => L(at === 'on' ? t('The {0} lives on the {1}.', who.en, x.en) : t('The {0} lives at the {1}.', who.en, x.en), who, V.live, V.at, x, '。')
      const wrong = [PLACES.snow, PLACES.desert, PLACES.teacher, PLACES.farmer, PLACES.fisher, PLACES.merchant].filter(x => x !== place).sort(() => rand() - 0.5).slice(0, 2)
      return [L(t('Where does the {0} live?', who.en), who, V.live, V.at, V.where, '？'), say(place), wrong.map(say)]
    },
    () => { // 谁: who wants what
      const pairs: [Word, Word][] = [[V.cat, BLOCKS[FISH].w], [V.panda, BLOCKS[BAMBOO].w], [V.pig, BLOCKS[APPLE].w], [V.camel, BLOCKS[CACTUS].w]]
      const [who, food] = pick(pairs), say = (x: Word) => L(t('The {0} eats {1}.', x.en, food.en), x, V.eat, food, '。')
      return [L(t('Who eats {0}?', food.en), V.who, V.eat, food, '？'), say(who), pairs.map(p => p[0]).filter(x => x !== who).slice(0, 2).map(say)]
    },
    () => {
      const say = (d: number) => L(t('Today is {0}.', WEEK[d % 7].en), V.today, WEEK[d % 7], '。')
      return [L(t('What day is it today?'), V.today, V.whichDay, '？'), say(ctx.day), [say(ctx.day + 2), say(ctx.day + 4)]]
    },
  ]
  for (;;) {
    const made = pick(kinds)()
    if (!made) continue
    const [ask, right, wrong, icon] = made, options = [right, ...wrong]
    for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [options[i], options[j]] = [options[j], options[i]] }
    return { ask, icon, options, answer: options.indexOf(right) }
  }
}

/** ranks by number of words met: [words needed, title] */
export const RANKS: [number, Word][] = [
  [0, w('游客', 'yóukè', 'visitor')], [10, w('新手', 'xīnshǒu', 'beginner')], [25, w('学生', 'xuésheng', 'student')],
  [50, w('岛民', 'dǎomín', 'islander')], [90, w('高手', 'gāoshǒu', 'expert')], [140, w('大师', 'dàshī', 'master')],
]
export const known = () => ALL_WORDS.filter(x => state.seen[x.hz] >= 1).length
export const rank = (n = known()) => RANKS.reduce((best, r, i) => n >= r[0] ? i : best, 0)

/** a word to test: any word you have met, the less familiar the likelier */
export function reviewWord(rand = Math.random): Word {
  const seen = ALL_WORDS.filter(x => state.seen[x.hz] >= 1), pool = seen.length >= 4 ? seen : ALL_WORDS
  const weight = (x: Word) => 1 / (1 + (state.seen[x.hz] ?? 0))
  let r = rand() * pool.reduce((sum, x) => sum + weight(x), 0)
  return pool.find(x => (r -= weight(x)) <= 0) ?? pool[0]
}

// the dictionary's search box: matches characters, pinyin with or without tone marks or spaces, or English; ü can be typed v or u
export const searchKey = (w: Word) => { const bare = w.py.replace(/[ǖǘǚǜü]/g, 'v').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return `${w.hz} ${w.py} ${w.py.replace(/ /g, '')} ${bare} ${bare.replace(/ /g, '')} ${bare.replace(/v/g, 'u')} ${w.en}`.toLowerCase().replace(/ü/g, 'v') } // as the query: so a German or Spanish gloss with ü (fünf, pingüino) is found too
export const searchHit = (key: string, query: string) => { const q = query.toLowerCase().trim().replace(/ü/g, 'v'); return key.includes(q) || key.includes(q.replace(/ /g, '')) }

// typing pinyin: "ni3 hao3", "nǐhǎo" and "ni3hao3" are the same answer; "ni hao" has the letters but not the tones
const BARE: Record<string, string> = Object.fromEntries(['aāáǎà', 'eēéěè', 'iīíǐì', 'oōóǒò', 'uūúǔù', 'vǖǘǚǜ'].flatMap(g => [...g].slice(1).map(ch => [ch, g[0]])))
const numbered = (py: string) => syllables(py).map(([s, t]) => [...s].map(ch => BARE[ch] ?? ch).join('').replace('ü', 'v') + (t < 5 ? t : '')).join('')
export function checkPinyin(input: string, word: Word): 'right' | 'tones' | 'wrong' {
  const lower = input.toLowerCase().replace(/u:|ü/g, 'v').replace(/[‘’]/g, "'"), clean = lower.replace(/[\s'5]/g, '')
  // tone marks: split into syllables while the spaces are still there ("qǐ é" is two syllables, "qǐé" would read as one)
  const typed = /\d/.test(clean) || !/[^a-z]/.test(clean) ? clean : numbered(lower.replace(/'/g, ' ')), want = numbered(word.py)
  return typed === want ? 'right' : typed.replace(/\d/g, '') === want.replace(/\d/g, '') ? 'tones' : 'wrong'
}

// --- the blackboard exam: hear a word and pick its characters, or read it and pick its meaning ---
export interface Question { word: Word; listen: boolean; options: string[]; answer: number }
export function question(rand = Math.random): Question {
  const pick = (a: Word[]) => a[Math.floor(rand() * a.length)]
  const word = reviewWord(rand), listen = rand() < 0.5, opts = [word]
  while (opts.length < 4) { const o = pick(ALL_WORDS); if (!opts.some(x => x.hz === o.hz || x.en === o.en || x.py === o.py)) opts.push(o) } // no twins or homophones
  for (let i = 3; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]] }
  return { word, listen, options: opts.map(x => listen ? x.hz : x.en), answer: opts.indexOf(word) }
}

// Each villager asks in a different sentence pattern. c = count(n, item), it = the noun alone.
const COLOR = new Map<Word, Word>() // cloth block -> its colour word, filled below
export interface Npc {
  // an ask is [item, amount] to fetch, or an animal to go and find (click the right one), optionally a big or small one
  // … or a letter to carry to another villager, or something to do a number of times (see ACTS)
  w: Word; asks: ([number, number] | Word | { size: Word; find: Word } | { deliver: string } | { act: string; n: number })[]; rewards: number[]; look: number[] // shirt, trousers, hat
  say: (c: Part[], it: Word) => Part[]; en: (n: number, it: Word) => string
}
export const NPCS: Record<string, Npc> = {
  teacher: {
    w: V.teacher, look: [0xc0392b, 0x2c4a8a, 0x1a1a1a],
    asks: [[WOOD, 2], V.pig, [FLOWER, 5], V.panda, [STONE, 4], { size: V.small, find: V.cat }, [BAMBOO, 3], { size: V.big, find: V.cow }, [BOOK, 1], V.chicken,
      [BFLOWER, 4], { size: V.small, find: V.sheep }, [DIRT, 6], { size: V.big, find: V.dog }, [LEAVES, 9], V.penguin, V.camel, { act: 'read', n: 1 }],
    rewards: [BRICK, LANTERN, GLASS, TILE, GOLD],
    say: c => [V.hello, '！', V.please, V.give, V.me, ...c, '。'],
    en: (n, it) => t('Hello! Please give me {0} × {1}.', n, it.en),
  },
  carpenter: {
    w: V.carpenter, look: [0x8a5a36, 0x444444, 0xe0b030],
    asks: [[PLANK, 4], [STICK, 6], { deliver: 'tailor' }, [TABLE, 1], [CHAIR, 2], [DOOR, 1], [BED, 1], [SHELF, 1], { act: 'lamp', n: 2 }],
    rewards: [GLASS, BRICK, TILE, LANTERN],
    say: c => [V.you, V.have, ...c, V.ma, '？'],
    en: (n, it) => t('Do you have {0} × {1}?', n, it.en),
  },
  farmer: {
    w: V.farmer, look: [0x3c8c32, 0x6b4a2a, 0xe3d49a],
    asks: [[APPLE, 3], [EGG, 2], { deliver: 'cook' }, [MILK, 2], [YFLOWER, 6], [APPLE, 5], [MILK, 3], { act: 'plant', n: 3 }],
    rewards: [LANTERN, GOLD, BRICK],
    say: c => [V.me, V.want, ...c, '。'],
    en: (n, it) => t('I would like {0} × {1}.', n, it.en),
  },
  fisher: {
    w: V.fisher, look: [0x2a6edc, 0x777777, 0xffffff],
    asks: [[ROD, 1], [FISH, 2], [BOAT, 1], [FISH, 5], { act: 'fish', n: 3 }],
    rewards: [TILE, GLASS, GOLD],
    say: (c, it) => [V.me, V.notHave, it, '。', V.please, V.give, V.me, ...c, '。'],
    en: (n, it) => t("I don't have any {1}. Please give me {0}.", n, it.en),
  },
  smith: { // what the mountain hides: coal, iron, gold
    w: V.smith, look: [0x444444, 0x222222, 0x8a5a36],
    asks: [[COAL, 3], [IRON, 2], [COAL, 5], [GOLD, 1], [IRON, 4], { act: 'mine', n: 5 }],
    rewards: [LANTERN, GLASS, TILE, BRICK],
    say: c => [V.you, V.able, V.give, V.me, ...c, V.ma, '？'],
    en: (n, it) => t('Can you give me {0} × {1}?', n, it.en),
  },
  tailor: { // colours, and 的 to attach them: 红色的布
    w: V.tailor, look: [0xd98ad0, 0x444444, 0x7b1fa2],
    asks: [[RCLOTH, 1], { deliver: 'fisher' }, [BCLOTH, 2], [YCLOTH, 2]],
    rewards: [GOLD, LANTERN, TILE],
    say: (c, it) => [V.me, V.like, COLOR.get(it)!, '。', V.please, V.give, V.me, c[0], c[1], COLOR.get(it)!, V.de, V.cloth, '。'],
    en: (n, it) => t('I like {2}. Please give me {0} × {1}.', n, it.en, COLOR.get(it)!.en),
  },
  explorer: { // on the snow island: warm things
    w: V.explorer, look: [0x2a6edc, 0x333333, 0xd42a20],
    asks: [[WOOL, 2], [GRILLED, 2], [RCLOTH, 2], [BED, 1], { deliver: 'traveller' }, { act: 'feed', n: 2 }],
    rewards: [GOLD, GLASS, LANTERN],
    say: c => [V.me, V.very, V.cold, '。', V.please, V.give, V.me, ...c, '。'],
    en: (n, it) => t("I'm very cold. Please give me {0} × {1}.", n, it.en),
  },
  traveller: { // on the sand island: something to drink, something to eat
    w: V.traveller, look: [0xe3d49a, 0x8a5a36, 0xf4f4f4],
    asks: [[MILK, 2], [APPLE, 3], [MILK, 3], [BREAD, 2], { act: 'ride', n: 1 }],
    rewards: [GOLD, TILE, BRICK],
    say: (c, it) => [V.me, V.very, it === BLOCKS[MILK].w ? V.thirsty : V.hungry, '。', V.you, V.have, ...c, V.ma, '？'],
    en: (n, it) => t(it === BLOCKS[MILK].w ? "I'm very thirsty. Do you have {0} × {1}?" : "I'm very hungry. Do you have {0} × {1}?", n, it.en),
  },
  cook: {
    w: V.cook, look: [0xf4f4f4, 0x333333, 0xf4f4f4],
    asks: [[BREAD, 1], [GRILLED, 2], { deliver: 'teacher' }, [CAKE, 1], [BREAD, 3], { act: 'drink', n: 1 }],
    rewards: [GOLD, LANTERN, GLASS],
    say: c => [V.me, V.hungry, V.le, '。', V.please, V.give, V.me, ...c, '。'],
    en: (n, it) => t("I'm hungry. Please give me {0} × {1}.", n, it.en),
  },
}

COLOR.set(BLOCKS[RCLOTH].w, V.red).set(BLOCKS[YCLOTH].w, V.yellow).set(BLOCKS[BCLOTH].w, V.blue)

// 把 again, as the marker for the thing being acted on; kept out of V so the dictionary lists the character once
const BA = w('把', 'bǎ', '(marks the thing you act on)')

/** things a villager can ask you to do, as verb phrases: 请种三颗种子。 */
const ACTS: Record<string, (n: number) => [Part[], string]> = {
  plant: n => [[V.plant, ...count(n, SEEDS)], t('Please plant {0} seeds.', n)],
  fish: n => [[V.angle, ...count(n, FISH)], t('Please catch {0} fish.', n)],
  feed: n => [[V.feed, V.penguin, ...count(n, FISH)], t('Please feed a penguin {0} fish.', n)],
  read: n => [[V.read, ...count(n, BOOK)], t('Please read {0} book.', n)],
  ride: () => [[V.ride, V.camel], t('Please ride a camel.')],
  mine: n => [[V.dig, ...count(n, STONE)], t('Please dig {0} stone.', n)],
  drink: n => [[V.drink, ...count(n, MILK)], t('Please drink {0} glass of milk.', n)],
  lamp: n => [[V.put, ...count(n, LANTERN)], t('Please put down {0} lanterns.', n)],
}

/** the second way each villager asks, used on every other lap through their list */
const ALT: Record<string, Pick<Npc, 'say' | 'en'>> = {
  teacher: { say: c => [V.you, V.can, V.give, V.me, ...c, V.ma, '？'], en: (n, it) => t('Can you give me {0} × {1}?', n, it.en) },
  carpenter: { say: c => [V.me, V.require, ...c, '。'], en: (n, it) => t('I need {0} × {1}.', n, it.en) },
  // 有没有: asking by offering both answers
  farmer: { say: (c, it) => [V.you, V.have, V.notHave, it, '？', V.me, V.want, c[0], c[1], '。'], en: (n, it) => t('Do you have any {1}? I would like {0}.', n, it.en) },
  fisher: { say: c => [V.me, V.want, ...c, '。', V.thanks, '！'], en: (n, it) => t('I would like {0} × {1}. Thank you!', n, it.en) },
  smith: { say: (c, it) => [V.me, V.notHave, it, V.le, '。', V.please, V.give, V.me, ...c, '。'], en: (n, it) => t("I'm out of {1}. Please give me {0}.", n, it.en) },
  tailor: { say: (c, it) => [V.you, V.have, c[0], c[1], COLOR.get(it)!, V.de, V.cloth, V.ma, '？'], en: (n, it) => t('Do you have {0} × {1}?', n, it.en) },
  explorer: { say: c => [V.here, V.very, V.cold, '！', V.me, V.require, ...c, '。'], en: (n, it) => t("It's very cold here! I need {0} × {1}.", n, it.en) },
  traveller: { say: (c, it) => [V.here, V.very, V.hot, '！', V.me, V.wantTo, it === BLOCKS[MILK].w ? V.drink : V.eat, ...c, '。'], en: (n, it) => t(it === BLOCKS[MILK].w ? "It's very hot here! I want to drink {0} × {1}." : "It's very hot here! I want to eat {0} × {1}.", n, it.en) },
  cook: { say: c => [V.me, V.very, V.hungry, '。', V.me, V.wantTo, V.eat, ...c, '。'], en: (n, it) => t("I'm very hungry. I want to eat {0} × {1}.", n, it.en) },
}

export function quest(key: string, i = state.quests[key] ?? 0) {
  const npc = NPCS[key], ask = npc.asks[i % npc.asks.length], reward = npc.rewards[i % npc.rewards.length]
  if (!Array.isArray(ask) && 'act' in ask) { // do something yourself: act() counts it, did() reads it
    const [parts, en] = ACTS[ask.act](ask.n)
    return { find: undefined, size: undefined, deliver: undefined, act: ask.act as string | undefined, item: 0, n: ask.n, reward, parts: [V.please, ...parts, '。'] as Part[], en }
  }
  if (!Array.isArray(ask) && 'deliver' in ask) { // 把 puts the thing being handled before the verb: 请把这封信给裁缝
    const to = NPCS[ask.deliver].w
    return {
      find: undefined, size: undefined, deliver: ask.deliver as string | undefined, act: undefined, item: 0, n: 0, reward,
      parts: [V.please, BA, V.this, V.feng, BLOCKS[LETTER].w, V.give, to, '。'] as Part[], en: t('Please take this letter to the {0}.', to.en),
    }
  }
  if (!Array.isArray(ask)) {
    const find = 'hz' in ask ? ask : ask.find, size = 'hz' in ask ? undefined : ask.size
    return {
      find: find as Word | undefined, size, deliver: undefined, act: undefined, item: 0, n: 0, reward,
      // 头 counts big animals, 只 the rest
      parts: [V.please, V.find, NUM[1], find === V.pig || find === V.cow || find === V.camel ? V.tou : V.zhi, ...(size ? [size] : []), find, '。'] as Part[],
      en: size ? t('Please find a {0} {1}.', size.en, find.en) : t('Please find a {0}.', find.en),
    }
  }
  const [item, base] = ask, it = BLOCKS[item].w
  const lap = Math.floor(i / npc.asks.length), form = lap % 2 ? ALT[key] : npc
  const n = Math.min(10, base + lap) // each lap asks for one more
  return { find: undefined, size: undefined, deliver: undefined, act: undefined, item, n, reward, parts: form.say(count(n, item), it), en: form.en(n, it) }
}

/** what each animal eats: feeding teaches 猫吃鱼 / 猪不吃竹子 */
export const FOOD = new Map<Word, number>([[V.pig, APPLE], [V.panda, BAMBOO], [V.cat, FISH], [V.chicken, LEAVES], [V.cow, GRASS], [V.sheep, GRASS], [V.dog, FISH], [V.penguin, FISH], [V.camel, CACTUS]])
/** blocks that give off lamp light, and how far it reaches */
export const LAMPS: Record<number, number> = { [LANTERN]: 15, [STOVE]: 12 }

/** the verb for removing each kind of block; anything else is dug (挖) */
export const VERBS = new Map<number, Word>([
  [WOOD, V.chop], [BAMBOO, V.chop], [CACTUS, V.chop], [LEAVES, V.pick], [FLOWER, V.pick], [YFLOWER, V.pick], [BFLOWER, V.pick], [WHEAT, V.cut], [SPROUT, V.pull],
  ...[TABLE, CHAIR, DOOR, DOOR_OPEN, BED, LANTERN, GLASS, STOVE, SHELF, WINDOW, WOOL, RCLOTH, YCLOTH, BCLOTH, PLANK, BRICK, TILE].map(id => [id, V.take] as [number, Word]),
])
/** things you can eat or drink, with their verb */
export const EDIBLE = new Map<number, Word>([[APPLE, V.eat], [BREAD, V.eat], [CAKE, V.eat], [GRILLED, V.eat], [MILK, V.drink]])

/** what each animal says */
export const SOUNDS = new Map<Word, Word>([
  [V.cat, w('喵', 'miāo', 'meow')], [V.dog, w('汪汪', 'wāngwāng', 'woof')], [V.pig, w('哼哼', 'hēnghēng', 'oink')],
  [V.chicken, w('咯咯', 'gēgē', 'cluck')], [V.cow, w('哞', 'mōu', 'moo')], [V.sheep, w('咩', 'miē', 'baa')], [V.bird, w('叽叽', 'jījī', 'tweet')],
])
ALL_WORDS.push(...SOUNDS.values())
/** what clicking an animal gives you (with a cooldown) */
export const DROPS = new Map<Word, number>([[V.chicken, EGG], [V.cow, MILK], [V.sheep, WOOL]])

/** the name on each villager's sign; walking up to one announces it */
export const PLACES: Record<string, Word> = {
  teacher: w('学校', 'xuéxiào', 'school'), carpenter: w('木工房', 'mùgōngfáng', 'woodworking shop'), farmer: w('农场', 'nóngchǎng', 'farm'),
  snow: w('雪岛', 'xuědǎo', 'snow island'), desert: w('沙岛', 'shādǎo', 'sand island'),
  smith: w('铁匠铺', 'tiějiangpù', 'smithy'), tailor: w('裁缝店', 'cáifengdiàn', 'tailor shop'), islet: w('小岛', 'xiǎodǎo', 'little island'),
  fisher: w('码头', 'mǎtou', 'pier'), merchant: w('商店', 'shāngdiàn', 'shop'), cook: w('厨房', 'chúfáng', 'kitchen'),
}
ALL_WORDS.push(...Object.values(PLACES))

export const RECIPES: { in: [number, number][]; out: [number, number] }[] = [
  { in: [[WOOD, 1]], out: [PLANK, 4] },
  { in: [[PLANK, 2]], out: [STICK, 4] },
  { in: [[PLANK, 3], [STICK, 2]], out: [PICKAXE, 1] },
  { in: [[PLANK, 3], [STICK, 4]], out: [TABLE, 1] },
  { in: [[PLANK, 2], [STICK, 2]], out: [CHAIR, 1] },
  { in: [[PLANK, 6]], out: [DOOR, 1] },
  { in: [[PLANK, 3], [LEAVES, 3]], out: [BED, 1] },
  { in: [[BAMBOO, 3]], out: [PAPER, 3] },
  { in: [[PAPER, 3]], out: [BOOK, 1] },
  { in: [[BAMBOO, 2], [STICK, 1]], out: [ROD, 1] },
  { in: [[PLANK, 5]], out: [BOAT, 1] },
  { in: [[BAMBOO, 2], [PAPER, 1], [FLOWER, 1]], out: [LANTERN, 1] }, // light for the night
  { in: [[STONE, 6], [COAL, 1]], out: [STOVE, 1] },
  { in: [[PLANK, 4], [BOOK, 2]], out: [SHELF, 1] },
  { in: [[GLASS, 2], [PLANK, 2]], out: [WINDOW, 1] },
  { in: [[WHEAT, 3]], out: [BREAD, 1] },
  { in: [[WOOL, 1], [FLOWER, 1]], out: [RCLOTH, 1] },
  { in: [[WOOL, 1], [YFLOWER, 1]], out: [YCLOTH, 1] },
  { in: [[WOOL, 1], [BFLOWER, 1]], out: [BCLOTH, 1] },
  { in: [[FISH, 1], [STICK, 1]], out: [GRILLED, 1] },
  { in: [[WHEAT, 2], [EGG, 2], [MILK, 1]], out: [CAKE, 1] },
]
const has = (id: number, n: number) => (state.inv[id] ?? 0) >= n
export const canCraft = (i: number) => RECIPES[i].in.every(([id, n]) => has(id, n))
export function craft(i: number) {
  if (!canCraft(i)) return false
  const r = RECIPES[i]
  for (const [id, n] of r.in) state.inv[id] -= n
  state.inv[r.out[0]] = (state.inv[r.out[0]] ?? 0) + r.out[1]
  return true
}

/** count something the player did, for villagers who asked them to do it: 请钓三条鱼 */
export const act = (what: string) => { state.did[what] = (state.did[what] ?? 0) + 1 }
/** un-count it (taking your own lantern back), without pushing anyone's request further away */
export function unact(what: string) {
  state.did[what] = Math.max(0, (state.did[what] ?? 0) - 1)
  for (const k in state.base) if (quest(k).act === what) state.base[k] = Math.min(state.base[k], state.did[what])
}
/** how often the thing a villager asked you to do has been done since they asked */
export const did = (k: string) => Math.max(0, (state.did[quest(k).act ?? ''] ?? 0) - (state.base[k] ?? 0)) // never negative: an un-counted lantern can dip below the baseline
/** can villager k's request be handed in now: done often enough, or the things they asked for in your bag (finding an animal and carrying a letter are answered elsewhere) */
export function ready(k: string) {
  const q = quest(k)
  return q.act ? did(k) >= q.n : !q.deliver && !q.find && (state.inv[q.item] ?? 0) >= q.n
}
/** a villager's request is done: pay the reward and move them on to their next request.
 *  True when that finished every villager's whole list, once: the festival. */
export function complete(k: string): boolean {
  const q = quest(k)
  state.inv[q.reward] = (state.inv[q.reward] ?? 0) + 12
  state.money += 3
  state.quests[k] = (state.quests[k] ?? 0) + 1
  const next = quest(k).act
  if (next) state.base[k] = state.did[next] ?? 0 // their next request is something to do: count from now
  if (quest(k).deliver && !state.letters[k]) { state.seen['把字句'] ??= 1; state.letters[k] = 1; state.inv[LETTER] = (state.inv[LETTER] ?? 0) + 1 } // their next errand is a letter: here it is
  if (state.won || !Object.keys(NPCS).every(n => (state.quests[n] ?? 0) >= NPCS[n].asks.length)) return false
  state.won = true
  return true
}
/** hand villager k a letter someone else gave you for them; returns that sender, whose errand is now done */
export function handOver(k: string) {
  const from = Object.keys(state.letters).find(g => quest(g).deliver === k)
  if (from) { delete state.letters[from]; state.inv[LETTER] = Math.max(0, (state.inv[LETTER] ?? 0) - 1) }
  return from
}

/** requests finished, all villagers together */
export const done = () => Object.values(state.quests).reduce((a, b) => a + b, 0)
// achievements (成就): read straight off the save, so old saves get theirs too. Listed in the menu; one reached while playing pops up
export const ACH: [Word, string, () => unknown][] = ([
  ['新朋友', 'xīn péngyou', 'New friend: finish a first request', () => Object.values(state.quests).some(n => n > 0)],
  ['好帮手', 'hǎo bāngshou', 'Good helper: finish 20 requests', () => done() >= 20],
  ['小学生', 'xiǎoxuéshēng', 'Pupil: meet 50 words', () => known() >= 50],
  ['大学生', 'dàxuéshēng', 'Scholar: meet 150 words', () => known() >= 150],
  ['钓鱼', 'diàoyú', 'Angler: catch a fish', () => state.did.fish],
  ['农民', 'nóngmín', 'Farmer: plant a seed', () => state.did.plant],
  ['矿工', 'kuànggōng', 'Miner: dig stone with a pickaxe', () => state.did.mine],
  ['宠物', 'chǒngwù', 'Pet: tame an animal', () => state.pets.length],
  ['我的家', 'wǒ de jiā', 'Home: make a bed your home', () => state.home],
  ['读书', 'dúshū', 'Reader: read a book', () => state.did.read || state.read.length],
  ['骑骆驼', 'qí luòtuo', 'Rider: ride the camel', () => state.did.ride],
  ['有钱人', 'yǒuqiánrén', 'Rich: have 100 块钱', () => state.money >= 100],
  ['宝藏', 'bǎozàng', 'Treasure: open the treasure chest', () => state.chest],
  ['节日', 'jiérì', "Festival: finish every villager's list", () => state.won],
] as const).map(([hz, py, en, ok]) => [{ hz, py, en: t(en).split(':')[0] }, t(en), ok])

export const isWord = (p: Part): p is Word => typeof p !== 'string'
export const plain = (parts: Part[]) => parts.map(p => isWord(p) ? p.hz : p).join('')

/** a Mandarin voice if the device has one: mainland first, then any Chinese (the list loads late in some browsers) */
export function zhVoice() {
  if (typeof speechSynthesis === 'undefined') return undefined
  const all = speechSynthesis.getVoices()
  // macOS lists novelty voices (Eddy, Flo, Grandma …) before the proper one; Cantonese is not what we teach
  const odd = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley) \(/
  return all.find(v => /^zh[-_]CN/i.test(v.lang) && !odd.test(v.name)) ?? all.find(v => /^(zh|cmn)/i.test(v.lang) && !/HK|yue/i.test(v.lang) && !odd.test(v.name))
}
// --- the voice: clips recorded with Kokoro (scripts/voice.py), public/voice/index.json maps each line to its file ---
let clips: Record<string, string> = {}, longestClip = 0
export function loadClips(c: Record<string, string>) {
  // a villager's line said by the narrator (the sentence drill reads them out) borrows a villager's recording
  for (const [k, f] of Object.entries(c)) { const at = k.indexOf(':'); if (at > 0) c[k.slice(at + 1)] ??= f }
  clips = c; longestClip = Math.max(...Object.keys(c).map(k => k.length))
}
if (typeof Audio !== 'undefined') fetch('voice/index.json').then(r => r.json()).then(loadClips, () => {})
export const hasClips = () => longestClip > 0
/** lines spoken by the browser's own voice because no clip covers them, and lines pieced together from word clips
 * (the e2e run reports both: add them to scripts/voice-lines.ts) */
export const unvoiced = new Set<string>(), pieced = new Set<string>()
/** the clips that say `text`: in the speaker's own voice, else the narrator's, else its words one after another
 * (longest match); undefined if a word has none */
export function clipsFor(text: string, who = ''): string[] | undefined {
  const own = clips[`${who}:${text}`] ?? clips[text]
  if (own) return [own]
  const out: string[] = []
  for (let i = 0; i < text.length;) {
    if (!/[一-鿿]/.test(text[i])) { i++; continue } // punctuation, spaces, "+"
    let len = Math.min(longestClip, text.length - i)
    while (len > 0 && !clips[text.slice(i, i + len)]) len--
    if (!len) return undefined
    out.push(clips[text.slice(i, i + len)]); i += len
  }
  if (out.length > 1) pieced.add(text)
  return out.length ? out : undefined
}
// One audio element says every line: Safari only lets an element play outside a click or tap once one has started it,
// so the start click plays it once, silently (unlockVoice), and later lines (greetings, weather …) may play too
const sound = typeof Audio === 'undefined' ? undefined : new Audio()
export function unlockVoice() {
  if (!sound || sound.src) return
  sound.muted = true; sound.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  sound.play().catch(() => {}).finally(() => { sound.muted = false })
}
let lastSaid = '', lastWho = '', saying = 0
const fetched = new Set<string>()
/** load a line's clips ahead of time (a villager's line as you come into view), so it starts without a delay */
export function prefetch(text: string, who = '') {
  if (!sound || state.opts.voice === 2 || fetched.has(who + ':' + text) || !hasClips()) return // asked every frame: once per line
  fetched.add(who + ':' + text)
  for (const f of clipsFor(text, who) ?? []) {
    const file = f.split('*')[0]
    if (!fetched.has(file)) { fetched.add(file); fetch(`voice/${file}.mp3`).catch(() => fetched.delete(file)) }
  }
}
/** when the last line was said (performance.now()); quiet moments are left for animal noises */
export let saidAt = -1e9
/** say the last thing again, slowly */
export const repeat = () => speak(lastSaid, true, lastWho)
/** `who`: the villager saying it, in their own voice (scripts/voice-lines.ts); otherwise the narrator */
export function speak(text: string, slow = false, who = '', remember = true) {
  saidAt = typeof performance === 'undefined' ? 0 : performance.now() // also with the voice off: the quiet moments stay quiet
  if (state.opts.voice === 2) return
  if (remember) { lastSaid = text; lastWho = who } // an animal noise is not what R repeats
  const my = ++saying, files = sound && clipsFor(text, who), rate = slow || state.opts.voice ? 0.7 : 1
  sound?.pause()
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  if (sound && files) { // one clip after another; a newer line cuts this one off
    const next = (i: number) => {
      if (my !== saying || i >= files.length) return
      const [file, gain] = files[i].split('*') // "file*0.62": a loud voice played softer (scripts/voice.py)
      sound.src = `voice/${file}.mp3`; sound.volume = gain ? +gain : 1
      sound.defaultPlaybackRate = sound.playbackRate = rate // slower, at the same pitch
      sound.onended = () => next(i + 1)
      sound.play().catch((e: Error) => { // interrupted by the next line: fine; refused by the browser: its own voice says it
        if (e.name === 'NotAllowedError' && my === saying && typeof speechSynthesis !== 'undefined') browserSay(text, rate < 1)
      })
    }
    return next(0)
  }
  browserSay(text, rate < 1)
}
function browserSay(text: string, slow: boolean) {
  if (typeof speechSynthesis === 'undefined') return
  if (/[一-鿿]/.test(text)) unvoiced.add(text)
  const u = new SpeechSynthesisUtterance(text), v = zhVoice()
  if (v) u.voice = v // otherwise the browser picks by language tag, which usually works too
  u.lang = 'zh-CN'; u.rate = slow ? 0.5 : 0.8
  speechSynthesis.speak(u)
}

// --- grammar notes: each unlocks the first time its trigger word is met ---
export const NOTES: [string, string][] = [ // [trigger hanzi, note]
  ['*', 'Colours show tones: red 1st (high and level), green 2nd (rising), blue 3rd (dipping), purple 4th (falling), grey neutral.'],
  ['块', 'Chinese counts with a measure word between the number and the thing: 三块木头, 一只猫, 一本书. Each kind of thing has its own; 个 is the general one.'],
  ['两', '两 (liǎng) replaces 二 (èr) before a measure word: 两块木头, 两点 — but 十二, 第二.'],
  ['吗', '吗 at the end turns a statement into a yes/no question: 你有木板。→ 你有木板吗？'],
  ['了', '了 marks that something has happened or changed: 下雨了, 我饿了, 我挖了一块土.'],
  ['的', '的 links a description or an owner to a thing: 红色的布 (red cloth), 我的家 (my home).'],
  ['我的', '的 links a description or an owner to a thing: 红色的布 (red cloth), 我的家 (my home).'],
  ['不', '不 in front of a verb or adjective makes it negative: 猪不吃竹子, 我不困. 有 is negated with 没 instead: 没有.'],
  ['没有', '没有 is "not have". Offering both answers also asks a question: 你有没有苹果？'],
  ['很', 'Adjectives need no "to be": 我很冷 is simply "I am cold". 很 fills the gap and only weakly means "very".'],
  ['在', '在 is "to be at": 老师在北边, 我在家看书. The place comes before what you do there.'],
  ['想', '想 + verb is "want to" (我想吃面包); 想要 + thing is "would like" (我想要三个苹果); 要 is a blunter "want", and also "need".'],
  ['几', '几 asks for a small number (现在几点？), 多少 for any amount (你有多少钱？).'],
  ['把字句', '把 puts the thing you act on in front of the verb: 请把这封信给裁缝 — "please take this letter and give it to the tailor".'],
  ['第', '第 makes a number an ordinal: 第三天 is the third day.'],
  ['挖', 'Characters are built from parts, and one part often hints at the meaning: 扌 (hand) in 挖 找 拔 摘, 口 (mouth) in 吃 喝 叫, 氵 (water) in 海 渴. They show next to the English.'],
  ['是', '是 links two nouns (我是老师, 这是猫). It is not used before adjectives.'],
]
/** notes whose trigger has been met but that have not been shown yet; marks them shown */
export function newNotes(): string[] {
  const out: string[] = []
  for (const [hz, note] of NOTES) { // saved in English, so changing the language does not show them again
    if (state.notes.includes(note) || !(hz === '*' ? Object.keys(state.seen).length : state.seen[hz])) continue
    state.notes.push(note); out.push(t(note))
  }
  return out
}

// --- measure-word and tone drills ---
export interface Quiz { word: Word; prompt: Part[]; en: string; options: string[]; answer: number; reveal: Part[] }

/** measure words: "三＿木头". Distractors never include 个 or 堆 (nearly always tolerable) or a second classifier that is also right. */
const ALSO: Record<string, string> = {
  木头: '根', 椅子: '张', 蛋糕: '个', 瓦: '块', 竹子: '棵', 船: '只', 猪: '只', 牛: '只', 骆驼: '只匹', 门: '个', 种子: '粒把',
  面包: '块片条', 玻璃: '片', 熊猫: '头', 鸡蛋: '颗', 苹果: '颗', 石头: '颗', 狗: '条', 鱼竿: '把', 羊: '头',
}
export function clQuiz(rand = Math.random): Quiz {
  const pick = <T>(a: T[]) => a[Math.floor(rand() * a.length)]
  const things: [Word, Word][] = [
    ...BLOCKS.filter((_, id) => ![AIR, WATER, GRASS, SNOW, SAND, DOOR_OPEN].includes(id)).map(b => [b.w, b.cl] as [Word, Word]),
    ...[V.cat, V.dog, V.sheep, V.chicken, V.panda, V.bird, V.penguin].map(a => [a, V.zhi] as [Word, Word]),
    ...[V.pig, V.cow, V.camel].map(a => [a, V.tou] as [Word, Word]),
  ]
  const [word, cl] = pick(things), n = 1 + Math.floor(rand() * 9), num = countNum(n)
  const others = [...new Set(things.map(t => t[1]))].filter(c => c !== cl && c !== V.ge && c !== V.dui && !(ALSO[word.hz] ?? '').includes(c.hz))
  const opts = [cl]
  while (opts.length < 4) { const o = pick(others); if (!opts.includes(o)) opts.push(o) }
  for (let i = 3; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]] }
  return { word: cl, prompt: [num, ' ＿ ', word], en: `${n} × ${word.en}`, options: opts.map(c => `${c.hz} ${c.py}`), answer: opts.indexOf(cl), reveal: [num, cl, word] }
}

/** tones: a one-syllable word is spoken; pick which of the four tones it has */
const TONES: Record<string, string> = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' }
export function toneQuiz(rand = Math.random): Quiz {
  // not characters with two readings: alone, the voice may pick the other one
  const pool = ALL_WORDS.filter(x => [...x.hz].length === 1 && syllables(x.py)[0]?.[1] < 5 && !'只种空熟'.includes(x.hz))
  const seen = pool.filter(x => state.seen[x.hz] >= 1), word = (seen.length >= 8 ? seen : pool)[Math.floor(rand() * (seen.length >= 8 ? seen : pool).length)]
  const [syl, tone] = syllables(word.py)[0], bare = [...syl].map(ch => (BARE[ch] ?? ch).replace('v', 'ü')).join('')
  // the mark sits on a, else e, else the o of "ou", else the last vowel
  const at = bare.includes('a') ? bare.indexOf('a') : bare.includes('e') ? bare.indexOf('e') : bare.includes('ou') ? bare.indexOf('o') : Math.max(...[...'iouü'].map(v => bare.lastIndexOf(v)))
  return { word, prompt: [word], en: word.en, options: [0, 1, 2, 3].map(t => bare.slice(0, at) + TONES[bare[at]][t] + bare.slice(at + 1)), answer: tone - 1, reveal: [word] }
}

/** numbers by ear: a number up to 99 is spoken; the wrong answers are the ones it is easily mistaken for (四十 / 十四, 六 / 九 …) */
export function numQuiz(rand = Math.random): Quiz {
  const n = 1 + Math.floor(rand() * 99), tens = Math.floor(n / 10), ones = n % 10
  const near = [ones * 10 + tens, n + 10, n - 10, n + 1, n - 1, tens * 10 + (ones + 3) % 10, 100 - n].filter(x => x > 0 && x < 100 && x !== n)
  const opts = [n]
  for (const x of near) if (opts.length < 4 && !opts.includes(x)) opts.push(x)
  for (let i = 3; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]] }
  return { word: numWord(n), prompt: ['？'], en: t('Which number do you hear?'), options: opts.map(String), answer: opts.indexOf(n), reveal: [numWord(n)] }
}

// --- books: short stories made only of words the island teaches ---
/** "我|有|一|只|小|猫|。" -> a Line; every token must be a known word or punctuation */
function S(text: string, en: string): Line {
  const lex = new Map(ALL_WORDS.map(x => [x.hz, x]))
  return { en: t(en), parts: text.split('|').map(t => lex.get(t) ?? (/^[。，！？：]$/.test(t) ? t : (() => { throw new Error('story word not in vocabulary: ' + t) })())) }
}
export const STORIES: { title: Word; lines: Line[] }[] = [
  { title: V.cat, lines: [
    S('我|有|一|只|小|猫|。', 'I have a little cat.'), S('它|很|小|。', 'It is very small.'), S('它|喜欢|鱼|。', 'It likes fish.'),
    S('我|每天|给|它|一|条|鱼|。', 'Every day I give it a fish.'), S('小|猫|很|高兴|。', 'The little cat is very happy.')] },
  { title: V.farmer, lines: [
    S('农民|住|在|农场|。', 'The farmer lives on the farm.'), S('他|有|两|头|牛|和|三|只|羊|。', 'He has two cows and three sheep.'),
    S('牛|吃|草|。', 'The cows eat grass.'), S('农民|每天|喝|牛奶|。', 'The farmer drinks milk every day.')] },
  { title: V.rain, lines: [
    S('今天|下雨|了|。', "Today it's raining."), S('我|不|去|码头|。', "I'm not going to the pier."), S('我|在|家|看|书|。', "I'm at home reading a book."),
    S('晚上|天晴|了|，|我|看|星星|。', 'In the evening the sky clears and I look at the stars.')] },
  { title: V.panda, lines: [
    S('熊猫|喜欢|竹子|。', 'The panda likes bamboo.'), S('它|每天|吃|很多|竹子|。', 'It eats a lot of bamboo every day.'),
    S('它|不|吃|鱼|。', "It doesn't eat fish."), S('熊猫|很|大|。', 'The panda is very big.')] },
  { title: V.friend, lines: [
    S('我的|朋友|叫|小方|。', 'My friend is called Xiao Fang.'), S('我们|一起|去|商店|。', 'We go to the shop together.'),
    S('我|买|一|个|苹果|，|他|买|一|杯|牛奶|。', 'I buy an apple, he buys a glass of milk.'), S('我们|很|高兴|。', 'We are very happy.')] },
  { title: V.penguin, lines: [
    S('企鹅|住|在|雪岛|。', 'The penguin lives on the snow island.'), S('雪岛|很|冷|。', 'The snow island is very cold.'),
    S('企鹅|不|怕|冷|。', "The penguin doesn't mind the cold."), S('它|喜欢|吃|鱼|。', 'It likes to eat fish.'), S('我|给|它|两|条|鱼|。', 'I give it two fish.')] },
  { title: V.camel, lines: [
    S('沙岛|很|热|。', 'The sand island is very hot.'), S('骆驼|住|在|沙岛|。', 'The camel lives on the sand island.'),
    S('骆驼|很|大|。', 'The camel is very big.'), S('它|吃|仙人掌|，|不|吃|鱼|。', 'It eats cactus, not fish.')] },
  { title: BLOCKS[BOAT].w, lines: [
    S('我|没有|船|。', "I don't have a boat."), S('我|砍|树|，|做|木板|。', 'I chop trees and make planks.'), S('我|做|了|一|条|船|。', 'I made a boat.'),
    S('今天|我|划船|去|小岛|。', 'Today I row to the little island.'), S('小岛|上|有|一|个|宝箱|！', 'On the little island there is a treasure chest!')] },
  { title: V.smith, lines: [
    S('铁匠|需要|煤|。', 'The blacksmith needs coal.'), S('我|有|一|把|镐|。', 'I have a pickaxe.'), S('我|挖|了|三|块|煤|。', 'I dug three pieces of coal.'),
    S('铁匠|很|高兴|。', 'The blacksmith is very happy.')] },
  { title: V.tailor, lines: [
    S('裁缝|喜欢|红色|。', 'The tailor likes red.'), S('我|有|一|团|羊毛|和|一|朵|红花|。', 'I have a ball of wool and a red flower.'),
    S('我|做|了|一|块|红布|。', 'I made a piece of red cloth.'), S('我|给|裁缝|一|块|红布|。', 'I give the tailor a piece of red cloth.')] },
  { title: PLACES.merchant, lines: [
    S('商人|卖|很多|东西|。', 'The merchant sells a lot of things.'), S('我|没有|钱|。', 'I have no money.'), S('我|卖|了|三|条|鱼|。', 'I sold three fish.'),
    S('现在|我|有|十|二|块|钱|。', 'Now I have twelve yuan.'), S('我|买|了|一|个|灯笼|。', 'I bought a lantern.')] },
  { title: BLOCKS[LETTER].w, lines: [
    S('木匠|给|我|一|封|信|。', 'The carpenter gives me a letter.'), S('我|去|裁缝店|。', "I go to the tailor's shop."),
    S('裁缝|看|信|，|很|高兴|。', 'The tailor reads the letter and is very happy.'), S('裁缝|说|：|谢谢|！', 'The tailor says: thank you!')] },
  { title: V.home, lines: [
    S('这|是|我的|家|。', 'This is my home.'), S('家|里|有|一|张|床|和|一|张|桌子|。', 'In the house there is a bed and a table.'),
    S('晚上|我|在|家|睡觉|。', 'In the evening I sleep at home.'), S('早上|我|开|门|，|看|太阳|。', 'In the morning I open the door and look at the sun.')] },
  { title: V.cook, lines: [
    S('厨师|饿|了|。', 'The cook is hungry.'), S('他|种|小麦|。', 'He plants wheat.'),
    S('小麦|熟|了|，|他|做|面包|。', 'The wheat ripens and he makes bread.'), S('面包|很|好吃|。', 'The bread is very tasty.')] },
]
