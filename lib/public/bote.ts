import { prisma } from "@/lib/prisma";

export async function getPublicBote() {
  const [config, includedParticipants] = await Promise.all([
    prisma.boteConfig.findUnique({ where: { id: "default" } }).catch(() => null),
    prisma.participant
      .count({ where: { OR: [{ pay: { equals: "SI", mode: "insensitive" } }, { pagado: { not: null } }] } })
      .catch(() => 0)
  ]);
  const amountPerParticipant = Number(config?.amountPerParticipant ?? 5);
  const manualAdjustment = Number(config?.manualAdjustment ?? 0);
  const specialPrizeAmount = Number(config?.specialPrizeAmount ?? 0);
  const total = includedParticipants * amountPerParticipant + manualAdjustment;
  const distributable = Math.max(total - specialPrizeAmount, 0);
  const first = (distributable * (config?.firstPrizePct ?? 60)) / 100;
  const second = (distributable * (config?.secondPrizePct ?? 30)) / 100;
  const third = (distributable * (config?.thirdPrizePct ?? 10)) / 100;

  return {
    total,
    includedParticipants,
    amountPerParticipant,
    prizes: [
      { name: "Primer premio", value: first },
      { name: "Segundo premio", value: second },
      { name: "Tercer premio", value: third },
      ...(specialPrizeAmount > 0 ? [{ name: config?.specialPrizeLabel ?? "Premio especial", value: specialPrizeAmount }] : [])
    ],
    rules: config?.rules ?? "Reparto del bote entre primer, segundo y tercer clasificado."
  };
}
