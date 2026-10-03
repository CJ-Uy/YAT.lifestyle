import type { Locale } from "../../app/site-header.tsx";

type Localised = Record<Locale, string>; // replaced by import from ./types.ts at merge

export type Question = {
  id: string;
  topic: "routine" | "climate" | "activity" | "social" | "memory" | "dislikes";
  text: Localised;
  chips: { id: string; label: Localised; tags: string[] }[];
  followsFrom?: { question: string; chip: string };
};

// Topics a perfumer would never ask a stranger about; also enforced on AI output.
export const BANNED = ["health", "illness", "medic", "religio", "sexual", "income", "salary", "weight"];

type L = [en: string, zhHant: string, zhHans: string];
const loc = ([en, h, s]: L): Localised => ({ en, "zh-Hant": h, "zh-Hans": s });
const c = (id: string, label: L, tags: string[] = []) => ({ id, label: loc(label), tags });
const q = (
  id: string,
  topic: Question["topic"],
  text: L,
  chips: ReturnType<typeof c>[],
  followsFrom?: Question["followsFrom"],
): Question => ({ id, topic, text: loc(text), chips, ...(followsFrom && { followsFrom }) });

export const BANK: Question[] = [
  // routine
  q("weekday", "routine", ["What does your typical weekday look like?", "平日大多是怎樣過的？", "平日大多是怎么过的？"], [
    c("office", ["At a desk in an office", "坐在辦公室對著電腦", "坐在办公室对着电脑"], ["office"]),
    c("remote", ["Mostly working from home", "大部分時間在家工作", "大部分时间在家工作"], ["home"]),
    c("onfeet", ["On my feet, meeting people", "要四處走動、見人", "要四处走动、见人"], ["active-day"]),
    c("study", ["Classes and studying", "上課和溫書", "上课和温书"], ["campus"]),
  ]),
  q("commute", "routine", ["How do you get to work or class?", "你平時怎樣上班或上學？", "你平时怎么上班或上学？"], [
    c("mtr", ["The MTR, usually packed", "搭港鐵，通常好擠", "坐港铁，通常很挤"], ["close-quarters"]),
    c("bus", ["Bus or minibus", "巴士或小巴", "巴士或小巴"], ["transit"]),
    c("walk", ["Walk or cycle", "步行或踩單車", "步行或骑单车"], ["outdoor-commute"]),
    c("car", ["Car or taxi", "開車或搭的士", "开车或打车"], ["private-ride"]),
  ]),
  q("morning", "routine", ["How do your mornings start?", "你的早晨通常怎樣開始？", "你的早晨通常怎样开始？"], [
    c("rushed", ["Out the door in minutes", "幾分鐘內就要出門", "几分钟内就要出门"], ["quick-start"]),
    c("slow", ["Coffee and a slow start", "一杯咖啡，慢慢來", "一杯咖啡，慢慢来"], ["calm-morning"]),
    c("exercise", ["Exercise first, then the day", "先運動，再開始一天", "先运动，再开始一天"], ["morning-active"]),
    c("owl", ["I am not a morning person", "我不是早起的人", "我不是早起的人"], ["night-owl"]),
  ]),
  q("evening", "routine", ["How do your evenings usually end?", "你的晚上通常怎樣收尾？", "你的晚上通常怎么收尾？"], [
    c("home", ["Home, on the sofa", "回家，窩在沙發上", "回家，窝在沙发上"], ["home"]),
    c("dinner", ["Dinner with friends", "跟朋友吃晚飯", "跟朋友吃晚饭"], ["dining-out"]),
    c("bar", ["A bar or live music", "去酒吧或聽現場音樂", "去酒吧或听现场音乐"], ["nightlife"]),
    c("overtime", ["Still at the office", "還在公司加班", "还在公司加班"], ["office"]),
  ]),

  // climate
  q("summer", "climate", ["How do you handle Hong Kong's humid summers?", "香港潮濕的夏天，你怎麼應付？", "香港潮湿的夏天，你怎么应付？"], [
    c("outdoors", ["I am out in it anyway", "照樣在外面跑", "照样在外面跑"], ["humid-outdoor"]),
    c("hop", ["I hop between air-conditioned places", "在冷氣空間之間穿梭", "在空调空间之间穿梭"], ["aircon-hop"]),
    c("inside", ["I stay in as much as I can", "盡量留在室內", "尽量待在室内"], ["home"]),
    c("love", ["Summer is my season", "夏天是我的季節", "夏天是我的季节"], ["warm-lover"]),
  ]),
  q("aircon", "climate", ["Is your office freezing with the air-con on?", "辦公室的冷氣是不是開得特別凍？", "办公室的空调是不是开得特别冷？"], [
    c("freezing", ["Always, I keep a jacket at my desk", "常常凍到要在座位放件外套", "常常冷到要在座位上放件外套"], ["aircon-office", "cool-indoor"]),
    c("fine", ["It is fine, just right", "還可以，剛好", "还可以，刚好"], ["aircon-office"]),
    c("stuffy", ["Not really, it can get stuffy", "不會，反而有點悶", "不会，反而有点闷"], ["stuffy-office"]),
  ], { question: "weekday", chip: "office" }),
  q("rain", "climate", ["Do you like rainy days?", "你喜歡下雨的日子嗎？", "你喜欢下雨的日子吗？"], [
    c("love", ["I love the smell after rain", "喜歡雨後泥土的氣味", "喜欢雨后泥土的气味"], ["petrichor"]),
    c("meh", ["Annoying, but fine", "有點煩，但還好", "有点烦，但还好"]),
    c("damp", ["I hate damp clothes and frizzy hair", "受不了濕漉漉的衣服和頭髮", "受不了湿漉漉的衣服和头发"], ["damp-averse"]),
  ]),
  q("weather", "climate", ["Which Hong Kong weather suits you best?", "哪種香港天氣最合你心意？", "哪种香港天气最合你心意？"], [
    c("crisp", ["A crisp winter morning", "清爽的冬日早晨", "清爽的冬日早晨"], ["crisp-cool"]),
    c("sun", ["A dry, sunny day", "乾爽的晴天", "干爽的晴天"], ["dry-sun"]),
    c("breeze", ["A day with a sea breeze", "有海風的日子", "有海风的日子"], ["sea-breeze"]),
    c("night", ["A warm, sticky night", "悶熱的夜晚", "闷热的夜晚"], ["humid-night"]),
  ]),
  q("fade", "climate", ["Does perfume fade fast on you in the heat?", "香水在炎熱天氣下會很快散掉嗎？", "香水在炎热天气下会很快散掉吗？"], [
    c("gone", ["Yes, it is gone by lunch", "會，中午前就沒味了", "会，中午前就没味了"], ["needs-longevity"]),
    c("lasts", ["No, it lasts all day", "不會，整天都在", "不会，整天都在"], ["long-wearing"]),
    c("new", ["I do not wear one yet", "我還沒有常用的香水", "我还没有常用的香水"], ["first-time"]),
  ]),

  // activity
  q("gym", "activity", ["Do you go to the gym?", "你有去健身室嗎？", "你有去健身房吗？"], [
    c("regular", ["Yes, a few times a week", "有，每星期好幾次", "有，每周好几次"], ["post-gym"]),
    c("sometimes", ["Now and then", "偶爾去", "偶尔去"], ["post-gym"]),
    c("no", ["Not really", "沒有，不太去", "没有，不太去"]),
  ]),
  q("gym-time", "activity", ["Before work or after?", "你通常在上班前還是下班後去？", "你通常在上班前还是下班后去？"], [
    c("before", ["Before work", "上班前", "上班前"], ["post-gym", "morning-active"]),
    c("lunch", ["At lunchtime", "午飯時間", "午饭时间"], ["post-gym"]),
    c("after", ["After work", "下班後", "下班后"], ["post-gym", "evening-active"]),
    c("weekend", ["Weekends only", "只在週末", "只在周末"], ["weekend-active"]),
  ], { question: "gym", chip: "regular" }),
  q("weekend", "activity", ["What does a good weekend look like?", "理想的週末是怎樣的？", "理想的周末是怎样的？"], [
    c("hiking", ["Hiking a trail", "行山", "徒步爬山"], ["outdoors"]),
    c("dimsum", ["Dim sum with family", "跟家人飲茶", "跟家人饮茶"], ["family"]),
    c("beach", ["A beach day", "去沙灘", "去海滩"], ["beach"]),
    c("city", ["Cafes and shopping", "逛咖啡店和商場", "逛咖啡店和商场"], ["city-wander"]),
    c("late", ["A late night out", "夜晚玩到很晚", "夜里玩到很晚"], ["nightlife"]),
  ]),
  q("trail", "activity", ["Which trail do you keep going back to?", "你最常回去哪條行山徑？", "你最常回去哪条徒步路线？"], [
    c("dragons-back", ["Dragon's Back", "龍脊", "龙脊"], ["trail-memory", "humid-outdoor"]),
    c("lion-rock", ["Lion Rock", "獅子山", "狮子山"], ["trail-memory"]),
    c("maclehose", ["The MacLehose Trail", "麥理浩徑", "麦理浩径"], ["trail-memory"]),
    c("nearest", ["Whichever is closest", "附近有哪條就走哪條", "附近有哪条就走哪条"], ["trail-memory"]),
  ], { question: "weekend", chip: "hiking" }),
  q("sport", "activity", ["What else gets you moving?", "平常還會做什麼運動？", "平常还会做什么运动？"], [
    c("run", ["Running", "跑步", "跑步"], ["humid-outdoor"]),
    c("swim", ["Swimming", "游水", "游泳"], ["water"]),
    c("studio", ["Yoga or pilates", "瑜伽或普拉提", "瑜伽或普拉提"], ["studio"]),
    c("team", ["Ball games or team sports", "球類或團體運動", "球类或团体运动"], ["team-sport"]),
    c("walk", ["Mostly walking", "主要是步行", "主要是步行"], ["walking"]),
  ]),
  q("water", "activity", ["Do you get out on the water or to the beach?", "你會去海邊或玩水上活動嗎？", "你会去海边或玩水上活动吗？"], [
    c("beach", ["Lazy days at Repulse Bay or Shek O", "愛去淺水灣或石澳曬太陽", "爱去浅水湾或石澳晒太阳"], ["beach", "humid-outdoor"]),
    c("boat", ["Boat trips and outlying islands", "出海或去離島", "出海或去离岛"], ["sea-breeze"]),
    c("pool", ["A few laps at the pool", "在泳池游幾個來回", "在泳池游几个来回"], ["pool"]),
    c("none", ["Not really", "不太去", "不太去"]),
  ]),

  // social
  q("dimsum", "social", ["How often is there a family dim sum lunch?", "家人一起飲茶，大概多久一次？", "家人一起饮茶，大概多久一次？"], [
    c("weekly", ["Almost every weekend", "幾乎每個週末", "几乎每个周末"], ["family", "food-aroma"]),
    c("monthly", ["About once a month", "大概一個月一次", "大概一个月一次"], ["family"]),
    c("festivals", ["Mostly at festivals", "主要是節日", "主要是节日"], ["family"]),
    c("rarely", ["Rarely", "很少", "很少"]),
  ]),
  q("bars", "social", ["Where do you go for a night out?", "夜晚出去玩，你會去哪裏？", "晚上出去玩，你会去哪里？"], [
    c("lkf", ["Lan Kwai Fong or Soho", "蘭桂坊或蘇豪", "兰桂坊或苏豪"], ["nightlife"]),
    c("rooftop", ["A rooftop bar", "天台酒吧", "天台酒吧"], ["nightlife"]),
    c("cocktail", ["A quiet cocktail bar", "安靜的雞尾酒吧", "安静的鸡尾酒吧"], ["nightlife"]),
    c("ktv", ["Karaoke with friends", "跟朋友唱K", "跟朋友唱K"], ["nightlife"]),
    c("stay", ["I would rather stay in", "寧願留在家", "宁愿留在家"], ["home"]),
  ]),
  q("crowd", "social", ["In a packed MTR carriage or lift, do you think about how you smell?", "在擠滿人的港鐵車廂或電梯裏，你會留意自己的氣味嗎？", "在挤满人的港铁车厢或电梯里，你会留意自己的气味吗？"], [
    c("no", ["Not really", "不太在意", "不太在意"]),
    c("light", ["Yes, so I wear it light", "會，所以我會噴得輕一點", "会，所以我会喷得轻一点"], ["close-quarters", "subtle"]),
    c("avoid", ["I avoid rush hour", "我會避開繁忙時間", "我会避开高峰时间"], ["close-quarters"]),
  ]),
  q("dressup", "social", ["Who do you dress up for?", "你最想為誰打扮？", "你最想为谁打扮？"], [
    c("work", ["Clients and colleagues", "客戶和同事", "客户和同事"], ["office"]),
    c("dates", ["A date", "約會的對象", "约会的对象"], ["date"]),
    c("friends", ["My friends", "朋友", "朋友"], ["friends"]),
    c("self", ["Myself", "自己", "自己"], ["self-care"]),
  ]),

  // memory
  q("childhood", "memory", ["Which smell takes you back to childhood?", "哪種氣味會讓你想起小時候？", "哪种气味会让你想起小时候？"], [
    c("kitchen", ["Grandma's kitchen, ginger and steamed rice", "外婆廚房裏的薑和蒸飯香", "外婆厨房里的姜和蒸饭香"], ["kitchen", "warm-spice"]),
    c("rain", ["The earth after rain", "雨後的泥土味", "雨后的泥土味"], ["petrichor"]),
    c("school", ["Chalk and paper", "粉筆和紙張", "粉笔和纸张"], ["paper"]),
    c("sea", ["Salty wind by the sea", "海邊的鹹風", "海边的咸风"], ["sea-breeze"]),
  ]),
  q("street", "memory", ["Which Hong Kong street smell do you secretly love?", "哪種香港街頭的氣味，你偷偷喜歡？", "哪种香港街头的气味，你偷偷喜欢？"], [
    c("waffle", ["Egg waffles fresh off the iron", "雞蛋仔剛出爐", "鸡蛋仔刚出炉"], ["sweet-gourmand"]),
    c("wok", ["Wok hei from a dai pai dong", "大排檔的鑊氣", "大排档的锅气"], ["smoky"]),
    c("flowers", ["The Mong Kok flower market", "旺角花墟", "旺角花墟"], ["floral"]),
    c("pavement", ["Rain on warm pavement", "暖烘烘的路面淋了雨", "被晒热的路面淋了雨"], ["petrichor"]),
  ]),
  q("place", "memory", ["Is there a place that smells like a good memory?", "有沒有哪個地方，聞起來就像美好的回憶？", "有没有哪个地方，闻起来就像美好的回忆？"], [
    c("hill", ["A hillside after rain", "雨後的山徑", "雨后的山径"], ["trail-memory"]),
    c("beach", ["A beach in summer", "夏天的沙灘", "夏天的海滩"], ["beach"]),
    c("grandparents", ["My grandparents' home", "長輩的家", "长辈的家"], ["home-nostalgia"]),
    c("city", ["A city I once lived in", "住過的城市", "住过的城市"], ["city-lights"]),
  ]),
  q("plants", "memory", ["Which plant or flower do you love most?", "你特別喜歡哪種花草？", "你特别喜欢哪种花草？"], [
    c("osmanthus", ["Osmanthus or jasmine", "桂花或茉莉", "桂花或茉莉"], ["floral"]),
    c("citrus", ["Citrus, like pomelo or dried tangerine peel", "柑橘類，例如柚子、陳皮", "柑橘类，例如柚子、陈皮"], ["citrus"]),
    c("herbs", ["Mint and fresh herbs", "薄荷和香草", "薄荷和香草"], ["green"]),
    c("wood", ["Pine or cedar", "松木或雪松", "松木或雪松"], ["woody"]),
  ]),

  // dislikes
  q("wince", "dislikes", ["Which smell makes you wince?", "哪一種氣味讓你皺眉？", "哪种气味让你皱眉？"], [
    c("sweet", ["Sugary vanilla", "甜膩的香草味", "甜腻的香草味"], ["avoid-sweet"]),
    c("powder", ["Heavy powder", "厚重的粉香", "厚重的粉香"], ["avoid-powdery"]),
    c("smoke", ["Smoky, tobacco-like notes", "煙燻、煙草般的氣味", "烟熏、烟草般的气味"], ["avoid-smoke"]),
    c("clean", ["Sharp cleaning-product fresh", "刺鼻的清潔劑味", "刺鼻的清洁剂味"], ["avoid-clean"]),
  ]),
  q("strength", "dislikes", ["How strong should a scent be?", "香味應該有多濃？", "香味应该有多浓？"], [
    c("whisper", ["Close to the skin, just for me", "貼近皮膚，只有我聞到", "贴近皮肤，只有我闻到"], ["subtle"]),
    c("arm", ["Noticed within arm's reach", "一臂距離內聞到就好", "一臂距离内能闻到就好"], ["moderate"]),
    c("room", ["Present when I walk into a room", "走進房間就有存在感", "走进房间就有存在感"], ["bold"]),
  ]),
  q("dealbreaker", "dislikes", ["What makes you put a perfume straight back?", "什麼會讓你立刻放下一瓶香水？", "什么会让你立刻放下一瓶香水？"], [
    c("synthetic", ["It smells artificial", "聞起來很人工", "闻起来很人工"], ["avoid-synthetic"]),
    c("common", ["Everyone already wears it", "太大眾，人人都在用", "太大众，人人都在用"], ["wants-niche"]),
    c("someone", ["It reminds me of someone", "讓我想起某個人", "让我想起某个人"], ["avoid-memory"]),
    c("musty", ["Musty, like an old wardrobe", "有霉味，像舊衣櫃", "有霉味，像旧衣柜"], ["avoid-musty"]),
  ]),
  q("flowers", "dislikes", ["Which flower is too much for you?", "哪種花香對你來說太濃？", "哪种花香对你来说太浓？"], [
    c("lily", ["Lily", "百合", "百合"], ["avoid-lily"]),
    c("jasmine", ["Jasmine", "茉莉", "茉莉"], ["avoid-jasmine"]),
    c("rose", ["Rose", "玫瑰", "玫瑰"], ["avoid-rose"]),
    c("none", ["None, I like them all", "都可以接受", "都可以接受"]),
  ]),
];
