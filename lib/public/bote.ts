import { prisma } from "@/lib/prisma";

export async function getPublicBote() {
  const config = await prisma.boteConfig.findUnique({ where: { id: "default" } }).catch(() => null);
  const currency = config?.currency ?? "EUR";
  const total = Number(config?.totalAmount ?? 0);
  const prizes = [
    { name: "Primer premio", value: Number(config?.firstPrize ?? 0) },
    { name: "Segundo premio", value: Number(config?.secondPrize ?? 0) },
    { name: "Tercer premio", value: Number(config?.thirdPrize ?? 0) },
    { name: "Premio consolacion", value: Number(config?.consolationPrize ?? config?.specialPrizeAmount ?? 0) }
  ];
  const prizeSum = prizes.reduce((sum, prize) => sum + prize.value, 0);

  return {
    total,
    currency,
    prizes,
    prizeSum,
    balance: total - prizeSum,
    rules: config?.rules ?? "Reparto del bote entre primer, segundo, tercer clasificado y premio de consolacion.",
    notes: config?.notes ?? null
  };
}