const path = require("path");
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  dialog,
  powerSaveBlocker
} = require("electron");
const fetch = require("node-fetch");
const prompt = require("electron-prompt");
const settings = require("electron-settings");

// Chromium switches to get setTimeout() to fire reliably
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
powerSaveBlocker.start("prevent-app-suspension");

app.on("ready", () => {
  new BrowserWindow({ show: false });
  if (app.dock) app.dock.hide();

  const tray = new Tray(path.join(app.getAppPath(), "/assets/bitcoin.png"));
  // Don't exceed 10 calls every 60s (and leave a little room)
  // (rate limit as listed on coinmarketcap's api: https://coinmarketcap.com/api/)
  const intervalMs = 65000;
  // Requires long name for given coin, not their ticker symbol, check URL on coinmarketcap.com
  const initialCoinsShown = ["bitcoin", "ethereum"];
  // Endpoint always returns USD price, also fetch EU
  const conversionCurrency = "EUR";
  const coinmarketcapUrl =
    "https://api.coinmarketcap.com/v1/ticker/COIN_NAME/?convert=" +
    conversionCurrency;
  // Sample coinmarketcap.com response for a single ticker request: https://coinmarketcap.com/api/
  // [
  //   {
  //     "id": "bitcoin",
  //     "name": "Bitcoin",
  //     "symbol": "BTC",
  //     "rank": "1",
  //     "price_usd": "573.137",
  //     "price_btc": "1.0",
  //     "24h_volume_usd": "72855700.0",
  //     "market_cap_usd": "9080883500.0",
  //     "available_supply": "15844176.0",
  //     "total_supply": "15844176.0",
  //     "percent_change_1h": "0.04",
  //     "percent_change_24h": "-0.3",
  //     "percent_change_7d": "-0.57",
  //     "last_updated": "1472762067"
  //     "price_eur": "5081.913756",
  //     "24h_volume_eur": "1720391283.0",
  //     "market_cap_eur": "84564188330.0"
  //   }
  // ]

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Display in $",
        click: () => menuDisplayIn("dollar")
      },
      {
        label: "Display in €",
        click: () => menuDisplayIn("euro")
      },
      {
        label: "Display in シ",
        click: () => menuDisplayIn("satoshi")
      },
      {
        label: "Change coins",
        click: () => menuChangeCoins()
      },
      {
        label: "Quit",
        click: () => app.quit()
      }
    ])
  );

  tray.on("click", tray.popUpContextMenu);
  tray.on("right-click", tray.popUpContextMenu);
  app.on("window-all-closed", app.quit);

  let title = "";
  tray.setTitle(title);
  console.log(settings.getAll());
  let preferences = Object.assign(
    {
      currency: "dollar", // dollar, euro, satoshi
      coins: initialCoinsShown
    },
    settings.getAll()
  );

  function menuDisplayIn(currency) {
    preferences.currency = currency;
    settings.set("currency", preferences.currency);
    menuRefreshAlert();
  }

  function menuRefreshAlert() {
    dialog.showMessageBox({
      title: "Settings saved",
      message:
        "Settings will change upon next refresh (due to API rate limiting).",
      type: "info",
      buttons: ["Okie doke"]
    });
  }

  function menuChangeCoins() {
    prompt({
      title: "What altcoins do you want to fetch:",
      label:
        "What altcoins do you want to fetch (use longnames with commas separating)",
      value: preferences.coins,
      inputAttrs: {
        type: "text"
      },
      type: "input"
    })
      .then(result => {
        // TODO: Add a more proper check here (or list all the coins with checkboxes)
        if (result.length) {
          preferences.coins = result.split(",").map(r => {
            return r.trim();
          });
          settings.set("coins", preferences.coins);
          menuRefreshAlert();
        }
      })
      .catch(console.error);
  }

  function getEndpointUrl(coinName) {
    return coinmarketcapUrl.replace("COIN_NAME", coinName);
  }

  async function fetchAndDisplay(coins) {
    let promises = [];
    for (let coin in coins) {
      let p = fetch(getEndpointUrl(coins[coin]))
        .then(response => {
          return response.json();
        })
        .catch(error => {
          console.log(error);
        });
      promises.push(p);
    }
    Promise.all(promises)
      .then(function(values) {
        let output = "";
        console.info(values);
        for (let value in values) {
          const ticker = values[value][0];
          const symbol = ticker.symbol;
          // Preferred price display is in satoshis so remove leading 0s
          // TODO: optional satoshi suffix = シ
          const priceSatoshi = ticker.price_btc.replace(/^0.0+/, "");
          const priceUsd = "$" + parseFloat(ticker.price_usd).toFixed(2);
          const priceEur = "€" + parseFloat(ticker.price_eur).toFixed(2);
          switch (preferences.currency) {
            case "dollar":
              output += `${symbol}:${priceUsd} `;
              break;
            case "euro":
              output += `${symbol}:${priceEur} `;
              break;
            case "satoshi":
            default:
              output += `${symbol}:${priceSatoshi} `;
              break;
          }
        }
        tray.setTitle(output.trim());
      })
      .then(function() {
        promises = [];
      });
  }

  // Init with first fetch
  fetchAndDisplay(preferences.coins);
  // Add timer for subsequent fetches
  setInterval(function() {
    fetchAndDisplay(preferences.coins);
  }, intervalMs);
});
