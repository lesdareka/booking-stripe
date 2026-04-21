import crypto from "crypto";

export default async function handler(req, res) {
  console.log("WEBHOOK TRIGGERED");

  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const event = req.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_email;
      const date = session.metadata?.date;
      const time = session.metadata?.time;
      const tickets = session.metadata?.tickets;

      // 👉 ВАЖНО: hash создаём ПОСЛЕ email
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");

      console.log("Paid user:", email, date, time, tickets);

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

      const data = await response.json();
      console.log("Mailchimp response:", data);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
