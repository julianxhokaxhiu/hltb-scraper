const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const outputPath = path.join(__dirname, 'howlongtobeat_games.csv');

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
  const response = await fetch('https://howlongtobeat.com/api/seek/d4b2e330db04dbf3', {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) throw new Error(`Failed to fetch page ${pageNum}: ${response.status}`);
  return response.json();
};

const fetchSteamIdFromHtml = async (gameId) => {
  const url = `https://howlongtobeat.com/game/${gameId}`;

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Failed to load game page for ${gameId}`);

    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);

    if (!match || match.length < 2) throw new Error(`No __NEXT_DATA__ block found for game ${gameId}`);

    const nextData = JSON.parse(match[1]);
    return nextData?.props?.pageProps?.game?.data?.game[0]?.profile_steam || null;

  } catch (err) {
    console.warn(`⚠️ Steam ID fetch failed for game_id=${gameId}: ${err.message}`);
    return null;
  }
};

const writeRowToCSV = (row, isFirstRow = false) => {
  const line = row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  fs.writeFileSync(outputPath, line, { encoding: 'utf8', flag: isFirstRow ? 'w' : 'a' });
};

(async () => {
  try {
    console.log("Fetching page 1 to determine total page count...");
    const firstPage = await fetchPage(1);
    const totalPages = firstPage.pageTotal || 1;

    // Write header row first
    const header = ["steam_id", "game_name", "comp_main", "comp_plus", "comp_100"];
    writeRowToCSV(header, true);
    console.log("CSV header written.");

    for (let page = 1; page <= totalPages; page++) {
      console.log(`📄 Fetching page ${page} of ${totalPages}...`);
      if (page !== 1) {
        await delay(1000); // pacing between pages
      }

      const pageData = await fetchPage(page);

      for (const game of pageData.data) {
        await delay(500); // pacing between games
        const steamId = await fetchSteamIdFromHtml(game.game_id);

        const row = [
          steamId,
          game.game_name,
          game.comp_main,
          game.comp_plus,
          game.comp_100
        ];

        writeRowToCSV(row, false);
        console.log(`✅ Game "${game.game_name}" written.`);
      }
    }

    console.log(`🎉 Done! CSV saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
})();
