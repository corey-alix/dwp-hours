import "dotenv/config";

import { sendEmail } from "../server/utils/mailer.js";

const to = "john.doe@example.com";
const cc = "calix@dataworksplus.com";

const subject = "DWP Hours test email";
const text = "This is a test email sent from the DWP Hours Tracker mailer.";

await sendEmail({
  to,
  subject,
  text,
  html: `<p>${text}</p>`,
  cc,
});

console.log(`Sent test email to ${to} (cc: ${cc}).`);
