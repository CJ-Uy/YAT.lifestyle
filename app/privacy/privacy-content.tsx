"use client";

import SiteHeader, { useLocale } from "../site-header";
import { newsletterCopy } from "../../lib/newsletter";

const PRIVACY_UPDATED = "2026-10-12";

const copy = {
  en: {
    updated: "Last updated", back: "Back to the shop", skip: "Skip to privacy policy",
    intro: "This policy and personal information collection statement explain how YAT.lifestyle handles checkout, email verification, support emails, Element and the optional newsletter.",
    sections: [
      ["Who is collecting your information", "YAT.lifestyle is the perfume brand responsible for this website and its newsletter list. For privacy questions, access or correction requests, deletion, or withdrawal of marketing consent, contact hello@yatlifestyle.com."],
      ["What we collect", "When you subscribe, we collect your email address, selected language, signup time, the marketing consent wording you accepted, the privacy policy version and your acknowledgement of it. We also record subscription status and the signup source. Newsletter signup does not ask for a name, address or payment details. Signups are currently stored as unverified; no confirmation or newsletter email is sent automatically."],
      ["Checkout and email verification", "Checkout requires a verified email address. We store your email and a keyed hash of the verification code, plus expiry and attempt records. Codes expire after 10 minutes and verification proofs after 30 minutes; expired code and proof records are removed on subsequent verification requests. When you continue to payment, we store your name, email, phone, Hong Kong delivery address, optional delivery notes, selected products, language, totals, voucher and payment references and status. This lets us process payment, fulfil orders, send confirmation and provide support. Order records are kept while needed for these purposes and applicable obligations; contact us about access, correction or deletion. Buying or verifying an email does not subscribe you to marketing."],
      ["Support emails", "Emails to orders@yatlifestyle.com, care@yatlifestyle.com and hello@yatlifestyle.com are saved for order handling and support. Cloudflare D1 stores a plain-text preview, sender, recipient, subject, receipt/forwarding status and attachment names; private Cloudflare R2 stores the full original email and attachments. Only authorised administrators can access the inbox and originals. Optional forwarding to the owner's Gmail inbox requires a verified destination. We retain messages only while needed for support, orders and applicable obligations. Contact hello@yatlifestyle.com to request access, correction or deletion."],
      ["Why we collect it", "With your explicit consent, we use your email to send YAT.lifestyle fragrance launch announcements, collection news and promotional offers. Language preference helps us choose the language of updates. Consent records help us manage your choices. Joining is voluntary: you can browse without subscribing, but we cannot add you to the list without an email address and consent. We do not sell the list or provide it to other businesses for their own marketing."],
      ["Where it is stored and who can access it", "Newsletter, verification and order records are stored in Cloudflare D1. Access is limited to authorised YAT.lifestyle operators and providers supporting the website, database, email and payment services. Cloudflare Email sends verification codes and order confirmations. Airwallex provides the hosted payment page and processes payment details; our order database stores payment references, amounts and status, not full card numbers or card security codes. Providers may process information outside Hong Kong. We may disclose information where required by law."],
      ["Element","If you use Element, our scent profile demo, we store the lid photos you take in Cloudflare R2, and your oil and pH readings, survey answers and results in Cloudflare D1. If you sign in, we also store your email address and set a session cookie to keep you signed in. We use this to tune and show your formula, and to share your profile only if you choose to. Voice answers are transcribed by Cloudflare Workers AI; the recording is not stored. Profiles stay private unless you share them. Element is not a medical or diagnostic device. To access or delete your Element data, contact hello@yatlifestyle.com."],
      ["Your choices and how long we keep information", "You can withdraw marketing consent at any time, free of charge, by emailing hello@yatlifestyle.com from the subscribed address. You can also request access, correction or deletion there. We may ask for information needed to confirm the address belongs to you. We retain signup details only while needed for the stated purposes and review the list before sending campaigns. After withdrawal, we stop marketing and retain only the minimum record needed to honour your choice or meet legal obligations. Deletion requests are handled by the brand, not automatically by this website."],
      ["Technical information and local storage", "This website stores language and cart choices in browser local storage. Contact and delivery details are not saved there. A necessary HttpOnly cookie proves your checkout email for 30 minutes; separate order-access cookies last up to 30 days and let this browser retrieve its order. You can remove browser storage and cookies in browser settings, but that may remove access to the cart or order. Cloudflare processes technical request information to host and protect the site. Signup requests use an IP-based rate limit to reduce abuse; IP addresses are not saved in the newsletter table. Hosting logs may contain technical information such as IP addresses and request times. This signup does not add advertising trackers or tracking cookies."],
      ["Changes and future emails", "The date above identifies this version. If our use of information changes, we will update this page and seek fresh consent where needed. Before sending newsletters, we will put a working unsubscribe method in each message. Consent to this list is not consent to unrelated marketing."],
    ],
  },
  "zh-Hant": {
    updated: "更新日期", back: "返回商店", skip: "跳至私隱政策",
    intro: "本私隱政策及收集個人資料聲明說明 YAT.lifestyle 如何處理結帳、電郵驗證、支援電郵、Element 及自願訂閱電郵的資料。",
    sections: [
      ["誰收集你的資料", "YAT.lifestyle 是負責本網站及訂閱名單的香水品牌。如有私隱問題，或希望查閱、更正、刪除資料或撤回推廣同意，請聯絡 hello@yatlifestyle.com。"],
      ["我們收集甚麼", "訂閱時，我們會收集你的電郵地址、所選語言、訂閱時間、你同意的推廣條款文字、私隱政策版本及已閱讀政策的確認。我們也會記錄訂閱狀態及訂閱來源。電郵訂閱不要求姓名、地址或付款資料。訂閱目前以未驗證狀態儲存，不會自動發送確認或推廣電郵。"],
      ["結帳及電郵驗證", "結帳必須先驗證電郵。我們會儲存電郵、驗證碼帶金鑰的雜湊值，以及有效期限和嘗試次數。驗證碼於 10 分鐘後失效，驗證憑證於 30 分鐘後失效；過期紀錄會在後續驗證請求時清理。繼續付款時，我們會儲存姓名、電郵、電話、香港送貨地址、選填送貨備註、所選商品、語言、金額、優惠碼及付款編號和狀態，用於處理付款、送貨、寄送確認及提供支援。訂單紀錄會在上述目的及適用責任所需期間保留；你可聯絡我們查閱、更正或要求刪除。購物或驗證電郵不代表同意接收推廣。"],
      ["支援電郵", "寄往 orders@yatlifestyle.com、care@yatlifestyle.com 及 hello@yatlifestyle.com 的電郵會儲存，用於處理訂單及提供支援。Cloudflare D1 儲存純文字預覽、寄件者、收件者、主旨、收件／轉寄狀態及附件名稱；私人 Cloudflare R2 儲存完整原始電郵及附件。只有獲授權管理員可存取收件匣及原始電郵。可選擇轉寄至品牌負責人的 Gmail 收件匣，但收件地址必須先完成驗證。我們只在支援、訂單及適用責任所需期間保留郵件。如需查閱、更正或刪除，請聯絡 hello@yatlifestyle.com。"],
      ["收集目的", "在你明確同意後，我們會使用你的電郵發送 YAT.lifestyle 香水上市、系列消息及推廣優惠。語言偏好用於選擇消息語言；同意紀錄用於管理你的選擇。訂閱完全自願，不訂閱也可瀏覽網站；但沒有電郵地址及同意，我們無法將你加入名單。我們不會出售名單，或向其他企業提供名單作其自身推廣用途。"],
      ["儲存及存取", "訂閱、驗證及訂單紀錄儲存在 Cloudflare D1。存取限於獲授權營運 YAT.lifestyle 的人員，以及支援網站、資料庫、電郵及付款的服務供應商。Cloudflare Email 寄送驗證碼及訂單確認；Airwallex 提供託管付款頁面並處理付款資料。我們的訂單資料庫儲存付款編號、金額及狀態，不儲存完整信用卡號碼或安全碼。供應商可能在香港以外處理資料。我們可能按法律要求披露資料。"],
      ["Element","使用 Element 香氣檔案示範時，我們會把你拍攝的盒蓋照片儲存在 Cloudflare R2，並把油脂及 pH 讀數、問卷答案與結果儲存在 Cloudflare D1。如你登入，我們也會儲存你的電郵地址，並設定工作階段 Cookie 以保持登入。這些資料用於微調及顯示你的配方，並只在你選擇分享時分享你的檔案。語音回答由 Cloudflare Workers AI 轉錄，錄音不會儲存。檔案在你分享前保持私人。Element 並非醫療或診斷裝置。如需查閱或刪除 Element 資料，請聯絡 hello@yatlifestyle.com。"],
      ["你的選擇及資料保留", "你可隨時從訂閱地址電郵至 hello@yatlifestyle.com，免費撤回推廣同意，或要求查閱、更正及刪除資料。我們可能要求必要資料以確認該電郵地址屬於你。我們只在上述目的所需期間保留訂閱資料，並會在發送推廣前檢視名單。撤回後，我們會停止推廣，只保留履行你的選擇或法律責任所需的最少紀錄。刪除要求由品牌處理，並非由網站自動執行。"],
      ["技術資料及本機儲存", "網站會將語言及購物車選擇儲存在瀏覽器的本機儲存空間，不會在該處儲存聯絡及送貨資料。必要的 HttpOnly Cookie 會保留結帳電郵驗證 30 分鐘；獨立的訂單存取 Cookie 最長保留 30 天，讓此瀏覽器查閱訂單。你可在瀏覽器設定中刪除儲存資料及 Cookie，但可能因此失去購物車或訂單的存取。Cloudflare 會處理技術請求資料，以寄存及保護網站。訂閱請求會按 IP 地址限制頻率以減少濫用，但訂閱資料表不會儲存 IP 地址。寄存紀錄可能包括 IP 地址及請求時間等技術資料。此訂閱功能不會新增廣告追蹤工具或追蹤 Cookie。"],
      ["政策更新及日後電郵", "上方日期標示本政策版本。如資料用途改變，我們會更新此頁，並在需要時重新徵求同意。發送推廣電郵前，我們會確保每封郵件都有可用的取消訂閱方式。同意加入此名單不代表同意接收無關推廣。"],
    ],
  },
  "zh-Hans": {
    updated: "更新日期", back: "返回商店", skip: "跳至隐私政策",
    intro: "本隐私政策及个人信息收集声明说明 YAT.lifestyle 如何处理结账、邮箱验证、支持邮件、Element 及自愿订阅邮件的信息。",
    sections: [
      ["谁收集你的信息", "YAT.lifestyle 是负责本网站及订阅名单的香水品牌。如有隐私问题，或希望查阅、更正、删除信息或撤回推广同意，请联系 hello@yatlifestyle.com。"],
      ["我们收集什么", "订阅时，我们会收集你的邮箱地址、所选语言、订阅时间、你同意的推广条款文字、隐私政策版本及已阅读政策的确认。我们也会记录订阅状态及订阅来源。邮件订阅不要求姓名、地址或付款信息。订阅目前以未验证状态保存，不会自动发送确认或推广邮件。"],
      ["结账及邮箱验证", "结账必须先验证邮箱。我们会保存邮箱、验证码带密钥的哈希值，以及有效期限和尝试次数。验证码在 10 分钟后失效，验证凭证在 30 分钟后失效；过期记录会在后续验证请求时清理。继续付款时，我们会保存姓名、邮箱、电话、香港配送地址、选填配送备注、所选商品、语言、金额、优惠码及付款编号和状态，用于处理付款、配送、发送确认及提供支持。订单记录会在上述目的及适用责任所需期间保留；你可联系我们查阅、更正或要求删除。购物或验证邮箱不代表同意接收推广。"],
      ["支持邮件", "发往 orders@yatlifestyle.com、care@yatlifestyle.com 及 hello@yatlifestyle.com 的邮件会保存，用于处理订单及提供支持。Cloudflare D1 保存纯文本预览、发件人、收件人、主题、接收／转发状态及附件名称；私有 Cloudflare R2 保存完整原始邮件及附件。只有获授权管理员可访问收件箱及原始邮件。可选择转发至品牌负责人的 Gmail 收件箱，但收件地址必须先完成验证。我们只在支持、订单及适用责任所需期间保留邮件。如需查阅、更正或删除，请联系 hello@yatlifestyle.com。"],
      ["收集目的", "在你明确同意后，我们会使用你的邮箱发送 YAT.lifestyle 香水上市、系列消息及推广优惠。语言偏好用于选择消息语言；同意记录用于管理你的选择。订阅完全自愿，不订阅也可浏览网站；但没有邮箱地址及同意，我们无法将你加入名单。我们不会出售名单，或向其他企业提供名单作其自身推广用途。"],
      ["保存及访问", "订阅、验证及订单记录保存在 Cloudflare D1。访问限于获授权运营 YAT.lifestyle 的人员，以及支持网站、数据库、邮件及付款的服务提供商。Cloudflare Email 发送验证码及订单确认；Airwallex 提供托管付款页面并处理付款信息。我们的订单数据库保存付款编号、金额及状态，不保存完整银行卡号或安全码。提供商可能在香港以外处理信息。我们可能按法律要求披露信息。"],
      ["Element","使用 Element 香气档案示范时，我们会把你拍摄的盒盖照片保存在 Cloudflare R2，并把油脂及 pH 读数、问卷答案与结果保存在 Cloudflare D1。如你登录，我们也会保存你的邮箱地址，并设置会话 Cookie 以保持登录。这些信息用于微调及显示你的配方，并只在你选择分享时分享你的档案。语音回答由 Cloudflare Workers AI 转录，录音不会保存。档案在你分享前保持私密。Element 并非医疗或诊断设备。如需查阅或删除 Element 信息，请联系 hello@yatlifestyle.com。"],
      ["你的选择及信息保留", "你可随时从订阅地址发邮件至 hello@yatlifestyle.com，免费撤回推广同意，或要求查阅、更正及删除信息。我们可能要求必要信息以确认该邮箱地址属于你。我们只在上述目的所需期间保留订阅信息，并会在发送推广前检查名单。撤回后，我们会停止推广，只保留履行你的选择或法律责任所需的最少记录。删除请求由品牌处理，并非由网站自动执行。"],
      ["技术信息及本地存储", "网站会将语言及购物车选择保存在浏览器的本地存储空间，不会在该处保存联系及配送资料。必要的 HttpOnly Cookie 会保留结账邮箱验证 30 分钟；独立的订单访问 Cookie 最长保留 30 天，让此浏览器查阅订单。你可在浏览器设置中删除存储资料及 Cookie，但可能因此失去购物车或订单的访问。Cloudflare 会处理技术请求信息，以托管及保护网站。订阅请求会按 IP 地址限制频率以减少滥用，但订阅数据表不会保存 IP 地址。托管日志可能包括 IP 地址及请求时间等技术信息。此订阅功能不会新增广告追踪工具或追踪 Cookie。"],
      ["政策更新及日后邮件", "上方日期标示本政策版本。如信息用途改变，我们会更新此页，并在需要时重新征求同意。发送推广邮件前，我们会确保每封邮件都有可用的取消订阅方式。同意加入此名单不代表同意接收无关推广。"],
    ],
  },
};

export default function PrivacyContent() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  return <>
    <a className="skip-link" href="#privacy-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="privacy-page" id="privacy-content">
      <h1>{newsletterCopy[locale].privacy}</h1>
      <p className="privacy-date">{t.updated}: <time dateTime={PRIVACY_UPDATED}>{PRIVACY_UPDATED}</time></p>
      <p>{t.intro}</p>
      {t.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      <a className="email-link" href="mailto:hello@yatlifestyle.com">hello@yatlifestyle.com</a>
    </main>
    <footer className="shop-footer"><span>YAT.lifestyle</span><a href="/shop">{t.back}</a></footer>
  </>;
}
