// Copy for /element/tech. Every number cites a paper or a code/data source in `references` below;
// change the code and this together. tech-content.test.ts checks citations and punctuation.
import type { Localised } from "./types.ts";

const t = (en: string, hant: string, hans: string): Localised => ({ en, "zh-Hant": hant, "zh-Hans": hans });
const same = (s: string): Localised => t(s, s, s);

export type TechStep = { node: Localised; tools: string; title: Localised; body: Localised; ai?: boolean };
export type TechEntry = { mark: string; name: Localised; href?: string; why: Localised; cost: Localised };
export type TechSection = { id: string; title: Localised; overview: Localised; entries: TechEntry[] };
/** `claim` links to /element/research#<claim> when the lab notes review that source. */
export type TechReference = { n: number; text: string; href?: string; claim?: string; code?: true };

// Numbered in order of use. Titles stay in English in every locale.
export const references: TechReference[] = [
  { n: 1, text: "Courtiol E, Wilson DA. 2015. The olfactory thalamus: unanswered questions about the role of the mediodorsal thalamic nucleus in olfaction. Frontiers in Neural Circuits 9:49. doi:10.3389/fncir.2015.00049", href: "https://doi.org/10.3389/fncir.2015.00049", claim: "smell-relay" },
  { n: 2, text: "Herz RS, Eliassen J, Beland S, Souza T. 2004. Neuroimaging evidence for the emotional potency of odor-evoked memory. Neuropsychologia 42(3):371-378. doi:10.1016/j.neuropsychologia.2003.08.009", href: "https://pubmed.ncbi.nlm.nih.gov/14670575/", claim: "smell-emotion" },
  { n: 3, text: "Willander J, Larsson M. 2006. Smell your way back to childhood: autobiographical odor memory. Psychonomic Bulletin & Review 13(2):240-244. doi:10.3758/bf03193837", href: "https://pubmed.ncbi.nlm.nih.gov/16892988/", claim: "smell-memory" },
  { n: 4, text: "Mainland JD, Keller A, Li YR, et al. 2014. The missense of smell: functional variability in the human odorant receptor repertoire. Nature Neuroscience 17(1):114-120. doi:10.1038/nn.3598", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3990440/", claim: "receptor-variation" },
  { n: 5, text: "Keller A, Zhuang H, Chi Q, Vosshall LB, Matsunami H. 2007. Genetic variation in a human odorant receptor alters odour perception. Nature 449(7161):468-472. doi:10.1038/nature06162", href: "https://doi.org/10.1038/nature06162", claim: "or7d4" },
  { n: 6, text: "Keller A, Vosshall LB. 2016. Olfactory perception of chemically diverse molecules. BMC Neuroscience 17:55. doi:10.1186/s12868-016-0287-2. Dataset CC BY 4.0; CSV via Pyrfume (keller_2016).", href: "https://doi.org/10.1186/s12868-016-0287-2", claim: "nose-dataset" },
  { n: 7, text: "Hummel T, Sekinger B, Wolf SR, Pauli E, Kobal G. 1997. 'Sniffin' Sticks': olfactory performance assessed by the combined testing of odor identification, odor discrimination and olfactory threshold. Chemical Senses 22(1):39-52. doi:10.1093/chemse/22.1.39", href: "https://pubmed.ncbi.nlm.nih.gov/9056084/", claim: "sensitivity-ladder" },
  { n: 8, text: "Green DM, Swets JA. 1966. Signal Detection Theory and Psychophysics. New York: Wiley." },
  { n: 9, text: "Philpott CM, Wolstenholme CR, Goodenough PC, Clark A, Murty GE. 2008. Olfactory clearance: what time is needed in clinical practice? Journal of Laryngology & Otology 122(9):912-917. doi:10.1017/S0022215107000977", href: "https://pubmed.ncbi.nlm.nih.gov/18036276/", claim: "timed-pause" },
  { n: 10, text: "Grosofsky A, Haupert ML, Versteeg SW. 2011. An exploratory investigation of coffee and lemon scents and odor identification. Perceptual and Motor Skills 112(2):536-538. doi:10.2466/24.PMS.112.2.536-538", href: "https://pubmed.ncbi.nlm.nih.gov/21667761/", claim: "coffee-beans" },
  { n: 11, text: "Garrido-Jurado S, Muñoz-Salinas R, Madrid-Cuevas FJ, Marín-Jiménez MJ. 2014. Automatic generation and detection of highly reliable fiducial markers under occlusion. Pattern Recognition 47(6):2280-2292. doi:10.1016/j.patcog.2014.01.005", href: "https://doi.org/10.1016/j.patcog.2014.01.005" },
  { n: 12, text: "Hartley R, Zisserman A. 2004. Multiple View Geometry in Computer Vision, 2nd ed. Cambridge University Press. doi:10.1017/CBO9780511811685", href: "https://doi.org/10.1017/CBO9780511811685" },
  { n: 13, text: "CIE. 2004. CIE 15:2004 Colorimetry, 3rd ed. Vienna: Commission Internationale de l'Eclairage. (CIE 1976 L*a*b* space and colour difference.)" },
  { n: 14, text: "Lloyd SP. 1982. Least squares quantization in PCM. IEEE Transactions on Information Theory 28(2):129-137. doi:10.1109/TIT.1982.1056489", href: "https://doi.org/10.1109/TIT.1982.1056489" },
  { n: 15, text: "Rousseeuw PJ. 1987. Silhouettes: a graphical aid to the interpretation and validation of cluster analysis. Journal of Computational and Applied Mathematics 20:53-65. doi:10.1016/0377-0427(87)90125-7", href: "https://doi.org/10.1016/0377-0427(87)90125-7" },
  { n: 16, text: "Hoerl AE, Kennard RW. 1970. Ridge regression: biased estimation for nonorthogonal problems. Technometrics 12(1):55-67. doi:10.1080/00401706.1970.10488634", href: "https://doi.org/10.1080/00401706.1970.10488634" },
  { n: 17, text: "Li B, Kamarck ML, Peng Q, et al. 2022. From musk to body odor: decoding olfaction through genetic variation. PLoS Genetics 18(2):e1009564. doi:10.1371/journal.pgen.1009564", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8812863/", claim: "musk-sensitivity" },
  { n: 18, text: "Lambers H, Piessens S, Bloem A, Pronk H, Finkel P. 2006. Natural skin surface pH is on average below 5, which is beneficial for its resident flora. International Journal of Cosmetic Science 28(5):359-370. doi:10.1111/j.1467-2494.2006.00344.x", href: "https://doi.org/10.1111/j.1467-2494.2006.00344.x", claim: "skin-ph" },
  { n: 19, text: "Hadjiefstathiou E, Savary G, Malhiac C, Terescenco D, Picard C. 2025. Exploring the impact of fragrance molecular and skin properties on the evaporation profile of fragrances. International Journal of Cosmetic Science 47(6):981-995. doi:10.1111/ics.13085", href: "https://doi.org/10.1111/ics.13085", claim: "kit-validation" },
  { n: 20, text: "Roberts SC, Little AC, Lyndon A, Roberts J, Havlicek J, Wright RL. 2009. Manipulation of body odour alters men's self-confidence and judgements of their visual attractiveness by women. International Journal of Cosmetic Science 31(1):47-54. doi:10.1111/j.1468-2494.2008.00477.x", href: "https://pubmed.ncbi.nlm.nih.gov/19134127/", claim: "scent-confidence" },
  { n: 21, code: true, text: "Element source: browser lid reader. lib/element/photo-math.ts; app/element/demo/photo-reader.ts; public/kit/lid-board.json." },
  { n: 22, code: true, text: "Element source: Python reference reader and board generator. scripts/photo_reader.py; scripts/test_photo_reader.py; scripts/make-lid-board.py." },
  { n: 23, code: true, text: "Element source: survey bank and engine. lib/element/survey-bank.ts; lib/element/survey.ts." },
  { n: 24, code: true, text: "Element source: API, model calls, time budgets, validation and upload limits. lib/element/api.server.ts; app/api/element/[action]/route.ts." },
  { n: 25, code: true, text: "Element nose model: training, evaluation and inference. docs/element-nose-model.md; scripts/train-nose-model.py; lib/element/nose.ts; lib/element/nose-model.json." },
  { n: 26, code: true, text: "Element source: note graph, tuning rules, bases and sensitivity ladder. lib/element/graph.ts; lib/element/tune.ts; lib/element/bases.ts; lib/element/ladder.ts." },
  { n: 27, code: true, text: "Element source: explanation templates and validator. lib/element/explain.ts." },
  { n: 28, code: true, text: "Element source: accounts, profiles and compare. lib/element/auth.server.ts; lib/element/compare.ts; app/element/styled-qr.tsx." },
  { n: 29, code: true, text: "Element configuration: Cloudflare bindings and rate limits, database schema. wrangler.jsonc; migrations/0001-0005." },
  { n: 30, code: true, text: "Reader measurements, 4 October 2026: scripts/photo_reader.py and the browser reader (dev page /element/demo/photo-reader-check) run on public/kit/test-photos (synthetic-board-test.png, blot-dark.webp) and scripts/kit-assets/test-photos (v12-clean-blot, v12-oily-blot, v12-no-blot)." },
  { n: 31, code: true, text: "Test run, 4 October 2026: npm test (node --test \"lib/**/*.test.ts\")." },
  { n: 32, code: true, text: "Element commit history: b40f05d (survey model budget after about 3.5 s live answers); cede9f6 (AI Gateway routing)." },
];

export const techCopy = {
  tab: t("Technology", "技術", "技术"),
  link: t("Read the technical write-up", "閱讀技術報告", "阅读技术报告"),
  title: t("Technology", "技術", "技术"),
  intro: t(
    "A technical write-up of Element: what we built, how each part works, what we measured and where it falls short. Each tool is listed with the reason we chose it and what that choice costs us. Bracketed numbers point to the references at the end.",
    "Element 的技術報告：我們建造了甚麼、各部分如何運作、量度了甚麼，以及不足之處。每項工具都列出選用原因與相應代價。方括號內的數字對應文末參考文獻。",
    "Element 的技术报告：我们建造了什么、各部分如何运作、测量了什么，以及不足之处。每项工具都列出选用原因与相应代价。方括号内的数字对应文末参考文献。",
  ),
  onPage: t("On this page", "本頁內容", "本页内容"),
  cost: t("What it costs us", "我們付出的代價", "我们付出的代价"),
  aiMark: same("AI"),
  abstractNav: t("Abstract", "摘要", "摘要"),
  methodsNav: t("1. Methods", "1. 方法", "1. 方法"),
  resultsNav: t("2. Results", "2. 結果", "2. 结果"),
  limitsNav: t("3. Limitations", "3. 限制", "3. 限制"),
  stackNav: t("4. Technology stack", "4. 技術架構", "4. 技术架构"),
  refsNav: t("References", "參考文獻", "参考文献"),
  abstractTitle: t("Abstract", "摘要", "摘要"),
  abstract: t(
    "Element is an at-home perfume kit with a web app that tunes one of six base formulas to a person. A printed lid lets a phone camera measure an oil blot and record skin pH; a four-vial sensitivity ladder and a short adaptive survey describe sensitivity and routine; a nose model trained on public smell data [6] fills in scent-family preferences; and bounded, deterministic rules adjust the formula, which a perfumer reviews before mixing. Language models choose survey questions and explain computed changes, under validators that fall back to written templates. Smell is closely tied to emotion and memory networks [1, 2, 3] and differs between people at the receptor level [4, 5], which is why we treat preference as personal; we make no health, memory or confidence claims [20]. We report the nose model's leave-one-person-out error (0.178 against a 0.300 baseline), agreement between the browser and Python photo readers (oil within 0.002), readings from real photos of the printed lid, and the limits of each part [25, 30].",
    "Element 是一套家用香水套裝，配合網頁應用程式，把六款基底配方之一微調至適合個人。印刷盒蓋讓手機鏡頭量度吸油紙並記錄肌膚 pH；四瓶敏感度階梯與簡短的自適應問卷描述敏感度與日常作息；以公開嗅覺數據 [6] 訓練的嗅覺模型補足香調家族喜好；有限度且確定性的規則微調配方，再由調香師審核後才調配。語言模型負責選擇問卷問題與解釋已計算的變更，並受驗證器約束，不合格時改用預先撰寫的模板。嗅覺與情緒及記憶網絡緊密相連 [1, 2, 3]，在受體層面亦因人而異 [4, 5]，因此我們視喜好為個人特質；我們不作任何健康、記憶或自信方面的聲稱 [20]。本文報告嗅覺模型的留一人誤差（0.178，基線為 0.300）、瀏覽器與 Python 照片讀取器的一致程度（油脂差距在 0.002 以內）、印刷盒蓋真實照片的讀數，以及各部分的限制 [25, 30]。",
    "Element 是一套家用香水套装，配合网页应用，把六款基底配方之一微调至适合个人。印刷盒盖让手机镜头测量吸油纸并记录肌肤 pH；四瓶敏感度阶梯与简短的自适应问卷描述敏感度与日常作息；以公开嗅觉数据 [6] 训练的嗅觉模型补足香调家族喜好；有限度且确定性的规则微调配方，再由调香师审核后才调配。语言模型负责选择问卷问题与解释已计算的变更，并受验证器约束，不合格时改用预先撰写的模板。嗅觉与情绪及记忆网络紧密相连 [1, 2, 3]，在受体层面也因人而异 [4, 5]，因此我们视喜好为个人特质；我们不作任何健康、记忆或自信方面的声称 [20]。本文报告嗅觉模型的留一人误差（0.178，基线为 0.300）、浏览器与 Python 照片读取器的一致程度（油脂差距在 0.002 以内）、印刷盒盖真实照片的读数，以及各部分的限制 [25, 30]。",
  ),
  journeyTitle: t("1. Methods: from a lid photo to a perfumer's bench", "1. 方法：由盒蓋照片到調香師工作台", "1. 方法：由盒盖照片到调香师工作台"),
  journeyIntro: t(
    "One test, followed from start to finish. Steps marked AI call a model while the test runs; every other step is ordinary code that we can test and read. Where a model is used, its answer is checked, and a plain fallback is ready if the check fails.",
    "完整跟隨一次測試。標示 AI 的步驟會在測試期間調用模型，其餘步驟都是可以測試、可以閱讀的一般程式。凡用到模型，答案都會被檢查；檢查不通過時，有簡單的後備方案接手。",
    "完整跟随一次测试。标示 AI 的步骤会在测试期间调用模型，其余步骤都是可以测试、可以阅读的普通代码。凡用到模型，答案都会被检查；检查不通过时，有简单的后备方案接手。",
  ),
  dataLane: t("Your data path", "你的資料路徑", "你的数据路径"),
  buildLane: t("Build and release", "建置與發佈", "构建与发布"),
  diagramLabel: t(
    "System diagram. Top lane, your data path: scan the lid QR, guided test, lid photos read on the phone, adaptive survey and voice, nose model, note-graph tuning, explanation, share and compare, perfumer review. Bottom lane, build and release: Python reference reader, browser port, tests, D1 migrations, review and deploy to Cloudflare Workers.",
    "系統圖。上方是你的資料路徑：掃描盒蓋 QR 碼、引導測試、手機讀取盒蓋照片、自適應問卷與語音、嗅覺模型、香調圖微調、解釋、分享與比較、調香師審核。下方是建置與發佈：Python 參考讀取器、瀏覽器移植、測試、D1 遷移、審查後部署到 Cloudflare Workers。",
    "系统图。上方是你的数据路径：扫描盒盖二维码、引导测试、手机读取盒盖照片、自适应问卷与语音、嗅觉模型、香调图微调、解释、分享与比较、调香师审核。下方是构建与发布：Python 参考读取器、浏览器移植、测试、D1 迁移、审查后部署到 Cloudflare Workers。",
  ),
  diagramCaption: t(
    "Figure 1. Top lane: what happens to one person's data. Bottom lane: how the code gets there. Gold outlines mark steps that call an AI model while the test runs.",
    "圖 1。上方：一個人的資料經歷甚麼。下方：程式如何到達那裏。金色外框標示測試期間會調用 AI 模型的步驟。",
    "图 1。上方：一个人的数据经历什么。下方：代码如何到达那里。金色外框标示测试期间会调用 AI 模型的步骤。",
  ),
  buildTitle: t("Build and release", "建置與發佈", "构建与发布"),
  steps: [
    {
      node: t("Scan the lid QR", "掃描盒蓋 QR 碼", "扫描盒盖二维码"), tools: "qr-code-styling",
      title: t("Scan the QR on the printed lid", "掃描印在盒蓋上的 QR 碼", "扫描印在盒盖上的二维码"),
      body: t(
        "The kit lid carries a QR code that opens the guided test at yatlifestyle.com/element/demo. Every QR the site draws, including share and compare links, uses the same rounded gold style with the Element mark in the centre and error-correction level H, so the logo does not stop phones from reading it [28].",
        "套裝盒蓋印有 QR 碼，掃描後會在 yatlifestyle.com/element/demo 開啟引導測試。網站產生的每個 QR 碼，包括分享與比較連結，都採用同一款圓點金色樣式，中央有 Element 標誌，並使用 H 級容錯，因此標誌不會妨礙手機讀取 [28]。",
        "套装盒盖印有二维码，扫描后会在 yatlifestyle.com/element/demo 打开引导测试。网站生成的每个二维码，包括分享与比较链接，都采用同一款圆点金色样式，中央有 Element 标志，并使用 H 级容错，因此标志不会妨碍手机读取 [28]。",
      ),
    },
    {
      node: t("Guided test", "引導測試", "引导测试"), tools: "vinext · React · Workers",
      title: t("A guided test on the phone", "在手機上進行引導測試", "在手机上进行引导测试"),
      body: t(
        "The test is one page that walks through consent, setup, a four-vial sensitivity ladder, scent ratings, the lid photos and the survey. The ladder hides a blank, a weak, a medium and a strong vial behind numbers: reporting the blank is treated as a false alarm and missing the strong vial as a miss, borrowing the logic of signal detection [8] and, loosely, of staircase threshold tests [7]. Either outcome halves the weight given to the person's traits [26]. Between scents the test asks for a short pause and a sniff of the inner elbow; recovery time depends on the odour and the person [9], and coffee beans showed no advantage in the one exploratory test we found [10]. A session is created after the person confirms they are 18 or over and gives consent [24].",
        "測試是一個頁面，依次帶你完成同意、準備、四瓶敏感度階梯、香氣評分、盒蓋拍照與問卷。階梯以編號隱藏空白、弱、中、強四瓶：聞到空白瓶視為誤報，聞不到最強一瓶視為漏報，借用訊號偵測的邏輯 [8]，並大致參考階梯式閾值測試 [7]。出現任一情況，使用者特徵的權重便減半 [26]。兩款香氣之間，測試會請使用者稍作停頓並聞一聞手肘內側；恢復所需時間因氣味與個人而異 [9]，而我們找到的一項探索性研究顯示咖啡豆並無優勢 [10]。使用者確認年滿 18 歲並表示同意後，系統才建立測試流程 [24]。",
        "测试是一个页面，依次带你完成同意、准备、四瓶敏感度阶梯、香气评分、盒盖拍照与问卷。阶梯以编号隐藏空白、弱、中、强四瓶：闻到空白瓶视为误报，闻不到最强一瓶视为漏报，借用信号检测的逻辑 [8]，并大致参考阶梯式阈值测试 [7]。出现任一情况，用户特征的权重便减半 [26]。两款香气之间，测试会请用户稍作停顿并闻一闻手肘内侧；恢复所需时间因气味与个人而异 [9]，而我们找到的一项探索性研究显示咖啡豆并无优势 [10]。用户确认年满 18 岁并表示同意后，系统才建立测试流程 [24]。",
      ),
    },
    {
      node: t("Lid photos, read on the phone", "手機讀取盒蓋照片", "手机读取盒盖照片"), tools: "js-aruco2 · photo-math", ai: true,
      title: t("Lid photos, read on the phone", "盒蓋照片，在手機上讀取", "盒盖照片，在手机上读取"),
      body: t(
        "The phone finds the printed ArUco fiducial markers (4x4 dictionary) [11] with js-aruco2, uses the four markers around each zone to solve a four-point homography [12], and straightens the zone to 10 pixels per millimetre. White and black patches printed on the lid normalise the colour. The blot is scored against its own dry border and a six-step printed scale, and each pH pad is converted to CIELAB and matched to the printed chart by colour difference, deltaE [13]. Blur, glare and shadow become quality flags instead of silent errors [21]. The server receives the straightened zone and the numbers; a vision model then checks placement and glare, and never produces a measurement [24].",
        "手機以 js-aruco2 找出印刷的 ArUco 定位標記（4x4 字典）[11]，用每個區域四角的標記求解四點單應性變換 [12]，把區域拉正至每毫米 10 像素。盒蓋上印刷的白色與黑色色塊用來校正色彩。吸油紙與自身的乾燥邊緣及六級印刷色階比較；每個 pH 色墊轉換為 CIELAB 後，以色差 deltaE 與印刷色表配對 [13]。模糊、反光與陰影會成為品質提示，而不是無聲的錯誤 [21]。伺服器收到拉正後的區域與數字，再由視覺模型檢查擺放位置與反光，它從不產生任何測量數值 [24]。",
        "手机以 js-aruco2 找出印刷的 ArUco 定位标记（4x4 字典）[11]，用每个区域四角的标记求解四点单应性变换 [12]，把区域拉正至每毫米 10 像素。盒盖上印刷的白色与黑色色块用来校正色彩。吸油纸与自身的干燥边缘及六级印刷色阶比较；每个 pH 色垫转换为 CIELAB 后，以色差 deltaE 与印刷色表匹配 [13]。模糊、反光与阴影会成为质量提示，而不是无声的错误 [21]。服务器收到拉正后的区域与数字，再由视觉模型检查摆放位置与反光，它从不产生任何测量数值 [24]。",
      ),
    },
    {
      node: t("Adaptive survey + voice", "自適應問卷 + 語音", "自适应问卷 + 语音"), tools: "Llama 3.3 70B · Whisper · bge-m3", ai: true,
      title: t("An adaptive survey, with optional voice", "自適應問卷，可選用語音", "自适应问卷，可选用语音"),
      body: t(
        "A bank of 27 questions in three languages covers routine, climate, activity, social settings, memories and dislikes [23]. After the opening question, Llama 3.3 70B on Workers AI, called through AI Gateway, either picks the next bank question or writes a short follow-up. Its answer is validated: English and Chinese ban lists, at most 120 characters, two to five answer chips, the right script for the chosen language, and no more than three AI follow-ups in a test. Anything that fails, or arrives too late, is replaced by the next bank question [23, 24]. People can also answer by voice: Whisper large v3 turbo transcribes, bge-m3 embeds the transcript, and Vectorize returns the closest of 71 lifestyle tags [24].",
        "題庫有 27 條問題，以三種語言撰寫，涵蓋日常作息、氣候、活動、社交場合、回憶與不喜歡的氣味 [23]。開首一題之後，經 AI Gateway 調用的 Workers AI Llama 3.3 70B 會選出下一條題庫問題，或寫一條簡短追問。它的答案會被驗證：英文與中文禁用詞表、最多 120 個字元、二至五個答案選項、與所選語言相符的文字，以及每次測試最多三條 AI 追問。任何不合格或太遲的答案，都會由下一條題庫問題取代 [23, 24]。使用者亦可用語音回答：Whisper large v3 turbo 轉寫語音，bge-m3 把文字轉為向量，Vectorize 再從 71 個生活標籤中找出最接近的標籤 [24]。",
        "题库有 27 道问题，以三种语言撰写，涵盖日常作息、气候、活动、社交场合、回忆与不喜欢的气味 [23]。开头一题之后，经 AI Gateway 调用的 Workers AI Llama 3.3 70B 会选出下一道题库问题，或写一道简短追问。它的答案会被验证：英文与中文禁用词表、最多 120 个字符、二至五个答案选项、与所选语言相符的文字，以及每次测试最多三道 AI 追问。任何不合格或太迟的答案，都会由下一道题库问题取代 [23, 24]。用户也可以用语音回答：Whisper large v3 turbo 转写语音，bge-m3 把文字转为向量，Vectorize 再从 71 个生活标签中找出最接近的标签 [24]。",
      ),
    },
    {
      node: t("Nose model", "嗅覺模型", "嗅觉模型"), tools: "scikit-learn → JSON",
      title: t("A nose model trained on real smell data", "以真實嗅覺數據訓練的模型", "以真实嗅觉数据训练的模型"),
      body: t(
        "Scent-family ratings go into a small model trained offline on Keller and Vosshall (2016): 55 people rating 480 molecules, published under CC BY 4.0 [6]. k-means clustering [14] with k = 3, chosen by silhouette score [15], groups people into three nose types (Discerning, Open and Balanced), and ridge regression [16] fills in the families a person did not rate. The trained model ships as a JSON file inside the Worker, so inference is a few lines of arithmetic and needs no model call [25].",
        "香調家族評分會輸入一個離線訓練的小型模型，訓練數據來自 Keller 與 Vosshall（2016）：55 人為 480 種分子評分，以 CC BY 4.0 發佈 [6]。以輪廓係數 [15] 選定 k = 3 的 k-means 聚類 [14]，把人分為三種嗅覺類型（精挑細選型、樂於嘗試型、均衡型），嶺迴歸 [16] 則補上使用者未評分的家族。訓練好的模型以 JSON 檔案放在 Worker 內，推算只需幾行算式，毋須調用模型 [25]。",
        "香调家族评分会输入一个离线训练的小型模型，训练数据来自 Keller 与 Vosshall（2016）：55 人为 480 种分子评分，以 CC BY 4.0 发布 [6]。以轮廓系数 [15] 选定 k = 3 的 k-means 聚类 [14]，把人分为三种嗅觉类型（精挑细选型、乐于尝试型、均衡型），岭回归 [16] 则补上用户未评分的家族。训练好的模型以 JSON 文件放在 Worker 内，推算只需几行算式，无须调用模型 [25]。",
      ),
    },
    {
      node: t("Note-graph tuning", "香調圖微調", "香调图微调"), tools: "TypeScript rules",
      title: t("Deterministic note-graph tuning", "確定性的香調圖微調", "确定性的香调图微调"),
      body: t(
        "A rule engine adjusts one of six base formulas. Traits such as oil level, routine tags and the musk flag push notes and tiers by fixed amounts. Each note moves by at most 20% of its weight or 6 points, whichever is larger, and at most two harmonious accents can be added, along curated pairs of notes that sit well together [26]. Skin properties have been linked to fragrance evaporation in a laboratory study, but that study does not validate a consumer blot photo [19], so oil changes are small and bounded. pH is recorded but never changes the formula [18, 19, 26]. Each base lists the real perfumer oils it is made from, from our supplier Candle Element [26].",
        "規則引擎會微調六款基底配方之一。油脂程度、生活標籤與麝香提示等特徵，會按固定幅度推動個別香調與層次。每項香調最多變動其比重的 20% 或 6 個百分點，取較大者；最多加入兩項和諧點綴，而且只沿着經挑選、彼此相配的香調配對加入 [26]。一項實驗室研究把肌膚特性與香氣蒸發聯繫起來，但它並未驗證消費者拍攝的吸油照片 [19]，因此油脂帶來的變動細小而有限。pH 會被記錄，但從不改變配方 [18, 19, 26]。每款基底都列出實際使用的調香油，來自我們的供應商 Candle Element [26]。",
        "规则引擎会微调六款基底配方之一。油脂程度、生活标签与麝香提示等特征，会按固定幅度推动个别香调与层次。每项香调最多变动其比重的 20% 或 6 个百分点，取较大者；最多加入两项和谐点缀，而且只沿着经挑选、彼此相配的香调配对加入 [26]。一项实验室研究把肌肤特性与香气蒸发联系起来，但它并未验证消费者拍摄的吸油照片 [19]，因此油脂带来的变动小而有限。pH 会被记录，但从不改变配方 [18, 19, 26]。每款基底都列出实际使用的调香油，来自我们的供应商 Candle Element [26]。",
      ),
    },
    {
      node: t("Explanation", "解釋", "解释"), tools: "Llama 3.3 70B + validator", ai: true,
      title: t("An explanation that cannot change the formula", "不能改動配方的解釋", "不能改动配方的解释"),
      body: t(
        "Llama 3.3 70B rewrites the computed changes as plain sentences, one per change, in the person's language. A validator checks every sentence against the change list: the right note, no other notes, no numbers except that change's before and after values, and no pH. If any line fails, or the model is slow, the page uses fixed templates that say the same thing [27].",
        "Llama 3.3 70B 把已計算的變更改寫成淺白句子，每項變更一句，使用使用者的語言。驗證器逐句對照變更清單：香調要正確、不得提及其他香調、除該項變更的前後數值外不得有其他數字，也不得提及 pH。任何一句不通過，或模型太慢，頁面便改用表達相同內容的固定模板 [27]。",
        "Llama 3.3 70B 把已计算的变更改写成浅白句子，每项变更一句，使用用户的语言。验证器逐句对照变更清单：香调要正确、不得提及其他香调、除该项变更的前后数值外不得有其他数字，也不得提及 pH。任何一句不通过，或模型太慢，页面便改用表达相同内容的固定模板 [27]。",
      ),
    },
    {
      node: t("Share + compare", "分享 + 比較", "分享 + 比较"), tools: "D1 · Email Service",
      title: t("Share and compare, on your terms", "分享與比較，由你決定", "分享与比较，由你决定"),
      body: t(
        "Results and profiles are stored in D1. Profiles are private by default; sharing creates an unlisted link and a styled QR, and a shared profile carries family likes, nose type and tags, never skin, oil or pH. Accounts use a six-digit code sent by Cloudflare Email Service. Two profiles can be compared with a score built from family likes and shared tags [28].",
        "結果與個人檔案儲存在 D1。個人檔案預設為私人；分享時會建立不公開列出的連結與特製 QR 碼。分享出去的檔案只包含香調家族喜好、嗅覺類型與標籤，從不包含肌膚、油脂或 pH。帳戶使用由 Cloudflare Email Service 寄出的六位數字碼。兩份檔案可以比較，分數由香調家族喜好與共同標籤計算 [28]。",
        "结果与个人档案储存在 D1。个人档案默认为私密；分享时会建立不公开列出的链接与定制二维码。分享出去的档案只包含香调家族喜好、嗅觉类型与标签，从不包含肌肤、油脂或 pH。账户使用由 Cloudflare Email Service 发送的六位数字码。两份档案可以比较，分数由香调家族喜好与共同标签计算 [28]。",
      ),
    },
    {
      node: t("Perfumer review", "調香師審核", "调香师审核"), tools: "People",
      title: t("A perfumer reviews before mixing", "調香師審核後才調配", "调香师审核后才调配"),
      body: t(
        "No formula is mixed straight from the screen. A perfumer reviews each tuned formula and its materials list before anything is blended, and has the final word on every change [27].",
        "沒有配方會直接按畫面調配。調香師會先審核每條微調後的配方及其材料清單，才開始調配，並對每項變更有最終決定權 [27]。",
        "没有配方会直接按画面调配。调香师会先审核每条微调后的配方及其材料清单，才开始调配，并对每项变更有最终决定权 [27]。",
      ),
    },
  ] satisfies TechStep[],
  build: [
    {
      node: t("Python reference", "Python 參考版", "Python 参考版"), tools: "OpenCV",
      title: t("Python reference reader", "Python 參考讀取器", "Python 参考读取器"),
      body: t(
        "The lid reader was written in Python with OpenCV, tested on real lid photos for marker detection and on a rendered board, flat and in perspective, for full readings [22].",
        "盒蓋讀取器先以 Python 與 OpenCV 寫成，用真實盒蓋照片測試標記偵測，並用渲染出來的測量板（平放及透視角度）測試完整讀數 [22]。",
        "盒盖读取器先以 Python 与 OpenCV 写成，用真实盒盖照片测试标记检测，并用渲染出来的测量板（平放及透视角度）测试完整读数 [22]。",
      ),
    },
    {
      node: t("Browser port", "瀏覽器移植", "浏览器移植"), tools: "js-aruco2 · TypeScript",
      title: t("Browser port", "瀏覽器移植", "浏览器移植"),
      body: t(
        "The same steps and thresholds were ported to TypeScript, with a development page that runs the browser reader on the same test images as the Python tests [21].",
        "相同的步驟與門檻移植到 TypeScript，並設有開發頁面，以 Python 測試所用的同一批圖片執行瀏覽器讀取器 [21]。",
        "相同的步骤与阈值移植到 TypeScript，并设有开发页面，以 Python 测试所用的同一批图片运行浏览器读取器 [21]。",
      ),
    },
    {
      node: t("Tests", "測試", "测试"), tools: "node --test",
      title: t("Automated tests", "自動測試", "自动测试"),
      body: t(
        "45 Element unit tests (51 in the whole suite) run with Node's built-in test runner [31].",
        "45 項 Element 單元測試（整套共 51 項）以 Node 內置的測試工具執行 [31]。",
        "45 项 Element 单元测试（整套共 51 项）以 Node 内置的测试工具运行 [31]。",
      ),
    },
    {
      node: t("D1 migrations", "D1 遷移", "D1 迁移"), tools: "SQL",
      title: t("Database migrations", "資料庫遷移", "数据库迁移"),
      body: t(
        "Five SQL migrations define the newsletter and Element tables [29].",
        "五個 SQL 遷移檔定義電子報與 Element 的資料表 [29]。",
        "五个 SQL 迁移文件定义电子报与 Element 的数据表 [29]。",
      ),
    },
    {
      node: t("Review, then deploy", "審查後部署", "审查后部署"), tools: "Wrangler → Workers",
      title: t("Review, then deploy", "審查後部署", "审查后部署"),
      body: t(
        "Each task was reviewed before merging; the site is built with vinext and deployed with Wrangler to Cloudflare Workers [29].",
        "每項工作在合併前都經過審查；網站以 vinext 建置，再用 Wrangler 部署到 Cloudflare Workers [29]。",
        "每项工作在合并前都经过审查；网站以 vinext 构建，再用 Wrangler 部署到 Cloudflare Workers [29]。",
      ),
    },
  ] satisfies TechStep[],
  resultsTitle: t("2. Results", "2. 結果", "2. 结果"),
  resultsIntro: t(
    "Every value below was measured, and each gives its source; nothing here is an estimate.",
    "以下只列出實際量度的數值，每項都註明來源，並無任何估算。",
    "以下只列出实际测量的数值，每项都注明来源，并无任何估算。",
  ),
  results: [
    {
      title: t("Nose model", "嗅覺模型", "嗅觉模型"),
      body: t(
        "Silhouette scores favoured k = 3 (0.311, against 0.257, 0.243 and 0.201 for k = 4, 5 and 6) [15, 25]. In leave-one-person-out evaluation over 55 folds and 330 held-out person and family targets, the ridge model's mean absolute error was 0.178 on a 1 to 5 scale, against 0.300 for predicting the training mean. The model beat the baseline in all six families, with errors from 0.147 (floral) to 0.213 (woody) [25].",
        "輪廓係數支持 k = 3（0.311，而 k = 4、5、6 分別為 0.257、0.243、0.201）[15, 25]。在 55 輪留一人評估、共 330 個留出的個人及家族目標上，嶺迴歸模型的平均絕對誤差為 0.178（1 至 5 分制），預測訓練平均值的基線為 0.300。模型在全部六個家族都優於基線，誤差由 0.147（花香）至 0.213（木質）[25]。",
        "轮廓系数支持 k = 3（0.311，而 k = 4、5、6 分别为 0.257、0.243、0.201）[15, 25]。在 55 轮留一人评估、共 330 个留出的个人及家族目标上，岭回归模型的平均绝对误差为 0.178（1 至 5 分制），预测训练平均值的基线为 0.300。模型在全部六个家族都优于基线，误差由 0.147（花香）至 0.213（木质）[25]。",
      ),
    },
    {
      title: t("Browser reader against the Python reference", "瀏覽器讀取器與 Python 參考版比較", "浏览器读取器与 Python 参考版比较"),
      body: t(
        "We ran both readers on five images: a rendered board, a real photo of an earlier lid layout, and three real photos of the current printed lid. They found the same markers, matched the same scale step and made the same accept or refuse decisions on every image. Oil readings differed by at most 0.002 and pH readings by at most 0.008. On the rendered board, both recovered the painted pH values of 5.5 and 8.0 [21, 22, 30].",
        "我們在五張圖片上執行兩個讀取器：一張渲染測量板、一張舊版盒蓋的真實照片，以及三張現版印刷盒蓋的真實照片。兩者在每張圖片上找到相同的標記、配對相同的色階級數，並作出相同的接受或拒絕決定。油脂讀數差距最多 0.002，pH 讀數差距最多 0.008。在渲染測量板上，兩者都還原了上色的 pH 值 5.5 與 8.0 [21, 22, 30]。",
        "我们在五张图片上运行两个读取器：一张渲染测量板、一张旧版盒盖的真实照片，以及三张现版印刷盒盖的真实照片。两者在每张图片上找到相同的标记、匹配相同的色阶级数，并作出相同的接受或拒绝决定。油脂读数差距最多 0.002，pH 读数差距最多 0.008。在渲染测量板上，两者都还原了上色的 pH 值 5.5 与 8.0 [21, 22, 30]。",
      ),
    },
    {
      title: t("Real photos of the printed lid", "印刷盒蓋的真實照片", "印刷盒盖的真实照片"),
      body: t(
        "Both readers detected all 8 markers in 3 of 3 photos of the current lid. Oil read 0.019 for a clean sheet and 0.085 (Python) or 0.087 (browser) for an oily sheet, on a 0 to 1 scale, matching scale steps 1 and 2. With no sheet in place, the reader returned 0.54; telling a missing sheet from an oily one is left to the placement check. With dry strips in the slots, pH confidence was between 0.02 and 0.08, too low to report a pH [30].",
        "兩個讀取器在三張現版盒蓋照片中，全部偵測到 8 個標記。油脂讀數方面，乾淨吸油紙為 0.019，油性吸油紙為 0.085（Python）或 0.087（瀏覽器），以 0 至 1 計，對應色階第 1 與第 2 級。沒有放吸油紙時，讀取器傳回 0.54；分辨「沒有紙」與「油性紙」要靠擺放檢查。槽內放的是乾試紙時，pH 可信度介乎 0.02 至 0.08，低得不足以報告 pH 值 [30]。",
        "两个读取器在三张现版盒盖照片中，全部检测到 8 个标记。油脂读数方面，干净吸油纸为 0.019，油性吸油纸为 0.085（Python）或 0.087（浏览器），以 0 至 1 计，对应色阶第 1 与第 2 级。没有放吸油纸时，读取器返回 0.54；分辨“没有纸”与“油性纸”要靠摆放检查。槽内放的是干试纸时，pH 可信度介于 0.02 至 0.08，低得不足以报告 pH 值 [30]。",
      ),
    },
    {
      title: t("Models and tests", "模型與測試", "模型与测试"),
      body: t(
        "In live use the 70B model answered survey requests in about 3.5 seconds, inside the 4.5 second budget [24, 32]. The test suite ran 51 tests, all passing, of which 45 cover Element across 9 files [31].",
        "實際使用中，70B 模型回應問卷請求約需 3.5 秒，在 4.5 秒上限之內 [24, 32]。測試套件執行 51 項測試，全部通過，其中 45 項分佈於 9 個檔案、涵蓋 Element [31]。",
        "实际使用中，70B 模型响应问卷请求约需 3.5 秒，在 4.5 秒上限之内 [24, 32]。测试套件运行 51 项测试，全部通过，其中 45 项分布于 9 个文件、涵盖 Element [31]。",
      ),
    },
  ],
  limitsTitle: t("3. Limitations", "3. 限制", "3. 限制"),
  limits: [
    t(
      "The nose model was trained on single laboratory molecules rated by 55 people, not on blended perfumes rated by our customers [6]. The six-family mapping is our heuristic, and with fewer known families the error rises (0.259 with one known, 0.190 with three) [25]. Transfer to blended perfumes is untested.",
      "嗅覺模型以 55 人評分的實驗室單一分子訓練，並非以我們顧客評分的混合香水訓練 [6]。六個家族的對應是我們的經驗法則；已知家族較少時誤差上升（已知一個為 0.259，已知三個為 0.190）[25]。轉用到混合香水仍未測試。",
      "嗅觉模型以 55 人评分的实验室单一分子训练，并非以我们顾客评分的混合香水训练 [6]。六个家族的对应是我们的经验法则；已知家族较少时误差上升（已知一个为 0.259，已知三个为 0.190）[25]。转用到混合香水仍未测试。",
    ),
    t(
      "The browser reader has no subpixel corner refinement, which the Python reference uses, so its warp is slightly less precise [21, 22]. Agreement between blot readings and laboratory measurement of skin oil has not been tested, and the study linking skin properties to evaporation does not validate consumer photos [19].",
      "瀏覽器讀取器沒有 Python 參考版所用的次像素角點精修，透視校正因此稍欠精確 [21, 22]。吸油讀數與實驗室肌膚油脂測量是否一致，仍未測試；把肌膚特性與蒸發聯繫起來的研究，亦未驗證消費者照片 [19]。",
      "浏览器读取器没有 Python 参考版所用的亚像素角点精修，透视校正因此稍欠精确 [21, 22]。吸油读数与实验室肌肤油脂测量是否一致，仍未测试；把肌肤特性与蒸发联系起来的研究，也未验证消费者照片 [19]。",
    ),
    t(
      "pH confidence is low with dry strips, and skin pH varies with washing and products [18, 30]. pH is recorded with its confidence and never used for tuning [26].",
      "放乾試紙時 pH 可信度偏低，而肌膚 pH 亦會因清洗與護膚產品而變化 [18, 30]。pH 連同可信度記錄，但從不用於微調 [26]。",
      "放干试纸时 pH 可信度偏低，而肌肤 pH 也会因清洗与护肤产品而变化 [18, 30]。pH 连同可信度记录，但从不用于微调 [26]。",
    ),
    t(
      "The sample sizes are small: three photos of the current lid, one older photo and one rendered board [30]. The four-vial ladder is far simpler than a validated staircase test [7] and is a sensitivity cue, not a clinical threshold.",
      "樣本數量很少：三張現版盒蓋照片、一張舊照片與一張渲染測量板 [30]。四瓶階梯遠比經驗證的階梯式測試簡單 [7]，只是敏感度線索，並非臨床閾值。",
      "样本数量很少：三张现版盒盖照片、一张旧照片与一张渲染测量板 [30]。四瓶阶梯远比经验证的阶梯式测试简单 [7]，只是敏感度线索，并非临床阈值。",
    ),
    t(
      "Odorant receptors vary between people, including for particular musks [4, 5, 17]. Our ratings explore preference; they do not identify genes, and the musk flag is a product heuristic.",
      "嗅覺受體因人而異，對特定麝香的感知亦然 [4, 5, 17]。我們的評分探索喜好，並不識別基因；麝香提示只是產品上的經驗法則。",
      "嗅觉受体因人而异，对特定麝香的感知也是如此 [4, 5, 17]。我们的评分探索喜好，并不识别基因；麝香提示只是产品上的经验法则。",
    ),
    t(
      "The test is for adults aged 18 or over, with consent recorded per session [24]. We make no claim that a tuned perfume changes confidence or attractiveness; the related study used a deodorant that also contained antimicrobial agents [20].",
      "測試只供 18 歲或以上的成年人使用，每次測試都會記錄同意 [24]。我們不聲稱微調香水會改變自信或吸引力；相關研究使用的止汗產品同時含抗菌成分 [20]。",
      "测试只供 18 岁或以上的成年人使用，每次测试都会记录同意 [24]。我们不声称微调香水会改变自信或吸引力；相关研究使用的止汗产品同时含抗菌成分 [20]。",
    ),
  ],
  stackTitle: t("4. Technology stack", "4. 技術架構", "4. 技术架构"),
  stackIntro: t(
    "Each layer of the system, the tools in it, why we chose them and what each choice costs us.",
    "系統的每一層、所用工具、選用原因，以及每個選擇的代價。",
    "系统的每一层、所用工具、选用原因，以及每个选择的代价。",
  ),
  refsTitle: t("References", "參考文獻", "参考文献"),
  refsIntro: t(
    "Literature [1] to [20]; Element code, data and measurements [21] to [32]. Where the lab notes review a source, a link leads to that review.",
    "文獻為 [1] 至 [20]；Element 程式、數據與量度為 [21] 至 [32]。實驗筆記已查證的來源，附有連結指向該查證。",
    "文献为 [1] 至 [20]；Element 代码、数据与测量为 [21] 至 [32]。实验笔记已查证的来源，附有链接指向该查证。",
  ),
  reviewed: t("Lab notes review", "實驗筆記查證", "实验笔记查证"),
  sections: [
    {
      id: "web-app",
      title: t("4.1 The web app", "4.1 網頁應用程式", "4.1 网页应用"),
      overview: t(
        "One codebase serves the brand site, the guided test and the API. We kept the stack small so a small team could build it, test it and explain it in the time available.",
        "同一套程式碼提供品牌網站、引導測試與 API。我們刻意保持技術架構精簡，讓小團隊能在有限時間內建成、測試並解釋清楚。",
        "同一套代码提供品牌网站、引导测试与 API。我们刻意保持技术架构精简，让小团队能在有限时间内建成、测试并解释清楚。",
      ),
      entries: [
        {
          mark: "Vx", name: same("vinext"), href: "https://vinext.dev/",
          why: t(
            "vinext is Cloudflare's implementation of the Next.js App Router on Vite. It lets us write pages and API routes in the familiar App Router layout and deploy them straight to Workers, without a separate adapter or a second host.",
            "vinext 是 Cloudflare 以 Vite 實現的 Next.js App Router。我們可以用熟悉的 App Router 結構編寫頁面與 API 路由，並直接部署到 Workers，毋須另外的轉接層或第二個主機。",
            "vinext 是 Cloudflare 以 Vite 实现的 Next.js App Router。我们可以用熟悉的 App Router 结构编写页面与 API 路由，并直接部署到 Workers，无须另外的适配层或第二个主机。",
          ),
          cost: t(
            "vinext is in beta (we use 1.0.0 beta 11). Some Next.js features may behave differently, and when something breaks there are fewer answers online than for mainstream Next.js.",
            "vinext 仍在測試階段（我們使用 1.0.0 beta 11）。部分 Next.js 功能的表現可能不同；遇到問題時，網上可找到的答案也比主流 Next.js 少。",
            "vinext 仍在测试阶段（我们使用 1.0.0 beta 11）。部分 Next.js 功能的表现可能不同；遇到问题时，网上可找到的答案也比主流 Next.js 少。",
          ),
        },
        {
          mark: "Re", name: same("React 19"), href: "https://react.dev/",
          why: t(
            "The guided test is a long flow with a lot of state: consent, the ladder, ratings, the camera, the survey and the result. React keeps that state in one place and renders it on the phone. Heavier pieces, such as the marker detector and the QR library, load when a screen needs them, so the opening screen stays light.",
            "引導測試是一段狀態繁多的長流程：同意、階梯、評分、鏡頭、問卷與結果。React 把這些狀態集中管理，並在手機上呈現。較重的部分，例如標記偵測器與 QR 碼程式庫，在需要的畫面才載入，讓開首畫面保持輕巧。",
            "引导测试是一段状态繁多的长流程：同意、阶梯、评分、镜头、问卷与结果。React 把这些状态集中管理，并在手机上呈现。较重的部分，例如标记检测器与二维码库，在需要的画面才加载，让开头画面保持轻巧。",
          ),
          cost: t(
            "Most of the test runs in the browser, so an older or slower phone does more of the work. If the API does not answer, the page falls back to local logic, which keeps the test moving but means that step is not saved on the server [24].",
            "測試大部分在瀏覽器執行，因此較舊或較慢的手機要承擔更多工作。API 沒有回應時，頁面會改用本機邏輯，測試得以繼續，但該步驟不會儲存在伺服器上 [24]。",
            "测试大部分在浏览器运行，因此较旧或较慢的手机要承担更多工作。API 没有响应时，页面会改用本地逻辑，测试得以继续，但该步骤不会储存在服务器上 [24]。",
          ),
        },
        {
          mark: "TS", name: same("TypeScript"), href: "https://www.typescriptlang.org/",
          why: t(
            "The domain logic (photo maths, survey rules, tuning, nose inference, compare) lives in plain TypeScript modules with no framework imports. Node runs them directly in tests, and the same files run in the browser and in the Worker.",
            "領域邏輯（照片運算、問卷規則、微調、嗅覺推算、比較）都寫在不依賴框架的 TypeScript 模組中。Node 可在測試中直接執行它們，而同一批檔案亦在瀏覽器與 Worker 中執行。",
            "领域逻辑（照片运算、问卷规则、微调、嗅觉推算、比较）都写在不依赖框架的 TypeScript 模块中。Node 可在测试中直接运行它们，而同一批文件也在浏览器与 Worker 中运行。",
          ),
          cost: t(
            "We rely on Node's type stripping to run tests without a build step, which limits us to syntax Node can strip. Types catch shape errors, not wrong numbers; the tests still have to do that.",
            "我們依賴 Node 移除型別的功能，毋須建置便可執行測試，因此只能使用 Node 能移除的語法。型別能找出結構錯誤，卻找不出錯誤的數字，這仍要靠測試。",
            "我们依赖 Node 移除类型的功能，无须构建便可运行测试，因此只能使用 Node 能移除的语法。类型能找出结构错误，却找不出错误的数字，这仍要靠测试。",
          ),
        },
      ],
    },
    {
      id: "hosting",
      title: t("4.2 Hosting, data & storage", "4.2 主機、資料與儲存", "4.2 托管、数据与存储"),
      overview: t(
        "Everything runs on one Cloudflare account. Each service has one job, and each binding is declared in wrangler.jsonc, so the Worker cannot reach anything it was not given [29].",
        "所有服務都在同一個 Cloudflare 帳戶上運行。每項服務各有一個職責，每個綁定都在 wrangler.jsonc 中宣告，因此 Worker 無法存取未獲授予的資源 [29]。",
        "所有服务都在同一个 Cloudflare 账户上运行。每项服务各有一个职责，每个绑定都在 wrangler.jsonc 中声明，因此 Worker 无法访问未获授予的资源 [29]。",
      ),
      entries: [
        {
          mark: "Wk", name: same("Cloudflare Workers"), href: "https://developers.cloudflare.com/workers/",
          why: t(
            "The Worker serves the pages, the static assets and the /api/element routes. It checks the request origin, applies rate limits, validates every body and caps uploads at 16 KB for JSON, 1.5 MB for a photo and 2 MB for audio. Errors never log bodies, photos or readings [24].",
            "Worker 提供頁面、靜態資源與 /api/element 路由。它檢查請求來源、套用流量限制、驗證每個請求內容，並限制上傳大小：JSON 16 KB、照片 1.5 MB、音訊 2 MB。發生錯誤時，從不記錄請求內容、照片或讀數 [24]。",
            "Worker 提供页面、静态资源与 /api/element 路由。它检查请求来源、应用流量限制、验证每个请求内容，并限制上传大小：JSON 16 KB、照片 1.5 MB、音频 2 MB。发生错误时，从不记录请求内容、照片或读数 [24]。",
          ),
          cost: t(
            "Workers have tight CPU and memory limits, so heavy image work stays on the phone. Every service below is tied to Cloudflare, so moving to another host would mean replacing all of them.",
            "Workers 的 CPU 與記憶體限制嚴格，因此繁重的影像處理留在手機上。以下每項服務都綁定 Cloudflare，若要轉用其他主機，便要全部替換。",
            "Workers 的 CPU 与内存限制严格，因此繁重的图像处理留在手机上。以下每项服务都绑定 Cloudflare，若要转用其他主机，便要全部替换。",
          ),
        },
        {
          mark: "D1", name: same("D1"), href: "https://developers.cloudflare.com/d1/",
          why: t(
            "D1 is Cloudflare's SQLite database. It holds sessions, photo readings, survey answers, results, profiles, sign-in codes and logins across seven Element tables. Every query is plain SQL with bound parameters [24, 29].",
            "D1 是 Cloudflare 的 SQLite 資料庫，以七個 Element 資料表儲存測試流程、照片讀數、問卷答案、結果、個人檔案、登入碼與登入紀錄。每條查詢都是使用綁定參數的一般 SQL [24, 29]。",
            "D1 是 Cloudflare 的 SQLite 数据库，以七个 Element 数据表储存测试流程、照片读数、问卷答案、结果、个人档案、登录码与登录记录。每条查询都是使用绑定参数的普通 SQL [24, 29]。",
          ),
          cost: t(
            "D1 is a single SQLite database, not a cluster, so heavy write traffic would need a different design. Schema changes are hand-written migrations that must be applied before the code that needs them is deployed.",
            "D1 是單一 SQLite 資料庫，並非叢集，大量寫入需要另一種設計。結構變更是人手編寫的遷移檔，必須在依賴它的程式部署前先套用。",
            "D1 是单一 SQLite 数据库，并非集群，大量写入需要另一种设计。结构变更是手写的迁移文件，必须在依赖它的代码部署前先应用。",
          ),
        },
        {
          mark: "R2", name: same("R2"), href: "https://developers.cloudflare.com/r2/",
          why: t(
            "R2 stores the straightened lid photos and the generated label art, under keys tied to the session. Photos show the lid, not the person. The API serves label art back to the browser and never serves lid photos [24].",
            "R2 以與測試流程相關的鍵名，儲存拉正後的盒蓋照片與生成的標籤圖像。照片拍的是盒蓋，不是人。API 會把標籤圖像傳回瀏覽器，但從不提供盒蓋照片 [24]。",
            "R2 以与测试流程相关的键名，储存拉正后的盒盖照片与生成的标签图像。照片拍的是盒盖，不是人。API 会把标签图像传回浏览器，但从不提供盒盖照片 [24]。",
          ),
          cost: t(
            "Keeping photos for review means we hold image data and must protect and delete it properly. Label art is generated after the result is shown, so it can be missing when a profile is shared straight away.",
            "保留照片以便審核，代表我們持有影像資料，必須妥善保護與刪除。標籤圖像在結果顯示後才生成，若使用者立即分享檔案，圖像可能尚未出現。",
            "保留照片以便审核，意味着我们持有图像数据，必须妥善保护与删除。标签图像在结果显示后才生成，若用户立即分享档案，图像可能尚未出现。",
          ),
        },
        {
          mark: "Vz", name: same("Vectorize"), href: "https://developers.cloudflare.com/vectorize/",
          why: t(
            "Vectorize holds one embedding for each of the 71 lifestyle tags, built from the survey bank's own question and chip text in English and Chinese. A spoken answer is embedded and matched to its three nearest tags [23, 24].",
            "Vectorize 為 71 個生活標籤各存一個向量，向量由題庫本身的英文與中文問題及選項文字生成。語音回答會轉為向量，再配對最接近的三個標籤 [23, 24]。",
            "Vectorize 为 71 个生活标签各存一个向量，向量由题库本身的英文与中文问题及选项文字生成。语音回答会转为向量，再匹配最接近的三个标签 [23, 24]。",
          ),
          cost: t(
            "The index has to be reseeded by an admin call whenever the bank changes. Nearest-neighbour search always returns its three closest tags, even for an answer that has little to do with any of them.",
            "每次題庫變更，都要以管理員請求重新寫入索引。最近鄰搜尋總會傳回三個最接近的標籤，即使回答與它們關係不大。",
            "每次题库变更，都要以管理员请求重新写入索引。最近邻搜索总会返回三个最接近的标签，即使回答与它们关系不大。",
          ),
        },
        {
          mark: "RL", name: t("Rate Limiting", "流量限制（Rate Limiting）", "流量限制（Rate Limiting）"), href: "https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/",
          why: t(
            "Workers Rate Limiting caps each IP address at 300 Element API requests a minute, and sign-in requests at 10 a minute, before any database or model work starts [24, 29].",
            "Workers Rate Limiting 把每個 IP 位址的 Element API 請求限制在每分鐘 300 次，登入請求每分鐘 10 次，並在任何資料庫或模型工作開始前生效 [24, 29]。",
            "Workers Rate Limiting 把每个 IP 地址的 Element API 请求限制在每分钟 300 次，登录请求每分钟 10 次，并在任何数据库或模型工作开始前生效 [24, 29]。",
          ),
          cost: t(
            "A per-IP key treats a whole event Wi-Fi network as one visitor, which is why the general limit is set high. Someone with many addresses is not stopped by this alone.",
            "以 IP 為單位，會把整個活動場地的 Wi-Fi 當作一位訪客，所以一般上限設得較高。擁有大量位址的人，單靠這一層並不能阻止。",
            "以 IP 为单位，会把整个活动场地的 Wi-Fi 当作一位访客，所以一般上限设得较高。拥有大量地址的人，单靠这一层并不能阻止。",
          ),
        },
        {
          mark: "AG", name: same("AI Gateway"), href: "https://developers.cloudflare.com/ai-gateway/",
          why: t(
            "Every Workers AI call goes through AI Gateway, which gives one place to see requests, latency and errors for all five models. Each call also has its own time budget in our code, from 4 seconds for the photo check to 10 seconds for label art [24].",
            "每次 Workers AI 調用都經過 AI Gateway，讓我們在同一處查看全部五個模型的請求、延遲與錯誤。每次調用在程式中亦有各自的時間上限，由照片檢查的 4 秒到標籤圖像的 10 秒不等 [24]。",
            "每次 Workers AI 调用都经过 AI Gateway，让我们在同一处查看全部五个模型的请求、延迟与错误。每次调用在代码中也有各自的时间上限，由照片检查的 4 秒到标签图像的 10 秒不等 [24]。",
          ),
          cost: t(
            "It adds a hop to every model call. We use the account's default gateway, which Cloudflare creates automatically; a named gateway we had configured did not exist on the account, and every AI call quietly fell back until we found it [32].",
            "每次模型調用都多經一個環節。我們使用帳戶的預設 gateway，由 Cloudflare 自動建立；之前設定的具名 gateway 在帳戶中並不存在，導致每次 AI 調用都靜靜改用後備方案，直至我們發現問題 [32]。",
            "每次模型调用都多经一个环节。我们使用账户的默认 gateway，由 Cloudflare 自动创建；之前配置的具名 gateway 在账户中并不存在，导致每次 AI 调用都悄悄改用后备方案，直至我们发现问题 [32]。",
          ),
        },
      ],
    },
    {
      id: "lid",
      title: t("4.3 Reading the lid", "4.3 讀取盒蓋", "4.3 读取盒盖"),
      overview: t(
        "The lid is a measurement surface. We designed it so a phone photo taken in an ordinary room can be straightened and colour-corrected using marks printed on the lid itself, with no special app or lighting.",
        "盒蓋是一個測量平面。我們的設計讓人在一般房間用手機拍下的照片，可以憑盒蓋上印刷的標記拉正並校正色彩，毋須特別的應用程式或燈光。",
        "盒盖是一个测量平面。我们的设计让人在一般房间用手机拍下的照片，可以凭盒盖上印刷的标记拉正并校正色彩，无须特别的应用或灯光。",
      ),
      entries: [
        {
          mark: "Ld", name: t("The printed lid board", "印刷測量板", "印刷测量板"),
          why: t(
            "The board is 160 x 130 mm so it fits inside a 17 x 14 cm box lid. It has two zones, each photographed on its own: an oil-blot zone with an 80 x 50 mm blotting sheet and a six-step blue scale, and a pH zone with slots for a skin strip and a control strip beside a printed pH chart. Each zone has four corner markers and its own white, grey and black patches. A Python script generates the board, its print PDF and the JSON layout the reader uses [22].",
            "測量板尺寸為 160 x 130 毫米，可放進 17 x 14 厘米的盒蓋。板上有兩個區域，各自單獨拍攝：吸油區有一張 80 x 50 毫米吸油紙與六級藍色色階；pH 區有肌膚試紙與對照試紙的位置，旁邊是印刷 pH 色表。每個區域有四個角落標記，以及各自的白、灰、黑色塊。一個 Python 程式會生成測量板、列印用 PDF，以及讀取器使用的 JSON 佈局 [22]。",
            "测量板尺寸为 160 x 130 毫米，可放进 17 x 14 厘米的盒盖。板上有两个区域，各自单独拍摄：吸油区有一张 80 x 50 毫米吸油纸与六级蓝色色阶；pH 区有肌肤试纸与对照试纸的位置，旁边是印刷 pH 色表。每个区域有四个角落标记，以及各自的白、灰、黑色块。一个 Python 脚本会生成测量板、打印用 PDF，以及读取器使用的 JSON 布局 [22]。",
          ),
          cost: t(
            "Printed colours vary between printers and papers, so the chart is a relative reference, not a calibrated standard. Any change to the board means regenerating the layout and checking the reader again.",
            "印刷顏色會因打印機與紙張而異，因此色表是相對參考，並非校準標準。測量板每次改動，都要重新生成佈局並再次檢查讀取器。",
            "印刷颜色会因打印机与纸张而异，因此色表是相对参考，并非校准标准。测量板每次改动，都要重新生成布局并再次检查读取器。",
          ),
        },
        {
          mark: "Ar", name: same("js-aruco2"), href: "https://github.com/damianofalcioni/js-aruco2",
          why: t(
            "js-aruco2 detects ArUco markers [11] in plain JavaScript, with no WebAssembly download. We load its 4x4 dictionary, accept exact codes with no bit errors, and try each photo at full, three-quarter and half size, because its fixed threshold window can miss markers on large, unevenly lit photos [21].",
            "js-aruco2 以純 JavaScript 偵測 ArUco 標記 [11]，毋須下載 WebAssembly。我們載入它的 4x4 字典，只接受零位元錯誤的完整編碼，並以原尺寸、四分之三與一半尺寸嘗試讀取每張照片，因為它的固定門檻視窗在光線不均的大照片上可能漏掉標記 [21]。",
            "js-aruco2 以纯 JavaScript 检测 ArUco 标记 [11]，无须下载 WebAssembly。我们加载它的 4x4 字典，只接受零比特错误的完整编码，并以原尺寸、四分之三与一半尺寸尝试读取每张照片，因为它的固定阈值窗口在光线不均的大照片上可能漏掉标记 [21]。",
          ),
          cost: t(
            "It has no subpixel corner refinement, which our Python reference uses, so corner positions and the warp are slightly less precise in the browser. We accepted that in exchange for a small, fast download; measured against the reference, oil readings stayed within 0.002 [30].",
            "它沒有 Python 參考版所用的次像素角點精修，因此瀏覽器中的角點位置與透視校正稍欠精確。我們接受這一點，換取細小而快速的下載；與參考版比較，油脂讀數差距保持在 0.002 以內 [30]。",
            "它没有 Python 参考版所用的亚像素角点精修，因此浏览器中的角点位置与透视校正稍欠精确。我们接受这一点，换取小而快速的下载；与参考版比较，油脂读数差距保持在 0.002 以内 [30]。",
          ),
        },
        {
          mark: "Pm", name: same("photo-math"),
          why: t(
            "photo-math is our own module: a homography solver [12], a bilinear warp, a CIELAB conversion that matches OpenCV, CIE76 deltaE [13], a blur check, colour normalisation from the printed patches, the blot score and the pH chart match. It mirrors the Python reference step by step, with the same thresholds. pH confidence is one minus the ratio of the best chart distance to the second best [21].",
            "photo-math 是我們自行編寫的模組：單應性求解 [12]、雙線性透視校正、與 OpenCV 一致的 CIELAB 轉換、CIE76 deltaE [13]、模糊檢查、以印刷色塊校正色彩、吸油評分及 pH 色表配對。它逐步對應 Python 參考版，門檻亦相同。pH 可信度等於一減去最佳色表距離與次佳距離之比 [21]。",
            "photo-math 是我们自行编写的模块：单应性求解 [12]、双线性透视校正、与 OpenCV 一致的 CIELAB 转换、CIE76 deltaE [13]、模糊检查、以印刷色块校正色彩、吸油评分及 pH 色表匹配。它逐步对应 Python 参考版，阈值也相同。pH 可信度等于一减去最佳色表距离与次佳距离之比 [21]。",
          ),
          cost: t(
            "Reading on the phone means no server-side model produces the numbers, and precision depends on the phone's camera. Agreement with laboratory measurements has not been tested yet. Readings are stored with their flags and confidence, and pH is never used to tune a formula [26].",
            "在手機上讀取，代表沒有伺服器端模型產生數字，精確度取決於手機鏡頭。讀數與實驗室測量是否一致，仍未測試。讀數連同品質提示與可信度一併儲存，而 pH 從不用於微調配方 [26]。",
            "在手机上读取，意味着没有服务器端模型产生数字，精确度取决于手机镜头。读数与实验室测量是否一致，仍未测试。读数连同质量提示与可信度一并储存，而 pH 从不用于微调配方 [26]。",
          ),
        },
      ],
    },
    {
      id: "understanding",
      title: t("4.4 Understanding you", "4.4 了解你", "4.4 了解你"),
      overview: t(
        "This is where most of the AI runs. Each model has a narrow task, a time limit and a check on its output. When a check fails, the person still gets a sensible next step from ordinary code.",
        "大部分 AI 在這部分運行。每個模型的任務都很明確，有時間上限，輸出亦會被檢查。檢查不通過時，一般程式仍會給使用者合理的下一步。",
        "大部分 AI 在这部分运行。每个模型的任务都很明确，有时间上限，输出也会被检查。检查不通过时，普通代码仍会给用户合理的下一步。",
      ),
      entries: [
        {
          mark: "AI", name: same("Workers AI"), href: "https://developers.cloudflare.com/workers-ai/",
          why: t(
            "We use five models on Workers AI: Llama 3.3 70B (fp8 fast) for survey choices, explanations and compare sentences; Llama 4 Scout 17B to check photo placement and glare; Whisper large v3 turbo for speech; bge-m3 for multilingual embeddings; and FLUX.1 schnell for abstract label art. They run through a binding inside the Worker, so there are no API keys in the code and no separate inference server [24].",
            "我們在 Workers AI 上使用五個模型：Llama 3.3 70B（fp8 fast）負責問卷選題、解釋與比較句子；Llama 4 Scout 17B 檢查照片擺放與反光；Whisper large v3 turbo 處理語音；bge-m3 生成多語向量；FLUX.1 schnell 生成抽象標籤圖像。模型經 Worker 內的綁定運行，程式中沒有 API 金鑰，也毋須另設推理伺服器 [24]。",
            "我们在 Workers AI 上使用五个模型：Llama 3.3 70B（fp8 fast）负责问卷选题、解释与比较句子；Llama 4 Scout 17B 检查照片摆放与反光；Whisper large v3 turbo 处理语音；bge-m3 生成多语向量；FLUX.1 schnell 生成抽象标签图像。模型经 Worker 内的绑定运行，代码中没有 API 密钥，也无须另设推理服务器 [24]。",
          ),
          cost: t(
            "Model calls are the slowest part of the test. In live use the 70B model answered survey requests in about 3.5 seconds, so we allow 4.5 seconds before falling back to the bank [24, 32]. Model availability and behaviour can change on Cloudflare's side.",
            "模型調用是測試中最慢的部分。實際使用中，70B 模型回應問卷請求約需 3.5 秒，因此我們容許 4.5 秒，之後便改用題庫 [24, 32]。模型的供應與表現亦可能因 Cloudflare 方面而改變。",
            "模型调用是测试中最慢的部分。实际使用中，70B 模型响应问卷请求约需 3.5 秒，因此我们容许 4.5 秒，之后便改用题库 [24, 32]。模型的供应与表现也可能因 Cloudflare 方面而改变。",
          ),
        },
        {
          mark: "Sv", name: t("The survey engine", "問卷引擎", "问卷引擎"),
          why: t(
            "The bank has 27 questions across six topics, each written in English, Traditional Chinese and Simplified Chinese, with answer chips that carry lifestyle tags. Without AI, the engine asks follow-ups triggered by earlier answers, then the least-covered topic, and stops at 12 answers. The model sees the remaining valid candidates and may pick one or write a follow-up; the validator rejects anything outside those rules [23].",
            "題庫有 27 條問題，分屬六個主題，每條都以英文、繁體中文與簡體中文撰寫，答案選項附有生活標籤。沒有 AI 時，引擎會先問由先前答案觸發的追問，再問涵蓋最少的主題，答滿 12 題便停止。模型會看到其餘有效的候選問題，可以選其一或寫一條追問；不符合規則的一律被驗證器拒絕 [23]。",
            "题库有 27 道问题，分属六个主题，每道都以英文、繁体中文与简体中文撰写，答案选项附有生活标签。没有 AI 时，引擎会先问由先前答案触发的追问，再问涵盖最少的主题，答满 12 题便停止。模型会看到其余有效的候选问题，可以选其一或写一道追问；不符合规则的一律被验证器拒绝 [23]。",
          ),
          cost: t(
            "Validation is strict, so some reasonable model questions are thrown away. An AI follow-up exists in the one language it was written in, so switching language mid-test does not translate it [24].",
            "驗證十分嚴格，部分合理的模型問題也會被捨棄。AI 追問只以撰寫時的語言存在，測試中途切換語言並不會翻譯它 [24]。",
            "验证十分严格，部分合理的模型问题也会被舍弃。AI 追问只以撰写时的语言存在，测试中途切换语言并不会翻译它 [24]。",
          ),
        },
        {
          mark: "Vo", name: t("Voice answers", "語音回答", "语音回答"),
          why: t(
            "The voice button records a short clip on the phone and sends it to the Worker, up to 2 MB. Whisper transcribes it in English or Chinese, bge-m3 turns the transcript into a vector, and Vectorize returns the three nearest tags. The transcript is trimmed to 500 characters and the audio is not stored [24].",
            "語音按鈕在手機上錄下一段短片段並傳送到 Worker，上限 2 MB。Whisper 以英文或中文轉寫，bge-m3 把文字轉為向量，Vectorize 傳回最接近的三個標籤。轉寫文字截至 500 個字元，音訊不會被儲存 [24]。",
            "语音按钮在手机上录下一段短片段并发送到 Worker，上限 2 MB。Whisper 以英文或中文转写，bge-m3 把文字转为向量，Vectorize 返回最接近的三个标签。转写文字截至 500 个字符，音频不会被储存 [24]。",
          ),
          cost: t(
            "Speech recognition in a noisy hall is unreliable, and Chinese speech uses Whisper's general Chinese setting, so Cantonese has not been tested on its own. If anything is slow or fails, the person sees no tags and can tap the chips instead.",
            "在嘈雜的場地，語音辨識並不可靠；中文語音使用 Whisper 的一般中文設定，廣東話未有單獨測試。任何環節太慢或失敗，使用者不會看到標籤，可改為點選答案選項。",
            "在嘈杂的场地，语音识别并不可靠；中文语音使用 Whisper 的通用中文设置，粤语未有单独测试。任何环节太慢或失败，用户不会看到标签，可改为点选答案选项。",
          ),
        },
      ],
    },
    {
      id: "nose",
      title: t("4.5 The nose model", "4.5 嗅覺模型", "4.5 嗅觉模型"),
      overview: t(
        "We wanted nose types to come from real smell data rather than invented personas. The model is small on purpose: it is trained offline, evaluated honestly, and published with its limits [25].",
        "我們希望嗅覺類型來自真實的嗅覺數據，而不是虛構的人物設定。模型刻意保持細小：離線訓練、誠實評估，並連同其限制一併公開 [25]。",
        "我们希望嗅觉类型来自真实的嗅觉数据，而不是虚构的人物设定。模型刻意保持小巧：离线训练、诚实评估，并连同其限制一并公开 [25]。",
      ),
      entries: [
        {
          mark: "KV", name: t("Keller & Vosshall 2016", "Keller 與 Vosshall 2016", "Keller 与 Vosshall 2016"), href: "https://doi.org/10.1186/s12868-016-0287-2",
          why: t(
            "55 people rated 480 molecules at two concentrations for intensity, pleasantness, familiarity and 20 odour descriptors [6]. The data is published under CC BY 4.0, and we use the CSV version from Pyrfume. We map descriptors to our six scent families and keep the 191 molecules whose strongest descriptor is at or above the 60th percentile [25].",
            "55 人在兩種濃度下為 480 種分子評分，項目包括強度、愉悅度、熟悉度與 20 個氣味描述詞 [6]。數據以 CC BY 4.0 發佈，我們使用 Pyrfume 整理的 CSV 版本。我們把描述詞對應到六個香調家族，並保留最強描述詞達第 60 百分位或以上的 191 種分子 [25]。",
            "55 人在两种浓度下为 480 种分子评分，项目包括强度、愉悦度、熟悉度与 20 个气味描述词 [6]。数据以 CC BY 4.0 发布，我们使用 Pyrfume 整理的 CSV 版本。我们把描述词对应到六个香调家族，并保留最强描述词达第 60 百分位或以上的 191 种分子 [25]。",
          ),
          cost: t(
            "These are single laboratory molecules rated by 55 people, not blended perfumes rated by our customers. The six-family mapping is our own heuristic, not the authors' labels.",
            "這些是 55 人評分的實驗室單一分子，並非由我們顧客評分的混合香水。六個家族的對應是我們自訂的經驗法則，並非原作者的標籤。",
            "这些是 55 人评分的实验室单一分子，并非由我们顾客评分的混合香水。六个家族的对应是我们自定的经验法则，并非原作者的标签。",
          ),
        },
        {
          mark: "Sk", name: same("scikit-learn"), href: "https://scikit-learn.org/",
          why: t(
            "A Python script standardises each person's six family averages, fits k-means [14] for k from 3 to 6 with a fixed seed, and chooses k by silhouette score [15]. It then fits a ridge regression [16] per family that predicts it from the other five, and exports the means, centroids and coefficients to JSON [25].",
            "一個 Python 程式把每人的六個家族平均分標準化，以固定隨機種子為 k = 3 至 6 擬合 k-means [14]，再按輪廓係數選擇 k [15]。之後為每個家族擬合一條嶺迴歸 [16]，以其餘五個家族預測它，並把平均值、群集中心與係數匯出為 JSON [25]。",
            "一个 Python 脚本把每人的六个家族平均分标准化，以固定随机种子为 k = 3 至 6 拟合 k-means [14]，再按轮廓系数选择 k [15]。之后为每个家族拟合一条岭回归 [16]，以其余五个家族预测它，并把平均值、聚类中心与系数导出为 JSON [25]。",
          ),
          cost: t(
            "Three clusters from 55 people is a coarse grouping, and silhouette measures structure inside the training data, not accuracy on new people. Retraining needs Python and the cached CSVs, outside the web build.",
            "由 55 人分出三個群集，分組相當粗略；輪廓係數衡量的是訓練數據內部的結構，而不是對新使用者的準確度。重新訓練需要 Python 與快取的 CSV，在網頁建置流程以外進行。",
            "由 55 人分出三个聚类，分组相当粗略；轮廓系数衡量的是训练数据内部的结构，而不是对新用户的准确度。重新训练需要 Python 与缓存的 CSV，在网页构建流程以外进行。",
          ),
        },
        {
          mark: "Ev", name: t("Leave-one-person-out evaluation", "留一人評估", "留一人评估"),
          why: t(
            "Each of 55 rounds holds one person out of every step, including descriptor averaging and family assignment, then predicts each of their families from the other five. This keeps the held-out person's ratings from leaking into the model that predicts them [25].",
            "共 55 輪，每輪把一個人排除於所有步驟之外，包括描述詞平均與家族分配，再以其餘五個家族預測此人的每個家族。這樣可避免被留出者的評分滲入用來預測他的模型 [25]。",
            "共 55 轮，每轮把一个人排除于所有步骤之外，包括描述词平均与家族分配，再以其余五个家族预测此人的每个家族。这样可避免被留出者的评分渗入用来预测他的模型 [25]。",
          ),
          cost: t(
            "That test assumes five other families are known. With fewer known families the error rises, and transfer from single molecules to blended perfumes is untested [25].",
            "該測試假設已知其餘五個家族。已知家族較少時誤差會上升；由單一分子轉用到混合香水仍未測試 [25]。",
            "该测试假设已知其余五个家族。已知家族较少时误差会上升；由单一分子转用到混合香水仍未测试 [25]。",
          ),
        },
        {
          mark: "{}", name: t("A JSON model in the Worker", "Worker 內的 JSON 模型", "Worker 内的 JSON 模型"),
          why: t(
            "Inference is a TypeScript function: fill missing families with the ridge formulas, standardise, and pick the nearest centroid. It needs no network call, so it is fast, free to run and covered by unit tests [25].",
            "推算是一個 TypeScript 函數：以嶺迴歸公式補上缺少的家族，標準化，再選出最近的群集中心。它毋須網絡請求，因此快速、沒有運行費用，並有單元測試覆蓋 [25]。",
            "推算是一个 TypeScript 函数：以岭回归公式补上缺少的家族，标准化，再选出最近的聚类中心。它无须网络请求，因此快速、没有运行费用，并有单元测试覆盖 [25]。",
          ),
          cost: t(
            "Updating the model means retraining and redeploying. The musk flag that feeds tuning is a product heuristic (low amber liking plus low sensitivity), not a measure of musk sensitivity [17, 25].",
            "更新模型就要重新訓練並重新部署。供微調使用的麝香提示是產品上的經驗法則（琥珀喜好低加上敏感度低），並非麝香敏感度的測量 [17, 25]。",
            "更新模型就要重新训练并重新部署。供微调使用的麝香提示是产品上的经验法则（琥珀喜好低加上敏感度低），并非麝香敏感度的测量 [17, 25]。",
          ),
        },
      ],
    },
    {
      id: "formula",
      title: t("4.6 From profile to formula", "4.6 由個人檔案到配方", "4.6 由个人档案到配方"),
      overview: t(
        "The formula is computed by rules a perfumer can read and edit, not generated by a language model. The language model then explains the result, under checks that stop it from changing it.",
        "配方由調香師可以閱讀與修改的規則計算，而不是由語言模型生成。語言模型之後負責解釋結果，並受檢查約束，不能改動結果。",
        "配方由调香师可以阅读与修改的规则计算，而不是由语言模型生成。语言模型之后负责解释结果，并受检查约束，不能改动结果。",
      ),
      entries: [
        {
          mark: "Ng", name: t("The note graph", "香調圖", "香调图"),
          why: t(
            "Six base formulas use 24 notes, each assigned to the top, heart or base tier. A short table of harmony pairs says which notes sit well together, and a trait table says how far each trait moves a tier or a note. Both tables are plain data a perfumer can change [26].",
            "六款基底配方共用 24 種香調，各自屬於前調、中調或基調。一張簡短的和諧配對表列出哪些香調彼此相配，另一張特徵表列出每項特徵會令某層次或某香調變動多少。兩張表都是調香師可以修改的一般資料 [26]。",
            "六款基底配方共用 24 种香调，各自属于前调、中调或基调。一张简短的和谐配对表列出哪些香调彼此相配，另一张特征表列出每项特征会令某层次或某香调变动多少。两张表都是调香师可以修改的普通数据 [26]。",
          ),
          cost: t(
            "The tables encode perfumer judgement, not measured outcomes, and the six bases are sample formulas until the founder's own are supplied. Nothing here proves that a formula is the best one for a person.",
            "這些表反映的是調香師的判斷，而非測量結果；六款基底在創辦人提供正式配方前仍是樣本配方。這裏沒有任何部分證明某條配方對某人是最佳的。",
            "这些表反映的是调香师的判断，而非测量结果；六款基底在创始人提供正式配方前仍是样本配方。这里没有任何部分证明某条配方对某人是最佳的。",
          ),
        },
        {
          mark: "Tu", name: t("Tuning rules", "微調規則", "微调规则"),
          why: t(
            "The tuner applies each active trait, caps every change at 20% of the note's weight or 6 points, whichever is larger, adds at most two accents along harmony pairs, and rebalances the formula to 100% without reversing any trait's direction. When the sensitivity ladder looks unreliable, trait effects are halved. Oil and sensitivity choose EDT or EDP; routine tags and sensitivity set how far the scent projects [26].",
            "微調器逐一套用有效特徵，把每項變動限制在該香調比重的 20% 或 6 個百分點（取較大者），沿和諧配對最多加入兩項點綴，再把配方重新平衡至 100%，過程中不會逆轉任何特徵的方向。敏感度階梯結果看來不可靠時，特徵效果減半。油脂與敏感度決定 EDT 或 EDP；生活標籤與敏感度決定香氣擴散的距離 [26]。",
            "微调器逐一应用有效特征，把每项变动限制在该香调比重的 20% 或 6 个百分点（取较大者），沿和谐配对最多加入两项点缀，再把配方重新平衡至 100%，过程中不会逆转任何特征的方向。敏感度阶梯结果看来不可靠时，特征效果减半。油脂与敏感度决定 EDT 或 EDP；生活标签与敏感度决定香气扩散的距离 [26]。",
          ),
          cost: t(
            "Bounded changes keep the base recognisable, but they also limit how far a formula can move for someone whose preferences are far from it. pH is recorded and shown with its confidence, yet it has no effect on the formula.",
            "有限度的變動讓基底保持辨識度，但對喜好與基底相距甚遠的人，配方能調整的幅度亦因此受限。pH 會連同可信度記錄與顯示，但對配方沒有任何影響。",
            "有限度的变动让基底保持辨识度，但对喜好与基底相距甚远的人，配方能调整的幅度也因此受限。pH 会连同可信度记录与显示，但对配方没有任何影响。",
          ),
        },
        {
          mark: "Ex", name: t("Explanation guardrails", "解釋的防護規則", "解释的防护规则"),
          why: t(
            "The model receives the computed changes and their reasons and must return one sentence per change, in order, plus a summary. The validator rejects a line that names another note, uses a number other than that change's before and after values, mentions pH, uses a banned word or an em dash, or runs past 200 characters. Rejected or late answers are replaced by templates written in all three languages [27].",
            "模型收到已計算的變更及其原因，必須按次序每項變更寫一句，另加一句總結。若某句提及其他香調、使用該項變更前後數值以外的數字、提及 pH、使用禁用詞或長破折號，或超過 200 個字元，驗證器便會拒絕。被拒絕或太遲的答案，會由以三種語言撰寫的模板取代 [27]。",
            "模型收到已计算的变更及其原因，必须按次序每项变更写一句，另加一句总结。若某句提及其他香调、使用该项变更前后数值以外的数字、提及 pH、使用禁用词或长破折号，或超过 200 个字符，验证器便会拒绝。被拒绝或太迟的答案，会由以三种语言撰写的模板取代 [27]。",
          ),
          cost: t(
            "A validator built on word lists can reject a good sentence or let an awkward one through. Template wording is plainer than the model's, so two people can see different styles of explanation for the same kind of change.",
            "以詞表為基礎的驗證器，可能拒絕好句子，也可能放過生硬的句子。模板的措辭比模型樸素，因此兩個人面對同類變更時，可能看到風格不同的解釋。",
            "以词表为基础的验证器，可能拒绝好句子，也可能放过生硬的句子。模板的措辞比模型朴素，因此两个人面对同类变更时，可能看到风格不同的解释。",
          ),
        },
        {
          mark: "CE", name: t("Candle Element materials", "Candle Element 材料", "Candle Element 材料"),
          why: t(
            "Each base lists the perfumer oils it is made from, supplied by Candle Element and mixed into CW Perfume Base. This keeps what the screen shows tied to bottles that exist on the bench [26].",
            "每款基底都列出所用的調香油，由 Candle Element 供應，並調入 CW Perfume Base。這讓畫面上顯示的內容，與工作台上真實存在的香油瓶對應 [26]。",
            "每款基底都列出所用的调香油，由 Candle Element 供应，并调入 CW Perfume Base。这让画面上显示的内容，与工作台上真实存在的香油瓶对应 [26]。",
          ),
          cost: t(
            "Two of the six bases rely on accords we have not bought yet, so their materials are marked as still to buy. The perfumer decides any substitution [26].",
            "六款基底中有兩款依賴我們尚未購入的調和香料，因此材料標示為待購。任何替代都由調香師決定 [26]。",
            "六款基底中有两款依赖我们尚未购入的调和香料，因此材料标示为待购。任何替代都由调香师决定 [26]。",
          ),
        },
      ],
    },
    {
      id: "accounts",
      title: t("4.7 Accounts and sharing", "4.7 帳戶與分享", "4.7 账户与分享"),
      overview: t(
        "Nobody needs an account to take the test. Accounts exist so people can come back to a profile, share it on their own terms and compare with friends.",
        "進行測試毋須帳戶。帳戶讓使用者可以回到自己的檔案、按自己意願分享，並與朋友比較。",
        "进行测试无须账户。账户让用户可以回到自己的档案、按自己意愿分享，并与朋友比较。",
      ),
      entries: [
        {
          mark: "Em", name: same("Cloudflare Email Service"), href: "https://developers.cloudflare.com/email-service/",
          why: t(
            "Sign-in uses a six-digit code sent through the Worker's send_email binding from codes@yatlifestyle.com, in the person's language. There are no passwords to store or leak [24, 28].",
            "登入使用六位數字碼，經 Worker 的 send_email 綁定由 codes@yatlifestyle.com 以使用者的語言寄出。系統沒有密碼，因此沒有密碼需要儲存或可能外洩 [24, 28]。",
            "登录使用六位数字码，经 Worker 的 send_email 绑定由 codes@yatlifestyle.com 以用户的语言发送。系统没有密码，因此没有密码需要储存或可能泄露 [24, 28]。",
          ),
          cost: t(
            "Delivery depends on sender domain verification (SPF and DKIM) for yatlifestyle.com. If sending fails, the API still gives the same answer, so it never reveals which addresses exist, and the person simply does not receive a code.",
            "能否送達取決於 yatlifestyle.com 的寄件網域驗證（SPF 與 DKIM）。寄送失敗時，API 仍給出相同回應，因此不會透露哪些地址存在，使用者只是收不到登入碼。",
            "能否送达取决于 yatlifestyle.com 的发件域名验证（SPF 与 DKIM）。发送失败时，API 仍给出相同响应，因此不会透露哪些地址存在，用户只是收不到登录码。",
          ),
        },
        {
          mark: "#", name: t("Hashed codes and cookies", "雜湊登入碼與 Cookie", "哈希登录码与 Cookie"),
          why: t(
            "Codes are hashed with SHA-256 and a secret pepper before they reach D1, expire after 10 minutes, allow 5 attempts and can be re-sent once a minute. A successful sign-in sets a 30-day HttpOnly, Secure, SameSite=Lax cookie; the database stores a hash of the session ID, never the ID itself [28].",
            "登入碼在寫入 D1 前以 SHA-256 加秘密 pepper 雜湊，10 分鐘後失效，可嘗試 5 次，每分鐘最多重寄一次。成功登入後會設定為期 30 日的 HttpOnly、Secure、SameSite=Lax Cookie；資料庫只儲存登入 ID 的雜湊值，從不儲存 ID 本身 [28]。",
            "登录码在写入 D1 前以 SHA-256 加秘密 pepper 哈希，10 分钟后失效，可尝试 5 次，每分钟最多重发一次。成功登录后会设置为期 30 天的 HttpOnly、Secure、SameSite=Lax Cookie；数据库只储存登录 ID 的哈希值，从不储存 ID 本身 [28]。",
          ),
          cost: t(
            "A six-digit code can be guessed in principle, which is why attempts and requests are limited. A login lives in a cookie on one device, so signing in on another phone needs another code.",
            "六位數字碼理論上可以被猜中，所以嘗試次數與請求都有限制。登入狀態存於單一裝置的 Cookie，在另一部手機登入需要另一個登入碼。",
            "六位数字码理论上可以被猜中，所以尝试次数与请求都有限制。登录状态存于单一设备的 Cookie，在另一部手机登录需要另一个登录码。",
          ),
        },
        {
          mark: "Pr", name: t("Private profiles and compare", "私人檔案與比較", "私密档案与比较"),
          why: t(
            "A profile is private until its owner shares it. Sharing creates an unlisted 12-character link and a styled QR. The public view is built field by field, so skin, oil and pH can never leave the server. Compare scores two profiles: 85% from the cosine similarity of their family likes and 15% from shared tags [24, 28].",
            "個人檔案在擁有者分享前都是私人的。分享時會建立 12 個字元、不公開列出的連結與特製 QR 碼。公開檢視逐個欄位建立，因此肌膚、油脂與 pH 永遠不會離開伺服器。比較功能為兩份檔案評分：85% 來自香調家族喜好的餘弦相似度，15% 來自共同標籤 [24, 28]。",
            "个人档案在拥有者分享前都是私密的。分享时会建立 12 个字符、不公开列出的链接与定制二维码。公开视图逐个字段建立，因此肌肤、油脂与 pH 永远不会离开服务器。比较功能为两份档案评分：85% 来自香调家族喜好的余弦相似度，15% 来自共同标签 [24, 28]。",
          ),
          cost: t(
            "Unlisted is not secret: anyone with the link can see a shared profile. The compare score is a simple similarity measure for conversation, not a prediction that two people will like the same perfume.",
            "不公開列出不等於保密：任何持有連結的人都能看到已分享的檔案。比較分數是供話題用的簡單相似度，並不預測兩人會喜歡同一款香水。",
            "不公开列出不等于保密：任何持有链接的人都能看到已分享的档案。比较分数是供话题用的简单相似度，并不预测两人会喜欢同一款香水。",
          ),
        },
        {
          mark: "QR", name: same("qr-code-styling"), href: "https://github.com/kozakdenys/qr-code-styling",
          why: t(
            "It draws the rounded, dark-gold QR codes with the Element mark in the centre, at error-correction level H so the logo does not break scanning. It loads when a QR is on screen, so pages without one do not download it [28].",
            "它繪製圓點深金色的 QR 碼，中央放上 Element 標誌，並使用 H 級容錯，讓標誌不影響掃描。它在畫面出現 QR 碼時才載入，沒有 QR 碼的頁面不會下載它 [28]。",
            "它绘制圆点深金色的二维码，中央放上 Element 标志，并使用 H 级容错，让标志不影响扫描。它在画面出现二维码时才加载，没有二维码的页面不会下载它 [28]。",
          ),
          cost: t(
            "Rounded modules are harder for some decoders: OpenCV's QR reader cannot read them, so we check our codes with ZXing and real phones instead of trusting a preview.",
            "圓點模組對部分解碼器較難讀取：OpenCV 的 QR 讀取器無法讀取它們，因此我們用 ZXing 與真實手機檢查，而不是單信預覽畫面。",
            "圆点模块对部分解码器较难读取：OpenCV 的二维码读取器无法读取它们，因此我们用 ZXing 与真实手机检查，而不是单信预览画面。",
          ),
        },
      ],
    },
    {
      id: "building",
      title: t("4.8 Building & checking", "4.8 建置與檢查", "4.8 构建与检查"),
      overview: t(
        "We moved fast, but we also wanted to be able to say why every number on the site is there. These are the habits and tools that let us do both.",
        "我們進度很快，但也希望能說清楚網站上每個數字的來由。以下的做法與工具，讓我們兩者兼顧。",
        "我们进度很快，但也希望能说清楚网站上每个数字的来由。以下的做法与工具，让我们两者兼顾。",
      ),
      entries: [
        {
          mark: "Nt", name: same("node --test"), href: "https://nodejs.org/api/test.html",
          why: t(
            "The suite uses Node's built-in test runner and needs no extra framework. 45 Element tests across 9 files cover the homography, colour maths, blot and pH scoring, survey validation and ban lists, tuning caps and direction, nose inference, explanation checks, sign-in, the API routes with stubbed bindings, and the citations on this page [31].",
            "測試套件使用 Node 內置的測試工具，毋須額外框架。9 個檔案共 45 項 Element 測試，涵蓋單應性、色彩運算、吸油與 pH 評分、問卷驗證與禁用詞表、微調上限與方向、嗅覺推算、解釋檢查、登入、使用模擬綁定的 API 路由，以及本頁的引用 [31]。",
            "测试套件使用 Node 内置的测试工具，无须额外框架。9 个文件共 45 项 Element 测试，涵盖单应性、色彩运算、吸油与 pH 评分、问卷验证与禁用词表、微调上限与方向、嗅觉推算、解释检查、登录、使用模拟绑定的 API 路由，以及本页的引用 [31]。",
          ),
          cost: t(
            "Unit tests use stand-ins for D1, R2, Workers AI and email, so they cannot prove the live services behave the same way. Live behaviour still has to be checked on the deployed site.",
            "單元測試以替身取代 D1、R2、Workers AI 與電郵，因此無法證明真實服務的表現一致。真實表現仍要在已部署的網站上檢查。",
            "单元测试以替身取代 D1、R2、Workers AI 与邮件，因此无法证明真实服务的表现一致。真实表现仍要在已部署的网站上检查。",
          ),
        },
        {
          mark: "Py", name: t("Python reference reader", "Python 參考讀取器", "Python 参考读取器"), href: "https://opencv.org/",
          why: t(
            "Before writing the browser reader we built it in Python with OpenCV, where every intermediate image is easy to inspect. Its plain-assert tests check marker detection on real photos of earlier lid layouts and full readings on a rendered board, flat and in perspective. A development page runs the browser port on the same images [21, 22].",
            "編寫瀏覽器讀取器之前，我們先用 Python 與 OpenCV 建成它，每張中間影像都容易檢查。它的簡單斷言測試，以舊版盒蓋的真實照片檢查標記偵測，並以渲染測量板（平放及透視角度）檢查完整讀數。開發頁面會以同一批圖片執行瀏覽器版本 [21, 22]。",
            "编写浏览器读取器之前，我们先用 Python 与 OpenCV 建成它，每张中间图像都容易检查。它的简单断言测试，以旧版盒盖的真实照片检查标记检测，并以渲染测量板（平放及透视角度）检查完整读数。开发页面会以同一批图片运行浏览器版本 [21, 22]。",
          ),
          cost: t(
            "Two implementations have to be kept in step by hand. The current-lid photos in Results were measured by hand and are not yet part of the automated tests [30].",
            "兩套實現要靠人手保持一致。「結果」中的現版盒蓋照片是人手量度的，尚未納入自動測試 [30]。",
            "两套实现要靠人工保持一致。“结果”中的现版盒盖照片是人工测量的，尚未纳入自动测试 [30]。",
          ),
        },
        {
          mark: "Wr", name: t("D1 migrations and Wrangler", "D1 遷移與 Wrangler", "D1 迁移与 Wrangler"), href: "https://developers.cloudflare.com/workers/wrangler/",
          why: t(
            "Five SQL migrations define the newsletter and Element tables, and Wrangler applies them and deploys the built Worker. Bindings, rate limits and the AI, email and Vectorize connections are all declared in one wrangler.jsonc file [29].",
            "五個 SQL 遷移檔定義電子報與 Element 的資料表，由 Wrangler 套用並部署建置好的 Worker。綁定、流量限制，以及 AI、電郵與 Vectorize 的連接，全部在同一個 wrangler.jsonc 檔案中宣告 [29]。",
            "五个 SQL 迁移文件定义电子报与 Element 的数据表，由 Wrangler 应用并部署构建好的 Worker。绑定、流量限制，以及 AI、邮件与 Vectorize 的连接，全部在同一个 wrangler.jsonc 文件中声明 [29]。",
          ),
          cost: t(
            "Deploys are manual commands, so a step can be forgotten. Migrations and seeding the tag index are separate from the code deploy and have to be run in the right order.",
            "部署是人手執行的指令，可能漏掉步驟。遷移與寫入標籤索引都與程式部署分開，必須按正確次序執行。",
            "部署是手动执行的命令，可能漏掉步骤。迁移与写入标签索引都与代码部署分开，必须按正确次序执行。",
          ),
        },
        {
          mark: "Cr", name: t("Per-task code review", "逐項工作的程式碼審查", "逐项工作的代码审查"),
          why: t(
            "The build was split into numbered tasks, from domain logic to the landing page. Each task was reviewed before it was merged, and fixes from review were committed separately, so the history shows what changed and why.",
            "整個建置分為多項編號工作，由領域邏輯到登陸頁。每項工作在合併前都經過審查，審查後的修正另行提交，因此紀錄能看出改了甚麼、為何要改。",
            "整个构建分为多项编号工作，由领域逻辑到落地页。每项工作在合并前都经过审查，审查后的修正另行提交，因此记录能看出改了什么、为何要改。",
          ),
          cost: t(
            "Review takes time that could have gone into features, and a review catches what the reviewer thinks to check. It lowers the risk of mistakes; it does not remove it.",
            "審查佔用了本可用於開發功能的時間，而審查能找出的，限於審查者想到要檢查的部分。它降低出錯的風險，但不能消除風險。",
            "审查占用了本可用于开发功能的时间，而审查能找出的，限于审查者想到要检查的部分。它降低出错的风险，但不能消除风险。",
          ),
        },
        {
          mark: "CC", name: t("Claude Code and Codex", "Claude Code 與 Codex", "Claude Code 与 Codex"), href: "https://claude.com/claude-code",
          why: t(
            "We built Element with two AI coding assistants: Claude Code for planning, implementation and review, and Codex for tasks run in parallel, such as the photo reader, the nose model and the landing pages. The plan assigned each task to a tool, and commits record AI co-authorship.",
            "我們以兩個 AI 編程助手建造 Element：Claude Code 負責規劃、實作與審查，Codex 負責並行處理的工作，例如照片讀取器、嗅覺模型與登陸頁。計劃為每項工作指定工具，提交紀錄亦註明 AI 共同作者。",
            "我们以两个 AI 编程助手建造 Element：Claude Code 负责规划、实现与审查，Codex 负责并行处理的工作，例如照片读取器、嗅觉模型与落地页。计划为每项工作指定工具，提交记录也注明 AI 共同作者。",
          ),
          cost: t(
            "AI assistants write plausible code quickly, including plausible mistakes. Everything they produced had to pass tests and review, and the numbers on this page were checked against the code before publishing.",
            "AI 助手能迅速寫出看似合理的程式碼，也包括看似合理的錯誤。它們產出的一切都必須通過測試與審查，本頁的數字亦在發佈前逐一對照程式碼核實。",
            "AI 助手能迅速写出看似合理的代码，也包括看似合理的错误。它们产出的一切都必须通过测试与审查，本页的数字也在发布前逐一对照代码核实。",
          ),
        },
      ],
    },
  ] satisfies TechSection[],
};
