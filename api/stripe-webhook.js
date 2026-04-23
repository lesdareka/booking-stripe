import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

      console.log("Paid user:", email, date, time, tickets);

      // ❗ 1. ЗАЩИТА: если email нет — выходим
      if (!email) {
        console.error("No email in session");
        return res.status(200).json({ received: true });
      }

      // ✔ 2. MAILCHIMP
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");

      await fetch(
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

      // ❗ 3. ПРОВЕРКА ДУБЛЯ
      const { data: existing } = await supabase
        .from("bookings")
        .select("*")
        .eq("email", email)
        .eq("date", date)
        .eq("time", time);

      if (!existing || existing.length === 0) {
        const { error } = await supabase.from("bookings").insert([
          {
            email,
            date,
            time,
            tickets: Number(tickets),
          },
        ]);

        if (error) {
          console.error("SUPABASE ERROR:", error);
        } else {
          console.log("Booking saved");
        }
      } else {
        console.log("Duplicate booking skipped");
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
