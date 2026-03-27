import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export default async function getData(x, y) {
  const data = await supabase
    .from("weapons")
    .select("name, file_name, " + x + ", " + y);

  return data;
}
