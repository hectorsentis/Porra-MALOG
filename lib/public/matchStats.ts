export type PredictionBet = {
  predHomeGoals: number | null;
  predAwayGoals: number | null;
};

export function predictionSign(homeGoals: number | null | undefined, awayGoals: number | null | undefined) {
  if (homeGoals == null || awayGoals == null) return "Pendiente";
  if (homeGoals > awayGoals) return "1";
  if (homeGoals < awayGoals) return "2";
  return "X";
}

export function summarizePredictionDistribution(bets: PredictionBet[]) {
  const signs = { one: 0, draw: 0, two: 0, pending: 0 };
  const results = new Map<string, number>();
  let goals = 0;
  let complete = 0;
  let biggestWin = 0;

  for (const bet of bets) {
    const sign = predictionSign(bet.predHomeGoals, bet.predAwayGoals);
    if (sign === "1") signs.one += 1;
    else if (sign === "X") signs.draw += 1;
    else if (sign === "2") signs.two += 1;
    else signs.pending += 1;

    if (bet.predHomeGoals != null && bet.predAwayGoals != null) {
      const key = `${bet.predHomeGoals}-${bet.predAwayGoals}`;
      results.set(key, (results.get(key) ?? 0) + 1);
      goals += bet.predHomeGoals + bet.predAwayGoals;
      biggestWin = Math.max(biggestWin, Math.abs(bet.predHomeGoals - bet.predAwayGoals));
      complete += 1;
    }
  }

  const [mostPredictedResult, mostPredictedCount] = [...results.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? ["-", 0];
  const total = bets.length;

  return {
    total,
    signs,
    signRows: [
      { name: "1", value: signs.one },
      { name: "X", value: signs.draw },
      { name: "2", value: signs.two }
    ],
    mostPredictedResult,
    mostPredictedCount,
    mostPredictedPct: total ? Math.round((mostPredictedCount / total) * 100) : 0,
    averageGoals: complete ? Math.round((goals / complete) * 100) / 100 : 0,
    biggestWin
  };
}