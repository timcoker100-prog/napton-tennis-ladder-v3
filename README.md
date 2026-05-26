# Tennis Ladder - Cloudflare Pages + Supabase

A simple singles tennis ladder web app.

## Features
- Player sign up / sign in with Supabase Auth
- Player profile
- Submit singles result
- Result stays pending until the opponent confirms it
- Ladder updates from confirmed results only
- Scoring: games won + 5 bonus points for a win
- Match rule: total games must be 15 or fewer

## 1. Create Supabase project
1. Go to Supabase and create a project.
2. Open SQL Editor.
3. Paste and run `supabase-schema.sql`.
4. Go to Project Settings > API and copy:
   - Project URL
   - anon public key

## 2. Run locally
```bash
npm install
cp .env.example .env
# edit .env with your Supabase URL and anon key
npm run dev
```

## 3. Deploy to Cloudflare Pages
1. Push this folder to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create application > Pages > Import Git repository.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

## Notes
This is an MVP. Sensible next improvements:
- Admin approval for new players
- Invite code for club members only
- Player challenge system
- Head-to-head page
- Separate seasons
- Email notifications
- Reject disputed result flow
