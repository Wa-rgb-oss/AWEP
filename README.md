# AWEP · Engagement Party Jeopardy

A self-contained game for Wade and Annabella. All frontend, server, game rules, and tests live in this repository. No ChatGPT Sites, Cloudflare account, Supabase, or cloud database is required.

## Run the party from your laptop

Install Node.js 22.13 or newer, then download or clone this repository. In its folder run:

```sh
npm install
npm run build
npm start
```

The terminal prints two kinds of addresses:

- `http://localhost:3000` opens the game on the laptop.
- `http://192.168.x.x:3000` (your actual address is printed) opens it on phones connected to the **same Wi-Fi**.

Open the printed Wi-Fi address on the laptop too, so the TV lobby shows the correct address for guests. Connect or mirror your laptop to the TV. Customize the questions, choose **Host a game**, and have guests open that same Wi-Fi address on their phones and enter the room code. Allow Node through Windows Firewall on your private network if prompted. Guest Wi-Fi with device isolation may prevent phones from reaching the laptop. Keep the laptop awake and the server terminal running throughout the party.

No accounts or downloads are needed on guest phones. The server runs on your laptop; it does not run inside GitHub. GitHub stores the complete project. GitHub Pages serves static files and cannot run this server by itself. An internet-accessible version would need a separately selected server host or backend; none is configured here.

## Game features

- Up to 40 players or teams; six-character room codes.
- Five categories of five clues, worth 100–500 points.
- Question editor and device-local question draft.
- TV host screen and large phone buzzers.
- Host opens buzzers after reading each clue, then judges answers spoken aloud.
- Correct answers add the clue value; wrong answers subtract it and reopen buzzing for other players.
- Server accepts exactly one first buzz. Close calls depend on network arrival order.
- Answer reveal, skip, leaderboard, final scores, and refresh reconnection.
- Rooms expire after 24 hours. New guests must join before play starts.
- Room data survives a server restart in ignored `data/rooms.json`. Expired rooms are removed when a new room is created.

**Before your party:** replace the placeholder answers in “The happy couple” and “All about us” using Customize the questions. Those are starter prompts, not facts about the couple.

One active host/player identity is remembered per browser. Use a separate phone or browser to join as a player while hosting. Refreshing reconnects; Leave screen clears that browser's identity. Treat the local data folder as private because it contains answers and session tokens.

## Development

```sh
npm test
npm run build
```

For live frontend editing, run `npm start` in one terminal and `npm run dev` in another. Vite forwards `/api` requests to the server on port 3000. The production server uses built files from `dist/`. Set `PORT` to change its listening port and optionally `HOST` to change the bind address; development proxy defaults to port 3000.

- `src/App.tsx`: TV, phone, lobby, and question editor views.
- `src/style.css`: responsive styling.
- `server.mjs`: built-in Node HTTP server and local room persistence.
- `lib/game.mjs`: authoritative game rules and filtered room responses.
- `lib/questions.mjs`: starter question pack.
- `tests/`: game-rule tests and a real HTTP test with two players and simultaneous buzzes, including persistence across server restart.

This first version targets a trusted private party network. It runs as one Node process; do not run multiple instances against the same data file. It does not yet include a separate host remote, Final Jeopardy, or internet-facing abuse controls.
