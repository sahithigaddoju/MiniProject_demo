/**
 * Adds missing columns to scheduled_workloads table.
 * Run: node scripts/migrate-table.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

// Use Supabase Management API to run SQL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const ALTER_SQL = `
alter table scheduled_workloads
  add column if not exists filename      text,
  add column if not exists scheduled_at  timestamptz,
  add column if not exists is_emergency  boolean default false;
`;

console.log('Adding missing columns to scheduled_workloads...');
console.log('\nRun this SQL in Supabase Dashboard → SQL Editor:\n');
console.log(ALTER_SQL);

// Try Management API if access token provided
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: ALTER_SQL }),
  });
  const body = await res.text();
  if (res.ok) console.log('✅ Columns added via Management API');
  else console.log('Management API response:', res.status, body);
} else {
  console.log('\nTo run automatically, set SUPABASE_ACCESS_TOKEN env var.');
  console.log('Get it from: https://supabase.com/dashboard/account/tokens');
}
