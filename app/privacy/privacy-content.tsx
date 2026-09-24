"use client";

import SiteHeader, { useLocale } from "../site-header";
import { NEWSLETTER_POLICY_VERSION, newsletterCopy } from "../../lib/newsletter";

const copy = {
  en: {
    updated: "Last updated", back: "Back to the shop", skip: "Skip to privacy policy",
    intro: "This policy and personal information collection statement explain how YAT.lifestyle handles information on this website, including its optional newsletter signup.",
    sections: [
      ["Who is collecting your information", "YAT.lifestyle is the perfume brand responsible for this website and its newsletter list. For privacy questions, access or correction requests, deletion, or withdrawal of marketing consent, contact hello@yatlifestyle.com."],
      ["What we collect", "When you subscribe, we collect your email address, selected language, signup time, the marketing consent wording you accepted, the privacy policy version and your acknowledgement of it. We also record subscription status and that you signed up through the Shop page. We do not ask for a name, address or payment details. Signups are currently stored as unverified; no confirmation or newsletter email is sent automatically."],
      ["Why we collect it", "With your explicit consent, we use your email to send YAT.lifestyle fragrance launch announcements, collection news and promotional offers. Language preference helps us choose the language of updates. Consent records help us manage your choices. Joining is voluntary: you can browse without subscribing, but we cannot add you to the list without an email address and consent. We do not sell the list or provide it to other businesses for their own marketing."],
      ["Where it is stored and who can access it", "The signup list is stored in Cloudflare D1, with access limited to the people authorised to operate YAT.lifestyle and the service providers supporting its hosting and database. Cloudflare may process information outside Hong Kong. We may disclose information where required by law. No mailing provider is connected at present. Before using one, we will review its safeguards and update this policy to describe the service."],
      ["Your choices and how long we keep information", "You can withdraw marketing consent at any time, free of charge, by emailing hello@yatlifestyle.com from the subscribed address. You can also request access, correction or deletion there. We may ask for information needed to confirm the address belongs to you. We retain signup details only while needed for the stated purposes and review the list before sending campaigns. After withdrawal, we stop marketing and retain only the minimum record needed to honour your choice or meet legal obligations. Deletion requests are handled by the brand, not automatically by this website."],
      ["Technical information and local storage", "This website stores your language choice in your browser's local storage. You can remove it using your browser settings. Cloudflare processes technical request information to host and protect the site. Signup requests use an IP-based rate limit to reduce abuse; IP addresses are not saved in the newsletter table. Hosting logs may contain technical information such as IP addresses and request times. This signup does not add advertising trackers or tracking cookies."],
      ["Changes and future emails", "The date above identifies this version. If our use of information changes, we will update this page and seek fresh consent where needed. Before sending newsletters, we will put a working unsubscribe method in each message. Consent to this list is not consent to unrelated marketing."],
    ],
  },
  "zh-Hant": {
    updated: "更新日期", back: "返回商店", skip: "跳至私隱政策",
    intro: "本私隱政策及收集個人資料聲明說明 YAT.lifestyle 如何處理本網站的資料，包括自願訂閱電郵的資料。",
    sections: [
      ["誰收集你的資料", "YAT.lifestyle 是負責本網站及訂閱名單的香水品牌。如有私隱問題，或希望查閱、更正、刪除資料或撤回推廣同意，請聯絡 hello@yatlifestyle.com。"],
      ["我們收集甚麼", "訂閱時，我們會收集你的電郵地址、所選語言、訂閱時間、你同意的推廣條款文字、私隱政策版本及已閱讀政策的確認。我們也會記錄訂閱狀態，以及你透過商店頁面訂閱。我們不要求姓名、地址或付款資料。訂閱目前以未驗證狀態儲存，不會自動發送確認或推廣電郵。"],
      ["收集目的", "在你明確同意後，我們會使用你的電郵發送 YAT.lifestyle 香水上市、系列消息及推廣優惠。語言偏好用於選擇消息語言；同意紀錄用於管理你的選擇。訂閱完全自願，不訂閱也可瀏覽網站；但沒有電郵地址及同意，我們無法將你加入名單。我們不會出售名單，或向其他企業提供名單作其自身推廣用途。"],
      ["儲存及存取", "訂閱名單儲存在 Cloudflare D1，存取限於獲授權營運 YAT.lifestyle 的人員，以及支援網站寄存和資料庫的服務供應商。Cloudflare 可能在香港以外處理資料。我們可能按法律要求披露資料。目前尚未連接郵件發送服務；使用前，我們會檢視其保障措施並更新本政策。"],
      ["你的選擇及資料保留", "你可隨時從訂閱地址電郵至 hello@yatlifestyle.com，免費撤回推廣同意，或要求查閱、更正及刪除資料。我們可能要求必要資料以確認該電郵地址屬於你。我們只在上述目的所需期間保留訂閱資料，並會在發送推廣前檢視名單。撤回後，我們會停止推廣，只保留履行你的選擇或法律責任所需的最少紀錄。刪除要求由品牌處理，並非由網站自動執行。"],
      ["技術資料及本機儲存", "網站會將語言選擇儲存在瀏覽器的本機儲存空間，你可在瀏覽器設定中刪除。Cloudflare 會處理技術請求資料，以寄存及保護網站。訂閱請求會按 IP 地址限制頻率以減少濫用，但訂閱資料表不會儲存 IP 地址。寄存紀錄可能包括 IP 地址及請求時間等技術資料。此訂閱功能不會新增廣告追蹤工具或追蹤 Cookie。"],
      ["政策更新及日後電郵", "上方日期標示本政策版本。如資料用途改變，我們會更新此頁，並在需要時重新徵求同意。發送推廣電郵前，我們會確保每封郵件都有可用的取消訂閱方式。同意加入此名單不代表同意接收無關推廣。"],
    ],
  },
  "zh-Hans": {
    updated: "更新日期", back: "返回商店", skip: "跳至隐私政策",
    intro: "本隐私政策及个人信息收集声明说明 YAT.lifestyle 如何处理本网站的信息，包括自愿订阅邮件的信息。",
    sections: [
      ["谁收集你的信息", "YAT.lifestyle 是负责本网站及订阅名单的香水品牌。如有隐私问题，或希望查阅、更正、删除信息或撤回推广同意，请联系 hello@yatlifestyle.com。"],
      ["我们收集什么", "订阅时，我们会收集你的邮箱地址、所选语言、订阅时间、你同意的推广条款文字、隐私政策版本及已阅读政策的确认。我们也会记录订阅状态，以及你通过商店页面订阅。我们不要求姓名、地址或付款信息。订阅目前以未验证状态保存，不会自动发送确认或推广邮件。"],
      ["收集目的", "在你明确同意后，我们会使用你的邮箱发送 YAT.lifestyle 香水上市、系列消息及推广优惠。语言偏好用于选择消息语言；同意记录用于管理你的选择。订阅完全自愿，不订阅也可浏览网站；但没有邮箱地址及同意，我们无法将你加入名单。我们不会出售名单，或向其他企业提供名单作其自身推广用途。"],
      ["保存及访问", "订阅名单保存在 Cloudflare D1，访问限于获授权运营 YAT.lifestyle 的人员，以及支持网站托管和数据库的服务提供商。Cloudflare 可能在香港以外处理信息。我们可能按法律要求披露信息。目前尚未连接邮件发送服务；使用前，我们会检查其保障措施并更新本政策。"],
      ["你的选择及信息保留", "你可随时从订阅地址发邮件至 hello@yatlifestyle.com，免费撤回推广同意，或要求查阅、更正及删除信息。我们可能要求必要信息以确认该邮箱地址属于你。我们只在上述目的所需期间保留订阅信息，并会在发送推广前检查名单。撤回后，我们会停止推广，只保留履行你的选择或法律责任所需的最少记录。删除请求由品牌处理，并非由网站自动执行。"],
      ["技术信息及本地存储", "网站会将语言选择保存在浏览器的本地存储空间，你可在浏览器设置中删除。Cloudflare 会处理技术请求信息，以托管及保护网站。订阅请求会按 IP 地址限制频率以减少滥用，但订阅数据表不会保存 IP 地址。托管日志可能包括 IP 地址及请求时间等技术信息。此订阅功能不会新增广告追踪工具或追踪 Cookie。"],
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
      <p className="privacy-date">{t.updated}: <time dateTime={NEWSLETTER_POLICY_VERSION}>{NEWSLETTER_POLICY_VERSION}</time></p>
      <p>{t.intro}</p>
      {t.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      <a className="email-link" href="mailto:hello@yatlifestyle.com">hello@yatlifestyle.com</a>
    </main>
    <footer className="shop-footer"><span>YAT.lifestyle</span><a href="/shop">{t.back}</a></footer>
  </>;
}
