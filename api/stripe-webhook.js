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

      console.log("Paid user:", email);

      // SEND TO MAILCHIMP
      const response = await fetch(
        `https://${process.env.MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email,
            status: "subscribed",
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
