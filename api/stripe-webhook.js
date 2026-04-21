export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST");
  }

  try {
    const event = req.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const email = session.customer_details?.email;

      console.log("Paid user:", email);

      // сюда позже подключим Mailchimp
    }

    res.status(200).json({ received: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}