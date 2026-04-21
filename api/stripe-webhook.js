import crypto from "crypto";

const subscriberHash = crypto
  .createHash("md5")
  .update(email.toLowerCase())
  .digest("hex");

const response = await fetch(
  `https://${process.env.MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`,
  {
    method: "PUT",
    headers: {
      Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",

      merge_fields: {
        MMERGE7: date,
        MMERGE8: time,
      },

      tags: [`tickets_${tickets}`],
    }),
  }
);
