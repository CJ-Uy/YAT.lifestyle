"use client";

import SiteHeader, { type Locale, useLocale } from "../site-header";
import { elementCopy as c, text } from "./content";
import { noseDataset, researchClaims, verdictLabels } from "../../lib/element/research";
import { techCopy } from "../../lib/element/tech-content";

export function ClaimLink({ id, locale }: { id: string; locale: Locale }) {
  const claim = [...researchClaims, noseDataset].find(item => item.id === id);
  return <a className="claim-link" href={`/element/research#${id}`}>{c.evidence[locale]}{claim ? ` [${claim.number}]` : ""} ↗</a>;
}

export function LabTabs({ locale, active }: { locale: Locale; active?: string }) {
  return <nav className="lab-tabs" aria-label={c.notes[locale]}>{["ai", "science", "research", "tech"].map((route, index) => <a key={route} href={`/element/${route}`} aria-current={active === route ? "page" : undefined}>{[...c.tabs, techCopy.tab][index][locale]}<span aria-hidden="true">↗</span></a>)}</nav>;
}

export function ElementFooter({ locale }: { locale: Locale }) {
  return <footer className="element-footer"><a className="footer-wordmark" href="/">YAT.lifestyle</a><a href="/element">{c.back[locale]}</a><a href="#top">{c.top[locale]}</a></footer>;
}

export function NoteGraph({ locale }: { locale: Locale }) {
  return <div className="note-graph" role="img" aria-label={c.aiBody[locale]}><svg viewBox="0 0 500 380" aria-hidden="true"><g fill="none" stroke="#8a6418" strokeWidth="1"><path d="M75 60 250 190 425 60M75 190H425M75 320 250 190 425 320" /><circle cx="250" cy="190" r="62" /><circle cx="250" cy="190" r="94" strokeDasharray="2 9" />{[[75, 60], [75, 190], [75, 320], [425, 60], [425, 190], [425, 320]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="25" fill="#0d0d0b" />)}</g></svg><span className="graph-centre">{c.graph[3][locale]}</span>{[0, 1, 2, 4, 5, 6].map((label, index) => <span className={`graph-label graph-label-${index}`} key={label}>{c.graph[label][locale]}</span>)}</div>;
}

