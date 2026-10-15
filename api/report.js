import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { station_id, fuel, available, device } = req.body;
  
  // Validasi dasar
  if (!station_id || !fuel || available === undefined || !device) {
    return res.status(400).json({ error: 'invalid' });
  }
  
  // Rate limit: max 1 laporan per SPBU per 10 menit per device
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('reports')
    .select('id')
    .eq('device', device)
    .eq('station_id', station_id)
    .gte('created_at', since);
  
  if (recent && recent.length > 0) {
    return res.status(429).json({ error: 'rate limit' });
  }
  
  // Simpan ke database
  const { data, error } = await supabase
    .from('reports')
    .insert({ station_id, fuel, available, device })
    .select('id')
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ id: data.id });
}