import fs from "fs";
import path from "path";
import unzip from "unzipper";
import https from "https";

async function feed(ticker, granularity) {
  const dataDirectory = "./data/";
  let date = new Date("2021-03-01");
  const now = new Date();
  const end = new Date(now.setTime(now.getTime() - 1 * 86400000));

  while (date < end) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    const filename = `${ticker}-${granularity}-${yyyy}-${mm}-${dd}`;
    const out = path.resolve(dataDirectory, `${ticker}/${granularity}`);

    date = new Date(date.setTime(date.getTime() + 1 * 86400000));

    if (
      fs.existsSync(
        path.resolve(dataDirectory, `${ticker}/${granularity}/${filename}.csv`)
      )
    ) {
      continue;
    }

    try {
      console.log(
        "GET ",
        `https://data.binance.vision/data/spot/daily/klines/${ticker}/${granularity}/${filename}.zip`
      );
      await https.get(
        `https://data.binance.vision/data/spot/daily/klines/${ticker}/${granularity}/${filename}.zip`,
        (response) => {
          response.pipe(unzip.Extract({ path: out }));
        }
      );
    } catch (error) {
      console.log("No more files", { last: filename });
      return;
    }
  }
}

if (!process.argv[2] || !process.argv[3]) {
  console.log(
    "Command $> yarn feed [VETUSDT|BTCUSDC|...] [1m|5m|1h|1d|1w|...]"
  );
}

await feed(process.argv[2], process.argv[3]);
