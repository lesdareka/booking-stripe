import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { email, date, time, tickets } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Event Ticket",
              description: `Date: ${date} | Time: ${time}`,
            },
            unit_amount: 2500,
          },
          quantity: Number(tickets || 1),
        },
      ],

      metadata: {
        date,
        time,
        tickets,
        email
      },

      success_url: "https://your-domain.com/success",
      cancel_url: "https://your-domain.com/cancel",
    });

    return res.status(200).json({ url: session.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
