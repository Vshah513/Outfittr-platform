#!/usr/bin/env node
/**
 * Check auth redirect configuration: local env and (optionally) Supabase project.
 * Run: node scripts/check-auth-redirect.js
 * Optional: SUPABASE_ACCESS_TOKEN in env to fetch Supabase redirect URLs.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const projectRef = 'hjnkbqrezdfnwlydnmct'; // from NEXT_PUBLIC_SUPABASE_URL

function loadEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  const content = fs.readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

async function main() {
  const env = loadEnv(envPath);

  console.log('--- Local .env.local ---');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', env.NEXT_PUBLIC_SUPABASE_URL ? '✓ set' : '✗ NOT SET');
  console.log('NEXT_PUBLIC_APP_URL:', env.NEXT_PUBLIC_APP_URL || '(not set)');
  console.log('NEXT_PUBLIC_SITE_URL:', env.NEXT_PUBLIC_SITE_URL || '(not set)');

  const base = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callbackUrl = `${base}/api/auth/callback`;
  const prodBase = 'https://outfittr-platform.vercel.app';
  const prodCallbackUrl = `${prodBase}/api/auth/callback`;

  console.log('\nApp callback URL (local):', callbackUrl);
  console.log('App callback URL (production):', prodCallbackUrl);

  if (!env.NEXT_PUBLIC_APP_URL && !env.NEXT_PUBLIC_SITE_URL) {
    console.log('\n⚠️  Neither NEXT_PUBLIC_APP_URL nor NEXT_PUBLIC_SITE_URL set — redirect would fallback to http://localhost:3000');
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (token) {
    console.log('\n--- Supabase project auth config (Management API) ---');
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.log('API response:', res.status, res.statusText);
        const text = await res.text();
        if (text) console.log(text.slice(0, 500));
        return;
      }
      const data = await res.json();
      const siteUrl = data.site_url ?? data.SITE_URL;
      let redirectUrls = data.redirect_urls ?? data.redirect_urls;
      if (typeof redirectUrls === 'string') redirectUrls = redirectUrls ? [redirectUrls] : [];
      if (!Array.isArray(redirectUrls)) redirectUrls = [];
      console.log('Site URL (Supabase):', siteUrl || '(not set)');
      console.log('Redirect URLs (Supabase):', redirectUrls.length ? redirectUrls : '(none)');
      if (siteUrl) console.log('Supabase default redirect:', siteUrl);
      const allowed = redirectUrls;
      const hasLocal = allowed.some((u) => u && u.includes('localhost') && u.includes('/api/auth/callback'));
      const hasProd = allowed.some((u) => u && u.includes('outfittr-platform.vercel.app') && u.includes('/api/auth/callback'));
      if (!hasLocal && !hasProd) {
        console.log('\n⚠️  Add these in Supabase → Authentication → URL Configuration → Redirect URLs:');
        console.log('   ', callbackUrl);
        console.log('   ', prodCallbackUrl);
      } else {
        if (hasLocal) console.log('\n✓ Local callback URL is allowed.');
        if (hasProd) console.log('✓ Production callback URL is allowed.');
        if (!hasLocal || !hasProd) {
          console.log('  Missing: add', !hasLocal ? callbackUrl : prodCallbackUrl);
        }
      }
    } catch (e) {
      console.log('Error fetching Supabase config:', e.message);
    }
  } else {
    console.log('\n--- Supabase Dashboard (manual check) ---');
    console.log('To check redirect URLs in Supabase:');
    console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/auth/url-configuration');
    console.log('2. Under "Redirect URLs", ensure this is listed:');
    console.log('   ', callbackUrl);
    console.log('\nOptional: set SUPABASE_ACCESS_TOKEN to have this script fetch auth config.');
    console.log('  Get a token: https://supabase.com/dashboard/account/tokens');
  }
}

main();
