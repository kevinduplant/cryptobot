import technicalindicators from "technicalindicators";

export async function sma(period, values) {
  const sma = technicalindicators.sma({ period, values });
  return sma[sma.length - 1];
}

export async function ema(period, values) {
  const ema = technicalindicators.ema({ period, values });
  return ema[ema.length - 1];
}

export async function rsi(period, values) {
  const rsi = technicalindicators.rsi({ period, values });
  return rsi[rsi.length - 1];
}

export async function bb(period, values) {
  const bb = technicalindicators.bollingerbands({
    period,
    stdDev: 2,
    values,
  });
  return bb[bb.length - 1];
}

export async function ichimoku(parameters, high, low) {
  const ichimoku = technicalindicators.ichimokucloud({
    high,
    low,
    ...parameters,
  });
  return ichimoku[ichimoku.length - 1];
}

export async function vp(period, high, low, open, close, volume) {
  const vp = technicalindicators.volumeprofile({
    high,
    open,
    low,
    close,
    volume,
    noOfBars: period,
  });
  return vp[vp.length - 1];
}

export async function macd(parameters, values) {
  const macd = technicalindicators.macd({
    values,
    ...parameters,
  });

  return macd[macd.length - 1];
}

export async function stochastic(parameters, low, high, close) {
  const stochastic = technicalindicators.stochastic({
    ...parameters,
    low,
    high,
    close,
  });

  return stochastic[stochastic.length - 1];
}

export async function heikinashi(low, high, open, close, volume, timestamp) {
  const heikinashi = technicalindicators.heikinashi({
    low,
    open,
    volume,
    high,
    close,
    timestamp,
  });

  return {
    open: heikinashi.open[heikinashi.open.length - 1],
    close: heikinashi.close[heikinashi.close.length - 1],
    high: heikinashi.high[heikinashi.high.length - 1],
    low: heikinashi.low[heikinashi.low.length - 1],
    volume: heikinashi.volume[heikinashi.volume.length - 1],
  };
}

export async function roc(period, values) {
  const roc = technicalindicators.roc({
    values,
    period,
  });

  return roc[roc.length - 1];
}

export async function atr(period, low, high, close) {
  const atr = technicalindicators.atr({
    low,
    high,
    close,
    period,
  });

  return atr[atr.length - 1];
}

export async function psar(step, max, high, low) {
  const psar = technicalindicators.psar({
    step,
    max,
    high,
    low,
  });

  return psar[psar.length - 1];
}

export async function adx(period, low, high, close) {
  const adx = technicalindicators.adx({
    high,
    low,
    close,
    period,
  });

  return adx[adx.length - 1];
}

export async function mfi(period, low, high, close, volume) {
  const mfi = technicalindicators.mfi({
    high,
    low,
    close,
    period,
    volume,
  });

  return mfi[mfi.length - 1];
}

export async function ao(parameters, low, high) {
  const ao = technicalindicators.awesomeoscillator({
    ...parameters,
    high,
    low,
  });

  return ao[ao.length - 1];
}

export async function spinningTop(open, close, high, low) {
  const bearish = technicalindicators.bearishspinningtop({
    open,
    close,
    high,
    low,
  });
  const bullish = technicalindicators.bullishspinningtop({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function engulfingPattern(open, close, high, low) {
  const bearish = technicalindicators.bearishengulfingpattern({
    open,
    close,
    high,
    low,
  });

  const bullish = technicalindicators.bullishengulfingpattern({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function marubozu(open, close, high, low) {
  const bearish = technicalindicators.bearishmarubozu({
    open,
    close,
    high,
    low,
  });
  const bullish = technicalindicators.bullishmarubozu({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function harami(open, close, high, low) {
  const bearish = technicalindicators.bearishharami({
    open,
    close,
    high,
    low,
  });

  const bullish = technicalindicators.bullishharami({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function abandonedBaby(open, close, high, low) {
  const abandonedBaby = technicalindicators.abandonedbaby({
    open,
    close,
    high,
    low,
  });

  return abandonedBaby;
}
export async function hangingMan(open, close, high, low) {
  const hangingMan = technicalindicators.hangingman({
    open,
    close,
    high,
    low,
  });

  return hangingMan;
}

export async function shootingStar(open, close, high, low) {
  const shootingStar = technicalindicators.shootingstar({
    open,
    close,
    high,
    low,
  });

  return shootingStar;
}

export async function gravestoneDoji(open, close, high, low) {
  const gravestoneDoji = technicalindicators.gravestonedoji({
    open,
    close,
    high,
    low,
  });

  return gravestoneDoji;
}

export async function darkCloudCover(open, close, high, low) {
  const darkCloudCover = technicalindicators.darkcloudcover({
    open,
    close,
    high,
    low,
  });

  return darkCloudCover;
}

export async function eveningDojiStar(open, close, high, low) {
  const eveningDojiStar = technicalindicators.eveningdojistar({
    open,
    close,
    high,
    low,
  });

  return eveningDojiStar;
}

export async function eveningStar(open, close, high, low) {
  const eveningStar = technicalindicators.eveningstar({
    open,
    close,
    high,
    low,
  });

  return eveningStar;
}

export async function threeBlackCrows(open, close, high, low) {
  const threeBlackCrows = technicalindicators.threeblackcrows({
    open,
    close,
    high,
    low,
  });

  return threeBlackCrows;
}

export async function hammer(open, close, high, low) {
  const bearish = technicalindicators.bearishhammerstick({
    open,
    close,
    high,
    low,
  });

  const bullish = technicalindicators.bullishhammerstick({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function invertedHammer(open, close, high, low) {
  const bearish = technicalindicators.bearishinvertedhammerstick({
    open,
    close,
    high,
    low,
  });

  const bullish = technicalindicators.bullishinvertedhammerstick({
    open,
    close,
    high,
    low,
  });

  return { bearish, bullish };
}

export async function dragonflyDoji(open, close, high, low) {
  const dragonflyDoji = technicalindicators.dragonflydoji({
    open,
    close,
    high,
    low,
  });

  return dragonflyDoji;
}

export async function piercingLine(open, close, high, low) {
  const piercingLine = technicalindicators.piercingline({
    open,
    close,
    high,
    low,
  });

  return piercingLine;
}

export async function morningDojiStar(open, close, high, low) {
  const morningDojiStar = technicalindicators.morningdojistar({
    open,
    close,
    high,
    low,
  });

  return morningDojiStar;
}

export async function morningStar(open, close, high, low) {
  const morningStar = technicalindicators.morningstar({
    open,
    close,
    high,
    low,
  });

  return morningStar;
}

export async function threeWhiteSoldiers(open, close, high, low) {
  const threeWhiteSoldiers = technicalindicators.threewhitesoldiers({
    open,
    close,
    high,
    low,
  });

  return threeWhiteSoldiers;
}
