import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { email, date, time, tickets } = req.body;

    const quantity = Number(tickets || 1);
    const pricePerTicket = 2500;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Event Ticket",
              description: `${date} • ${time}`,
            },
            unit_amount: pricePerTicket,
          },
          quantity,
        },
      ],

      metadata: {
        date,
        time,
        tickets: quantity,
      },

      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel",
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}