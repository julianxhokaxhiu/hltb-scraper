import pLimit from 'p-limit';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

const __dirname = import.meta.dirname;
const outputPath = path.join(__dirname, 'howlongtobeat_games.csv');
const CONCURRENCY = os.cpus().length;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
let pagesFetched = 0;
let gamesProcessed = 0;

const headers = {
  'Referer': 'https://howlongtobeat.com',
  'Origin': 'https://howlongtobeat.com',
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0'
};

const baseBody = {
  searchType: "games",
  searchTerms: [""],
  size: 20,
  searchOptions: {
    games: {
      userId: 0,
      platform: "PC",
      sortCategory: "popular",
      rangeCategory: "main",
      rangeTime: { min: null, max: null },
      gameplay: { perspective: "", flow: "", genre: "", difficulty: "" },
      rangeYear: { min: "", max: "" },
      modifier: ""
    },
    users: { sortCategory: "postcount" },
    lists: { sortCategory: "follows" },
    filter: "",
    sort: 0,
    randomizer: 0
  },
  useCache: true
};

const fetchPage = async (pageNum) => {
  const body = JSON.stringify({ ...baseBody, searchPage: pageNum });
  const response = await fetch('https://howlongtobeat.com/api/seek/6e17f7a193ef3188', {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) throw new Error(`Failed to fetch page ${pageNum}: ${response.status}`);
  return response.json();
};

const fetchSteamIdFromHtml = async (gameId) => {
  await delay(Math.random() * 100); // 0–100ms delay
  const url = `https://howlongtobeat.com/game/${gameId}`;

  try {
    const response = await fetch(url, { headers });
    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);

    if (!match || match.length < 2) throw new Error(`No __NEXT_DATA__ for game ${gameId}`);

    const nextData = JSON.parse(match[1]);
    return nextData?.props?.pageProps?.game?.data?.game[0]?.profile_steam || null;

  } catch (err) {
    console.warn(`⚠️ Steam ID fetch failed for game ${gameId}: ${err.message}`);
    return null;
  }
};

const writeRowToCSV = (row, isFirstRow = false) => {
  const line = row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  fs.writeFileSync(outputPath, line, { encoding: 'utf8', flag: isFirstRow ? 'w' : 'a' });
};

(async () => {
  try {
    console.log("🧭 Fetching page 1 to get total page count...");
    const firstPage = await fetchPage(1);
    const totalPages = firstPage.pageTotal;
    const limit = pLimit(CONCURRENCY);

    // Fetch all pages in parallel
    console.log(`🔄 Fetching ${totalPages} pages concurrently...`);
    const pagePromises = [];
    for (let i = 1; i <= totalPages; i++) {
      pagePromises.push(limit(async () => {
        const result = await fetchPage(i);
        pagesFetched++;
        if (pagesFetched % 50 === 0 || pagesFetched === totalPages) {
          console.log(`📦 Fetched ${pagesFetched}/${totalPages} pages`);
        }
        return result;
      }));
    }

    const allPages = await Promise.all(pagePromises);
    const allGames = allPages.flatMap(p => p.data);
    console.log(`🎮 Total games found: ${allGames.length}`);

    // Write CSV header
    writeRowToCSV(["steam_id", "game_name", "comp_main", "comp_plus", "comp_100"], true);

    // Fetch all Steam IDs in parallel
    console.log(`🚀 Fetching Steam IDs using ${CONCURRENCY} threads...`);
    const gameFetchPromises = allGames.map(game => limit(async () => {
      const steamId = await fetchSteamIdFromHtml(game.game_id);
      const row = [
        steamId,
        game.game_name,
        game.comp_main,
        game.comp_plus,
        game.comp_100
      ];
      writeRowToCSV(row, false);
      gamesProcessed++;
      if (gamesProcessed % 100 === 0 || gamesProcessed === allGames.length) {
        console.log(`🎮 Processed ${gamesProcessed}/${allGames.length} games`);
      }
    }));

    await Promise.all(gameFetchPromises);
    console.log(`🎉 All done! CSV saved at ${outputPath}`);

  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
