#!/usr/bin/env node
// Grant the admin role (app_metadata.role) to an existing user.
// Usage (from apps/site01-path-marketplace):
//   node scripts/grant-admin.mjs --email you@example.com
import { argValue, createSupabaseAdmin } from "./lib/product-images.mjs";

const email = argValue(process.argv.slice(2), "--email")?.trim().toLowerCase();
if (!email) {
  console.error("Pass --email user@example.com");
  process.exit(1);
}

const supabase = createSupabaseAdmin();
let page = 1;
let found = null;
for (;;) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  found = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  if (found || data.users.length < 200) break;
  page += 1;
}

if (!found) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(found.id, {
  app_metadata: { ...found.app_metadata, role: "admin" },
});
if (error) throw error;
console.log(`Granted admin to ${email} (${found.id})`);
