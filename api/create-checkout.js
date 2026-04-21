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
              description: `${date} | ${time}`,
            },
            unit_amount: 2500,
          },
          quantity: Number(tickets || 1),
        },
      ],

      metadata: { date, time, email, tickets },

      success_url: "https://booking-stripe-coral.vercel.app/success.html",
      cancel_url: "https://booking-stripe-coral.vercel.app/booking.html",
    });

    return res.status(200).json({ url: session.url });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
