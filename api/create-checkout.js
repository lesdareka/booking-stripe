import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { email, date, time, tickets } = req.body;

    // ===== 1. ПРОВЕРКА ЛИМИТА =====
    const { data, error } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("date", date)
      .eq("time", time);

    if (error) {
      return res.status(500).json({ error: "DB error" });
    }

    const total = data.reduce((sum, r) => sum + Number(r.tickets), 0);

    if (total + Number(tickets) > 10) {
      return res.status(400).json({
        error: "No spots left"
      });
    }

    // ===== 2. STRIPE =====
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
            unit_amount: 3500,
          },
          quantity: Number(tickets || 1),
        },
      ],

      metadata: {
        date,
        time,
        email,
        tickets
      },

      success_url: "https://remussance.com/success",
      cancel_url: "https://booking-stripe-coral.vercel.app/booking.html",
    });

    return res.status(200).json({ url: session.url });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
