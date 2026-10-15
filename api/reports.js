import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Hanya ambil laporan 24 jam terakhir
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('reports')
    .select('id, station_id, fuel, available, created_at')
    .gte('created_at', since)
    .order('id', { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  
  // Format ringkas: array of arrays (hemat bandwidth)
  const fuelIdx = { pertalite: 0, pertamax: 1, solar: 2 };
  const rows = data.map(r => [
    r.id,
    r.station_id,
    fuelIdx[r.fuel] || 0,
    r.available ? 1 : 0,
    Math.floor(new Date(r.created_at).getTime() / 1000)
  ]);
  
  res.status(200).json({ rows });
}