const ai = {
  heading: text("Measured. Calculated. Explained.", "測量，計算，再解釋。", "测量，计算，再解释。"),
  intro: text("The Element AI keeps measurement, tuning rules and language separate. Each part runs in the demo today; validation against blended perfumes is still to do.", "Element AI 把測量、微調規則與語言分開。各部分已在示範中運作，以混合香水驗證的工作尚待完成。", "Element AI 把测量、微调规则与语言分开。各部分已在示范中运行，以混合香水验证的工作尚待完成。"),
  pipeline: [text("Lid photos", "盒蓋照片", "盒盖照片"), text("Markers, warp, colour correction", "標記、校正透視、色彩校正", "标记、校正透视、色彩校正"), text("Oil / pH + confidence", "油脂 / pH + 可信度", "油脂 / pH + 可信度"), text("Scent ratings + routine tags", "試香評分 + 生活標籤", "试香评分 + 生活标签"), text("Note graph + bounded rules", "香調圖 + 有限微調規則", "香调图 + 有限微调规则"), text("Explanation + perfumer review", "解釋 + 調香師審核", "解释 + 调香师审核")],
  photoHeading: text("The photo is a measurement surface.", "照片，是測量的平面。", "照片，是测量的平面。"),
  photoBody: text("The browser reader uses js-aruco2 to find the printed markers, a four-point homography to straighten each zone, and the white and black patches to normalise colour. It compares the blot to its dry border and matches pH pads to the chart by CIELAB colour difference, returning confidence and quality flags. A vision model checks placement and glare; it never supplies the numbers.", "瀏覽器讀取器以 js-aruco2 找出印刷標記，用四點單應性變換拉正每個區域，再以白色與黑色色塊校正色彩。吸油紙與乾燥邊緣比較，pH 色墊以 CIELAB 色差與色表配對，回傳可信度與品質提示。視覺模型檢查位置與反光，不提供數字。", "浏览器读取器以 js-aruco2 找出印刷标记，用四点单应性变换拉正每个区域，再以白色与黑色色块校正色彩。吸油纸与干燥边缘比较，pH 色垫以 CIELAB 色差与色表配对，回传可信度与品质提示。视觉模型检查位置与反光，不提供数字。"),
  before: text("Before / real earlier-layout lid capture", "校正前 / 真實舊版盒蓋照片", "校正前 / 真实旧版盒盖照片"),
  after: text("Target / printed measurement layout", "目標 / 印刷測量佈局", "目标 / 印刷测量布局"),
  photoCaution: text("The capture uses an earlier board. A verified corrected output for the current board has not been supplied, so the target is a layout illustration, not an AI result. No reading accuracy is claimed.", "照片使用舊版測量板。尚未提供現版的已核實校正結果，因此目標圖是佈局示意，並非 AI 結果。此處不聲稱讀數準確度。", "照片使用旧版测量板。尚未提供现版的已核实校正结果，因此目标图是布局示意，并非 AI 结果。此处不声称读数准确度。"),
  noseHeading: text("A nose model, with its limits visible.", "嗅覺模型，讓限制可見。", "嗅觉模型，让限制可见。"),
  noseBody: text("Keller & Vosshall 2016 collected ratings from 55 people for 480 molecules at two concentrations, under CC BY 4.0. Our model maps descriptors to scent families, clusters standardised person vectors with k-means and uses ridge regression for missing family ratings. Transfer from molecules to blended perfumes still needs testing.", "Keller 與 Vosshall 2016 在兩種濃度下收集 55 人對 480 種分子的評分，採 CC BY 4.0。模型把描述映射至香調家族，以 k-means 聚類標準化個人向量，再用嶺迴歸補足家族評分。分子結果能否轉用到混合香水仍待測。", "Keller 与 Vosshall 2016 在两种浓度下收集 55 人对 480 种分子的评分，采 CC BY 4.0。模型把描述映射至香调家族，以 k-means 聚类标准化个人向量，再用岭回归补足家族评分。分子结果能否转用到混合香水仍待测。"),
  evaluation: text("Evaluation: leave one person out", "評估：留一人驗證", "评估：留一人验证"),
  evalBody: text("Predicting each held-out person's family liking, the model's mean absolute error was 0.178, against 0.300 for a predict-the-average baseline (55 people, Keller & Vosshall 2016). k-means with k=3 gives three nose types: Discerning, Open and Balanced. Transfer from single molecules to blended perfumes is untested.", "以留一人法預測被留出者的香調家族喜好，模型平均絕對誤差為 0.178，預測平均值基線為 0.300（55 人，Keller 與 Vosshall 2016）。k-means 取 k=3，得出三種嗅覺類型：精挑細選型、樂於嘗試型、均衡型。由單一分子轉用到混合香水仍未測試。", "以留一人法预测被留出者的香调家族喜好，模型平均绝对误差为 0.178，预测平均值基线为 0.300（55 人，Keller 与 Vosshall 2016）。k-means 取 k=3，得出三种嗅觉类型：精挑细选型、乐于尝试型、均衡型。由单一分子转用到混合香水仍未测试。"),
  rulesHeading: text("Rules keep the base intact.", "用規則保留基底特色。", "用规则保留基底特色。"),
  rulesBody: text("Tuning retrieves related notes and active traits. Each note moves by at most 20% of its weight or 6 points, whichever is larger, and at most two harmonious accents can be added before renormalisation. These are design bounds, not proof of an optimal formula. Oil informs tier balance, sensitivity informs concentration and routine informs projection. pH is recorded but never changes the formula.", "微調檢索相關香調與特徵。每項香調最多變動其比重的 20% 或 6 個百分點，取較大者；最多加入兩項和諧點綴，再重新歸一化。這些是設計界限，不證明配方最優。油脂供層次參考，敏感度供濃度參考，生活供擴散度參考。pH 會被記錄，但不改變配方。", "微调检索相关香调与特征。每项香调最多变动其比重的 20% 或 6 个百分点，取较大者；最多加入两项和谐点缀，再重新归一化。这些是设计界限，不证明配方最优。油脂供层次参考，敏感度供浓度参考，生活供扩散度参考。pH 会被记录，但不改变配方。"),
  languageHeading: text("The language model has a small job.", "語言模型的工作，有清楚界限。", "语言模型的工作，有清楚界限。"),
  languageBody: text("It selects a bank question or a short follow-up, extracts confirmed tags and explains computed changes. It cannot invent a measurement, diagnose, or add, remove or resize a formula change. Invalid or slow answers fall back to bank questions and template explanations.", "它選擇題庫問題或簡短追問，提取已確認標籤，解釋已計算變更。不能捏造測量、作診斷，或新增、刪除、調整配方變更。無效或逾時回答會改用題庫與模板解釋。", "它选择题库问题或简短追问，提取已确认标签，解释已计算变更。不能捏造测量、作诊断，或新增、删除、调整配方变更。无效或逾时回答会改用题库与模板解释。"),
  stackHeading: text("Designed for the phone and Cloudflare.", "為手機與 Cloudflare 設計。", "为手机与 Cloudflare 设计。"),
  stackBody: text("Photo measurement runs on the phone. The server calls Workers AI through AI Gateway, keeps sessions and readings in D1, lid photos in R2, and multilingual tags in Vectorize.", "照片測量在手機上執行。伺服器經 AI Gateway 調用 Workers AI，以 D1 儲存流程與讀數，R2 儲存盒蓋照片，Vectorize 處理多語標籤。", "照片测量在手机上执行。服务器经 AI Gateway 调用 Workers AI，以 D1 储存流程与读数，R2 储存盒盖照片，Vectorize 处理多语标签。"),
};

