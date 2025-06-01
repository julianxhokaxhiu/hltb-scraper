# HLTB Scraper

This simple project uses https://howlongtobeat.com undocumented APIs from the service to build a CSV with the following information:

- Steam App ID ( `steam_id` )
- Game Name ( `game_name` )
- HLTB Main Story ( `comp_main` ), in seconds
- HLTB Main + Sides ( `comp_plus` ), in seconds
- HLTB Completionist ( `comp_100` ), in seconds

Here's an example extract you'll get when you run the project:

```csv
"steam_id","game_name","comp_main","comp_plus","comp_100"
"1903340","Clair Obscur: Expedition 33","97499","148088","221460"
"3017860","Doom: The Dark Ages","49420","62568","82086"
"1174180","Red Dead Redemption 2","182062","301790","677997"
"1086940","Baldur's Gate 3","258911","410907","628021"
"2623190","The Elder Scrolls IV: Oblivion Remastered","58011","172050","302293"
"271590","Grand Theft Auto V","115371","183447","312916"
"1245620","Elden Ring","215276","362295","484820"
"292030","The Witcher 3: Wild Hunt","185634","372989","626756"
"1091500","Cyberpunk 2077","92972","225659","384100"
"379720","Doom","41999","59167","97721"
"620","Portal 2","30947","49466","80266"
"367520","Hollow Knight","97268","150237","232591"
"400","Portal","11236","18888","37013"
```

## Why?

It is annoying that [despite a long time request from the community for a public API](https://howlongtobeat.com/forum/thread/807/1) they haven't yet come with a solution.
So instead of hammering their website, this project aims at building a local DB so it can be used for projects willing to include this data in their own apps.

## How to Run

Ensure [Node.js](https://nodejs.org/) is installed correctly in your system, then:

```bash
$ git clone https://github.com/julianxhokaxhiu/hltb-scraper.git
$ cd hltb-scraper
$ npm install
$ npm run start
```

You'll start to see a new file `howlongtobeat_games.csv` being generated in the project folder.

## Get the DB

You can find weekly snapshots under the [Releases](https://github.com/julianxhokaxhiu/hltb-scraper/releases) section.

The workflow is scheduled to run weekly every Sunday at 01:00 UTC.
