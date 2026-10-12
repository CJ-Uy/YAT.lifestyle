import { receiveMail, type InboxEnv, type IncomingMail } from "../lib/inbox.server";

export default {
  fetch() { return new Response("Not found", { status: 404 }); },
  email(message: IncomingMail, env: InboxEnv) { return receiveMail(message, env); },
};
