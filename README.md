# Requirement

Node 14+

# Install

```
yarn
```

# Backtest

Check existing feed here https://data.binance.vision/?prefix=data/spot/daily/klines/

First we need to get historical data:

```
yarn feed BTCUSDT 5m
```

It will get all BTCUSDT data with a 5 minutes granularity. All the files are stored in the `./data` folder.

Then run the test:

```
yarn test [VETUSDT|BTCUSDC|...] [1m|5m|1h|1d|1w|...] ([allocation])
```

Example:

```
yarn test BTCUSDT 5m 100
```

It will backtest BTCUSDT with 5 minutes granularity and a base allocation of 100USDT

# Trade

To trade, the command is the similar to backtest, except you need to specify you Binance API key and secret as environnment variable

```
BINANCE_API_KEY=xxx BINANCE_API_SECRET=xxx yarn trade BTCUSDT 5m 100
```
