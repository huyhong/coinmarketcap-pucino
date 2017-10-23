# coinmarketcap-ticker.app

Simple Electron-based tray application fetching live coin prices from [coinmarketcap.com](https://coinmarketcap.com) and displaying it in your OS tray.

## Features

* Fetches data from (coinmarketcap.com)[https://coinmarketcap.com] every 65s (due to API rate limit)
* Allows currency value to be shown in dollars, euros, or satoshis
* Can customize coins fetched
* Preferences are saved

## Installation

* download [latest release](https://github.com/huyhong/coinmarketcap-ticker/releases/latest)
* open .dmg and drag CoinmarketcapPucino.app to Applications.

## Development

* Clone repo: `https://github.com/huyhong/coinmarketcap-pucino.git && cd coinmarketcap-pucino`
* Install deps: `yarn`
* Dev: `yarn start`
* Build: `yarn build`

## TODO

* Add tests
* Proper error handling
* Limit API calls programmatically
* Test on other platforms (Windows, Linux)
* Menu option to allow different fiat currency conversions (right now only allows USD, EUR, and BTC)
* Remove tray icon
* Change tray font to something more condensed
* Add (spark)[https://github.com/aftertheflood/spark]-based trending sparkline
* Rewrite in something that isn't as heavy as Electron :)

## Built with

* Electron
* Paranoia
* FOMO
* <a href="https://icons8.com">App icon by Icons8</a>