const scienceSections = [
  [c.relay, text("The primary olfactory pathway reaches cortex without an obligatory thalamic relay. Smell connects with emotion and memory networks, but the thalamus still participates. A small five-woman fMRI study and a 93-person older-adult memory study motivate curiosity, not a promise of better memory.", "主要嗅覺通路毋須經丘腦便到達皮質。嗅覺與情緒及記憶網絡相连，但丘腦仍參與。五名女性的 fMRI 研究與 93 名長者的記憶研究支持探索，不承諾改善記憶。", "主要嗅觉通路毋须经丘脑便到达皮质。嗅觉与情绪及记忆网络相连，但丘脑仍参与。五名女性的 fMRI 研究与 93 名长者的记忆研究支持探索，不承诺改善记忆。"), ["smell-relay", "smell-emotion", "smell-memory"]],
  [text("Confidence deserves careful wording.", "談自信，要謹慎措辭。", "谈自信，要谨慎措辞。"), text("One deodorant study found confidence and video-rating differences. The product included antimicrobial agents as well as fragrance, and photographs showed no group difference. We cannot promise that perfume makes someone more attractive or confident.", "一項止汗產品研究發現自信與影片評分差異，但產品同時含抗菌成分與香料，照片評分無組別差異。我們不能承諾香水令人更有魅力或自信。", "一项止汗产品研究发现自信与影片评分差异，但产品同时含抗菌成分与香料，照片评分无组别差异。我们不能承诺香水令人更有魅力或自信。"), ["scent-confidence"]],
  [text("Different receptors. Different experiences.", "不同受體，不同感受。", "不同受体，不同感受。"), text("Humans have about 400 intact olfactory-receptor genes. Function varies, and OR7D4 variants affect perception of androstenone. Some people are less sensitive to particular musks. Our ratings explore preferences; they do not identify your genes or diagnose smell loss.", "人類約有 400 個完整嗅覺受體基因，功能有差異；OR7D4 變異影響雄烯酮感知，部分人對特定麝香較不敏感。我們的評分探索喜好，不識別基因或診斷嗅覺喪失。", "人类约有 400 个完整嗅觉受体基因，功能有差异；OR7D4 变异影响雄烯酮感知，部分人对特定麝香较不敏感。我们的评分探索喜好，不识别基因或诊断嗅觉丧失。"), ["receptor-variation", "or7d4", "musk-sensitivity"]],
  [text("Skin and longevity: a starting question.", "肌膚與持香，是研究的起點。", "肌肤与持香，是研究的起点。"), text("A ten-person laboratory study linked some skin properties with evaporation. It did not validate our consumer blot photos or a tuned perfume's benefit. Oil-based tier adjustments are exploratory perfumer rules, and still need measurement-agreement and blind-comparison tests.", "十人的實驗室研究把部分肌膚特性與蒸發聯繫，但未驗證消費吸油照片或微調香水的效益。按油脂調整香調層次是探索性調香規則，仍需測量一致性與盲測比較。", "十人的实验室研究把部分肌肤特性与蒸发联系，但未验证消费吸油照片或微调香水的效益。按油脂调整香调层次是探索性调香规则，仍需测量一致性与盲测比较。"), ["kit-validation"]],
  [text("pH is recorded, never a formula lever.", "pH 用於記錄，不改變配方。", "pH 用于记录，不改变配方。"), text("Skin is usually acidic; a fixed range is not a health verdict. Water, washing, products and photo conditions can affect the reading. We record skin and control strips with confidence notes. pH evidence is too weak for formula tuning, so it has no formula effect.", "肌膚通常偏酸，固定範圍不是健康判斷。水、清洗、產品與拍攝條件可影響讀數。我們記錄肌膚與對照試紙，附可信度說明。pH 微調證據不足，因此不影響配方。", "肌肤通常偏酸，固定范围不是健康判断。水、清洗、产品与拍摄条件可影响读数。我们记录肌肤与对照试纸，附可信度说明。pH 微调证据不足，因此不影响配方。"), ["skin-ph", "water-control", "kit-validation"]],
  [c.honest, c.honestBody, ["coffee-beans", "timed-pause", "reset-evidence"]],
  [text("A ladder inspired by sensory testing.", "受感官測試啟發的階梯。", "受感官测试启发的阶梯。"), text("A blank can reveal a false alarm, and a strong sample can flag a missed response. Our four-vial ladder is simpler than the validated Sniffin' Sticks staircase. It is a sensitivity cue for this prototype, not a clinical threshold test.", "空白樣本可提示誤報，強樣本可提示漏答。我們的四瓶階梯比經驗證的 Sniffin' Sticks 階梯簡化，是原型的敏感度線索，並非臨床閾值測試。", "空白样本可提示误报，强样本可提示漏答。我们的四瓶阶梯比经验证的 Sniffin' Sticks 阶梯简化，是原型的敏感度线索，并非临床阈值测试。"), ["sensitivity-ladder"]],
] as const;

