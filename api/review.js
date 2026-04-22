import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, rating, comment } = req.body;

    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          name,
          rating,
          comment,
          created_at: new Date()
        }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
