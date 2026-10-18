# AWEP · Engagement Party Jeopardy

A browser party game for Wade and Annabella. The host opens the game on a laptop connected or mirrored to a TV. Guests open the same URL on their phones, enter the six-character room code, and use a large touch buzzer. No guest accounts or installation are required.

## First version

- Host lobby with invite link and up to 40 players or teams.
- Five categories, five clues each, worth 100–500 points.
- Question editor before hosting, with a draft saved on the host device.
- Host opens buzzers after reading each clue.
- The server atomically accepts one buzzer winner; the first accepted request wins. Network latency can affect close calls.
- Players answer aloud. The host marks correct (+value) or incorrect (−value). An incorrect answer reopens buzzers for players who have not tried the clue.
- Answer reveal, skip, scores, end screen, and refresh reconnection using device-local session tokens.
- Rooms expire after 24 hours. Joining closes when play starts.

**Personalize before the party:** the “The happy couple” and “All about us” categories contain starter prompts with placeholder answers. Replace these in Customize the questions. Do not use this repository to publish private guest information.

## Code and hosting

This GitHub repository stores the app source. The initial hosting target is ChatGPT Sites, using a Cloudflare Worker and a D1 database. The frontend uses React and Vinext. GitHub Pages alone cannot run the shared room API or database. Pushing to GitHub does not automatically deploy to Sites.

`app/page.tsx` contains the responsive TV host and phone views. `app/api/game/route.ts` is the room API. `lib/game.mjs` contains game rules, `lib/questions.mjs` the starter pack, and `db/schema.ts` plus `drizzle/` the database schema and migration.

Host and player credentials are random bearer tokens kept in that browser's local storage. Room responses omit credentials, future questions, and unrevealed answers. A room code permits joining an open lobby, not controlling the host. This is an initial party prototype, without public-service abuse throttling, automated room cleanup, a separate host remote, or a latency-compensated buzzer.

## Development

Use Node 22.13 or newer and pnpm. Install dependencies with `pnpm install` (or `npm run install:ci`). The checked-in Sites runtime helpers configure Cloudflare bindings from `.openai/hosting.json`.

```sh
pnpm db:generate
node --test tests/game.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

For local development, apply the SQL migration to the local D1 database using Wrangler before playing:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_bored_nomad.sql
pnpm dev
```

The host should use a different browser/device from a player; one active identity is remembered per browser. Refreshing reconnects. Choosing Leave screen clears that browser's saved identity. Room data is shared server-side; question drafts stay on the host device.

## Party setup

1. Open the deployed app on your laptop and customize the questions.
2. Connect the laptop to the TV with HDMI or screen mirroring, then choose Host a game and full screen.
3. Guests open the same app URL and enter the room code and a name/team.
4. Start after everyone joins. Select a clue, read it, then open the buzzers.
5. Judge the answer aloud and continue through the board.
