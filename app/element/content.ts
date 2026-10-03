import type { Locale } from "../site-header";

export type Translation = Record<Locale, string>;
export const text = (en: string, traditional: string, simplified: string): Translation => ({ en, "zh-Hant": traditional, "zh-Hans": simplified });

export const elementCopy = {
  tagline: text("Find your element. Smell like yourself.", "找到你的 Element，聞見自己的氣息。", "找到你的 Element，闻见自己的气息。"),
  subline: text("Tested by you. Fine-tuned by AI.", "由你測試，以 AI 微調。", "由你测试，以 AI 微调。"),
  intro: text("A small lab in your hands. Explore your skin, your nose and the scents you love, then tune a base perfume with a perfumer's care.", "掌心裡的小實驗室。探索肌膚、嗅覺與喜愛的香氣，再由調香師把關，微調基礎香水。", "掌心里的小实验室。探索肌肤、嗅觉与喜爱的香气，再由调香师把关，微调基础香水。"),
  demo: text("Try the demo", "體驗示範", "体验演示"),
  how: text("How it works", "了解流程", "了解流程"),
  skip: text("Skip to how it works", "跳至使用流程", "跳至使用流程"),
  price: text("Lab kit + tuned 50 ml bottle · HK$988", "實驗套裝 + 微調香水 50 ml · HK$988", "实验套装 + 微调香水 50 ml · HK$988"),
  review: text("A perfumer reviews every formula before mixing.", "每個配方均由調香師審核後才調配。", "每个配方均由调香师审核后才调配。"),
  disclaimer: text("Not a medical or diagnostic device.", "並非醫療或診斷器材。", "并非医疗或诊断器材。"),
  prototype: text("Hackathon prototype. Measurements and sample formulas are exploratory.", "黑客松原型。測量與示例配方仍屬探索階段。", "黑客松原型。测量与示例配方仍属探索阶段。"),
  problem: text("Ten sprays in, everything smells good.", "試到第十款，每款都好像不錯。", "试到第十款，每款都好像不错。"),
  problemBody: text("A busy counter tells you little about how a scent feels on your skin, in your day. Take your time at home. Compare blind. Keep the notes that feel like you.", "繁忙的專櫃，難以了解香氣在肌膚上、在日常裡的感覺。在家慢慢試，盲測比較，留下像自己的氣息。", "繁忙的专柜，难以了解香气在肌肤上、在日常里的感觉。在家慢慢试，盲测比较，留下像自己的气息。"),
  science: text("Your nose has a point of view.", "你的鼻子，有自己的看法。", "你的鼻子，有自己的看法。"),
  relay: text("Smell mostly skips the brain's usual relay", "嗅覺大多略過大腦慣常的中轉站", "嗅觉大多略过大脑惯常的中转站"),
  scienceBody: text("Scent connects with emotion and memory networks. Receptor function varies between people. That gives us a reason to ask what you smell, rather than assume everyone smells the same.", "氣味與情緒和記憶網絡相連。不同人的受體功能有差異，因此我們詢問你的感受，而不假設大家聞到的一樣。", "气味与情绪和记忆网络相连。不同人的受体功能有差异，因此我们询问你的感受，而不假设大家闻到的一样。"),
  evidence: text("Read the evidence", "閱讀證據", "阅读证据"),
  steps: [
    [text("Test at home", "在家測試", "在家测试"), text("About 30 minutes. Blot, record pH, take lid photos, pause between smells and choose among six blind bases.", "約 30 分鐘。吸油、記錄 pH、拍攝盒蓋，在試香之間稍作停頓，從六款盲測基底中選擇。", "约 30 分钟。吸油、记录 pH、拍摄盒盖，在试香之间稍作停顿，从六款盲测基底中选择。")],
    [text("AI reads you", "AI 理解你的偏好", "AI 理解你的偏好"), text("Photo readings, scent ratings and routine tags inform bounded tuning rules. pH is recorded but never changes the formula.", "照片讀數、試香評分與生活標籤，供有限度的微調規則參考。pH 會被記錄，但不會改變配方。", "照片读数、试香评分与生活标签，供有限度的微调规则参考。pH 会被记录，但不会改变配方。")],
    [text("Your bottle", "你的香水", "你的香水"), text("A tuned version of the base you chose, with a reason for each change. A perfumer reviews every formula before mixing.", "微調你選擇的基礎香氣，每項變更都有理由。每個配方均由調香師審核後才調配。", "微调你选择的基础香气，每项变更都有理由。每个配方均由调香师审核后才调配。")],
  ],
  kit: text("A little lab. A lot to notice.", "小小實驗室，細細感受。", "小小实验室，细细感受。"),
  kitCaption: text("Kit layout study. Illustration, not a product photograph.", "套裝佈局示意，並非產品照片。", "套装布局示意，并非产品照片。"),
  kitItems: [text("Six blind base samples, A–F", "六款盲測基底樣本 A–F", "六款盲测基底样本 A–F"), text("Four sensitivity vials, including a blank", "四瓶嗅覺敏感度樣本，包括空白對照", "四瓶嗅觉敏感度样本，包括空白对照"), text("Blotting sheets, pH strips and control", "吸油紙、pH 試紙與對照", "吸油纸、pH 试纸与对照"), text("Scent strips and tweezers", "試香紙與鑷子", "试香纸与镊子"), text("Printed lid board with photo markers", "附照片定位標記的印刷盒蓋", "附照片定位标记的印刷盒盖")],
  lid: text("The lid becomes a measurement board: zone 1 for the blot, zone 2 for skin and control strips.", "盒蓋化身測量板：區域 1 放吸油紙，區域 2 放肌膚與對照試紙。", "盒盖化身测量板：区域 1 放吸油纸，区域 2 放肌肤与对照试纸。"),
  bases: text("Six starting points. Yours to explore.", "六個起點，等你探索。", "六个起点，等你探索。"),
  samples: text("Working names. Sample formulas, subject to perfumer review.", "暫定名稱與示例配方，待調香師審核。", "暂定名称与示例配方，待调香师审核。"),
  families: [text("Citrus", "柑橘", "柑橘"), text("Green", "綠意", "绿意"), text("Water", "水調", "水调"), text("Floral", "花香", "花香"), text("Woody", "木質", "木质"), text("Amber", "琥珀", "琥珀")],
  ai: text("A graph, with reasons.", "一張圖，每步都有理由。", "一张图，每步都有理由。"),
  aiBody: text("Your base stays recognisable. Oil readings suggest tier balance; sensitivity suggests concentration; your routine and preferences suggest accents. The language model explains the calculated changes. It does not write the formula.", "保留基底的特色。油脂讀數供香調層次參考；敏感度供濃度參考；生活與喜好供點綴香調參考。語言模型解釋計算結果，不撰寫配方。", "保留基底的特色。油脂读数供香调层次参考；敏感度供浓度参考；生活与喜好供点缀香调参考。语言模型解释计算结果，不撰写配方。"),
  graph: [text("Skin", "肌膚", "肌肤"), text("Nose", "嗅覺", "嗅觉"), text("Routine", "生活", "生活"), text("Base", "基底", "基底"), text("Top", "前調", "前调"), text("Heart", "中調", "中调"), text("Dry-down", "尾調", "尾调")],
  honest: text("A pause. No magic beans.", "稍作停頓，不用神奇豆子。", "稍作停顿，不用神奇豆子。"),
  honestBody: text("Pause between samples: 5 seconds for the intensity vials and 15 seconds for the blind bases. Breathe normally in unscented air. Recovery varies; a timer cannot guarantee a reset. In the sample demo, you can skip the pause to explore the flow.", "在樣本之間稍作停頓：強度試管 5 秒，盲測基底 15 秒。在無香的空氣中正常呼吸。恢復因人而異，計時器不能保證嗅覺重置。示範模式可跳過停頓，探索流程。", "在样本之间稍作停顿：强度试管 5 秒，盲测基底 15 秒。在无香的空气中正常呼吸。恢复因人而异，计时器不能保证嗅觉重置。示范模式可跳过停顿，探索流程。"),
  pricing: text("Choose your way in.", "選擇你的起點。", "选择你的起点。"),
  labKit: text("Lab kit + tuned 50 ml bottle", "實驗套裝 + 微調香水 50 ml", "实验套装 + 微调香水 50 ml"),
  discovery: text("Discovery kit", "探索套裝", "探索套装"),
  discoveryBody: text("Explore the six base samples at your own pace.", "按自己的節奏探索六款基底樣本。", "按自己的节奏探索六款基底样本。"),
  labBody: text("The at-home tests and a tuned bottle, with perfumer review.", "在家測試與微調香水，由調香師審核。", "在家测试与微调香水，由调香师审核。"),
  order: text("Order / join the waitlist", "訂購 / 加入候補名單", "订购 / 加入候补名单"),
  waitlist: text("Order links open the launch waitlist. Payment and fulfilment are not available here. Hong Kong delivery is planned; carrier acceptance remains to be confirmed.", "訂購連結會開啟推出候補名單，此處未提供付款及出貨。計劃於香港配送，承運安排待確認。", "订购链接会打开推出候补名单，此处未提供付款及出货。计划于香港配送，承运安排待确认。"),
  faq: text("Good questions. Honest answers.", "好問題，坦白回答。", "好问题，坦白回答。"),
  questions: [
    [text("Does the kit prove a better perfume match?", "套裝能證明香水更適合我嗎？", "套装能证明香水更适合我吗？"), text("Not yet. We need measurement-agreement tests and blind comparisons against recommendations based on a quiz. This is an exploratory prototype.", "尚未證明。我們需要測量一致性測試，以及與問卷推薦進行盲測比較。目前仍是探索原型。", "尚未证明。我们需要测量一致性测试，以及与问卷推荐进行盲测比较。目前仍是探索原型。")],
    [text("Does pH change my formula?", "pH 會改變配方嗎？", "pH 会改变配方吗？"), text("No. We record it as context. Evidence is too weak to use pH for formula tuning.", "不會。pH 作為背景資料記錄，證據不足以用作配方微調。", "不会。pH 作为背景资料记录，证据不足以用作配方微调。")],
    [text("Can I try without a kit?", "沒有套裝也能試嗎？", "没有套装也能试吗？"), text("Yes. The demo offers sample readings and simulated smell answers. They are examples, not measurements of you.", "可以。示範提供樣本讀數與模擬試香回答。這些是示例，並非你的測量結果。", "可以。演示提供样本读数与模拟试香回答。这些是示例，并非你的测量结果。")],
    [text("Is this a health test?", "這是健康測試嗎？", "这是健康测试吗？"), text("Not a medical or diagnostic device. It does not identify your genes, diagnose smell loss or assess skin health.", "並非醫療或診斷器材。不會識別基因、診斷嗅覺喪失或評估肌膚健康。", "并非医疗或诊断器材。不会识别基因、诊断嗅觉丧失或评估肌肤健康。")],
  ],
  closing: text("Your next scent starts with you.", "下一款香氣，從你開始。", "下一款香气，从你开始。"),
  scan: text("Scan to explore the demo on your phone", "掃描後用手機體驗示範", "扫描后用手机体验演示"),
  notes: text("Lab notes", "實驗筆記", "实验笔记"),
  tabs: [text("The AI", "AI 方法", "AI 方法"), text("The science", "科學依據", "科学依据"), text("The research", "研究查證", "研究查证")],
  notesBody: text("See the method, the evidence and the limits behind Element.", "了解 Element 的方法、證據與限制。", "了解 Element 的方法、证据与限制。"),
  back: text("Back to Element", "返回 Element", "返回 Element"),
  home: text("Home", "首頁", "首页"),
  source: text("Source", "來源", "来源"),
  sources: text("Sources and review", "來源與查證", "来源与查证"),
  top: text("Back to top", "返回頂部", "返回顶部"),
};

export const baseNames = ["Hours · Dawn", "Afterimage · Tea", "Afterimage · Harbour", "Hours · Noon", "Afterimage · Forest", "Hours · Night"];

// Link previews for /element pages: the Element logo on an absolute URL so chat apps can fetch it.
export const elementOg = (title: string, description: string) => ({
  title, description, siteName: "YAT.lifestyle", type: "website" as const,
  images: [{ url: "https://yatlifestyle.com/media/element-logo.png", width: 1146, height: 861, alt: "Element · YAT.lifestyle" }],
});