export default function LabNotes({ page }: { page: "ai" | "science" | "research" }) {
  const [locale, setLocale] = useLocale();
  const index = ["ai", "science", "research"].indexOf(page);
  const categories = [text("Science", "科學", "科学"), text("Market & pricing", "市場與定價", "市场与定价"), text("Prototype methods", "原型方法", "原型方法")];
  return <><a className="skip-link" href="#notes-content">{c.notes[locale]}</a><SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="lab-page" id="top"><header className="lab-heading"><a className="text-link" href="/element">← {c.back[locale]}</a><span className="eyebrow">ELEMENT / {c.notes[locale]}</span><h1>{page === "ai" ? ai.heading[locale] : page === "science" ? c.science[locale] : c.sources[locale]}</h1><p>{page === "ai" ? ai.intro[locale] : page === "science" ? c.prototype[locale] : text("37 reviewed claims, plus the nose dataset. Verdicts refer to original statements; the text below gives safer wording. Reviewed 3 October 2026. A supported source does not validate the kit. Prices are dated snapshots, not current quotes.", "37 項已查證陳述，另附嗅覺資料集。判定針對原陳述，下文採較審慎措辭。查證日期為 2026 年 10 月 3 日。來源獲支持不等於套裝已驗證，價格為具日期快照，並非即時報價。", "37 项已查证陈述，另附嗅觉数据集。判定针对原陈述，下文采较审慎措辞。查证日期为 2026 年 10 月 3 日。来源获支持不等于套装已验证，价格为具日期快照，并非实时报价。")[locale]}</p><LabTabs locale={locale} active={page} /></header>
      <div id="notes-content">
        {page === "ai" && <>
          <section className="lab-section"><ol className="ai-pipeline">{ai.pipeline.map((step, i) => <li key={i}><span>0{i + 1}</span>{step[locale]}</li>)}</ol><ClaimLink id="kit-validation" locale={locale} /></section>
          <section className="lab-section"><h2>{ai.photoHeading[locale]}</h2><p>{ai.photoBody[locale]}</p><div className="photo-comparison"><figure><img src="/kit/lid-capture-early.webp" alt={ai.before[locale]} loading="lazy" /><figcaption>{ai.before[locale]}</figcaption></figure><figure><img src="/kit/lid-board.svg" alt={ai.after[locale]} loading="lazy" /><figcaption>{ai.after[locale]}</figcaption></figure></div><p className="element-fine">{ai.photoCaution[locale]}</p><ClaimLink id="kit-validation" locale={locale} /></section>
          <section className="lab-section"><h2>{ai.noseHeading[locale]}</h2><p>{ai.noseBody[locale]}</p><ClaimLink id="nose-dataset" locale={locale} /><aside className="evaluation-note"><h3>{ai.evaluation[locale]}</h3><p>{ai.evalBody[locale]}</p><ClaimLink id="nose-dataset" locale={locale} /></aside></section>
          <section className="lab-section lab-graph-section"><div><h2>{ai.rulesHeading[locale]}</h2><p>{ai.rulesBody[locale]}</p><ClaimLink id="kit-validation" locale={locale} /></div><NoteGraph locale={locale} /></section>
          <section className="lab-section"><h2>{ai.languageHeading[locale]}</h2><p>{ai.languageBody[locale]}</p><p>{c.review[locale]}</p><ClaimLink id="kit-validation" locale={locale} /></section>
          <section className="lab-section"><h2>{ai.stackHeading[locale]}</h2><p>{ai.stackBody[locale]}</p><div className="claim-links"><ClaimLink id="ai-costs" locale={locale} /><a className="claim-link" href="/element/tech">{techCopy.link[locale]} ↗</a></div></section>
        </>}
        {page === "science" && scienceSections.map(([title, body, ids], i) => <section className="lab-section" key={i}><span className="eyebrow">0{i + 1} / {c.tabs[index][locale]}</span><h2>{title[locale]}</h2><p>{body[locale]}</p><div className="claim-links">{ids.map(id => <ClaimLink key={id} id={id} locale={locale} />)}</div></section>)}
        {page === "research" && <>
          <nav className="research-index" aria-label={c.sources[locale]}>{["science", "market", "method"].map((category, i) => <a href={`#${category}`} key={category}>{categories[i][locale]} ↓</a>)}</nav>
          {["science", "market", "method"].map((category, i) => <section className="research-group" id={category} key={category}><h2>{categories[i][locale]}</h2>{[...researchClaims, noseDataset].filter(claim => claim.category === category).map(claim => <article className="research-claim" id={claim.id} key={claim.id}><div className="claim-meta"><h3><a href={`#${claim.id}`}>{text("Claim", "陳述", "陈述")[locale]} {String(claim.number).padStart(2, "0")}</a></h3><span className={`claim-verdict verdict-${claim.verdict}`}>{verdictLabels[claim.verdict][locale]}</span></div><p>{claim.wording[locale]}</p><div className="claim-source-links">{claim.sources.map((source, n) => <a href={source} key={source}>{c.source[locale]} {n + 1} · {new URL(source).hostname} ↗</a>)}</div></article>)}</section>)}
        </>}
      </div>
      <section className="lab-end"><p>{c.review[locale]}<br />{c.disclaimer[locale]}</p><a className="action primary" href="/element/demo">{c.demo[locale]} ↗</a></section>
    </main><ElementFooter locale={locale} /></>;
}
