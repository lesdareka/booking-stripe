import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).send("Only GET/POST allowed");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Event Ticket",
            },
            unit_amount: 2500,
          },
          quantity: 1,
        },
      ],
      success_url: "https://your-domain.com/success",
      cancel_url: "https://your-domain.com/cancel",
    });

    return res.redirect(303, session.url);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
