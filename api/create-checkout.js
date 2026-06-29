import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import mailchimp from "@mailchimp/mailchimp_marketing";

// =====================
// STRIPE
// =====================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// =====================
// SUPABASE
// =====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// =====================
// MAILCHIMP CONFIG
// =====================
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g. "us21"
});

// =====================
// MAILCHIMP FUNCTION
// =====================
async function addToMailchimp({ email, firstName, lastName }) {
  await mailchimp.lists.addListMember(
    process.env.MAILCHIMP_LIST_ID,
    {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
      },
    }
  );
}

// =====================
// HANDLER
// =====================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      date,
      time,
      tickets,
    } = req.body;

    // =====================
    // 1. CHECK LIMIT (SUPABASE)
    // =====================
    const { data, error } = await supabase
      .from("bookings")
      .select("tickets")
      .eq("date", date)
      .eq("time", time);

    if (error) {
      return res.status(500).json({ error: "DB error" });
    }

    const total = (data || []).reduce(
      (sum, r) => sum + Number(r.tickets),
      0
    );

    if (total + Number(tickets) > 10) {
      return res.status(400).json({
        error: "No spots left",
      });
    }

    // =====================
    // 2. MAILCHIMP (SAFE)
    // =====================
    try {
      await addToMailchimp({
        email,
        firstName,
        lastName,
      });
    } catch (err) {
      console.log("Mailchimp error:", err.message);
    }

    // =====================
    // 3. STRIPE CHECKOUT
    // =====================
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
            unit_amount: 100,
          },
          quantity: Number(tickets),
        },
      ],

      metadata: {
        firstName: String(firstName),
        lastName: String(lastName),
        email: String(email),
        date: String(date),
        time: String(time),
        tickets: String(tickets),
      },

      success_url: "https://remussance.com/success",
      cancel_url: "https://booking-stripe-coral.vercel.app/booking.html",
    });

    return res.status(200).json({
      url: session.url,
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message,
    });
  }
}
