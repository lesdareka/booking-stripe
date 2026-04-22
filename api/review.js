import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, rating, text } = req.body;

  const { error } = await supabase.from("reviews").insert([
    { name, rating, text }
  ]);

  if (error) {
    return res.status(500).json({ success: false, error });
  }

  res.status(200).json({ success: true });
}