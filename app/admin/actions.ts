"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, requireAdmin } from "@/lib/admin/auth";
import { importExcelWorkbook, type ExcelImportPreview } from "@/lib/import/excel";
import { prisma } from "@/lib/prisma";
import { recalculateAll } from "@/lib/game/recalculateAll";
import { metadataForRule } from "@/lib/game/ruleConfig";

export type ImportActionState = {
  preview?: ExcelImportPreview;
  error?: string;
};

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await createAdminSession(username, password);
  if (!ok) redirect("/admin?error=1");
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin");
}

export async function excelImportAction(_state: ImportActionState, formData: FormData): Promise<ImportActionState> {
  await requireAdmin();
  const file = formData.get("file");
  const intent = String(formData.get("intent") ?? "preview");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecciona un Excel oficial." };
  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const preview = await importExcelWorkbook(buffer, file.name, intent !== "import");
    return { preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function saveResultAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  const homeGoalsRaw = String(formData.get("homeGoals") ?? "");
  const awayGoalsRaw = String(formData.get("awayGoals") ?? "");
  const homeGoals = homeGoalsRaw === "" ? null : Number(homeGoalsRaw);
  const awayGoals = awayGoalsRaw === "" ? null : Number(awayGoalsRaw);
  const qualifiedTeamId = String(formData.get("qualifiedTeamId") ?? "") || null;
  const publishOfficial = intent === "official";
  if (!matchId) redirect("/admin/resultados?error=1");
  if (publishOfficial && (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals))) redirect("/admin/resultados?error=1");

  const previous = await prisma.match.findUnique({ where: { matchId } });
  if (!previous) redirect("/admin/resultados?error=1");

  await prisma.$transaction(async (tx) => {
    await tx.matchResult.updateMany({
      where: { matchId, status: publishOfficial ? "OFFICIAL" : "DRAFT", isActive: true },
      data: { isActive: false }
    });
    await tx.match.update({
      where: { matchId },
      data: {
        homeGoals,
        awayGoals,
        qualifiedTeamId,
        finished: publishOfficial,
        status: publishOfficial ? "OFFICIAL" : "DRAFT",
        resultText: homeGoals == null || awayGoals == null ? null : `${homeGoals}-${awayGoals}`,
        goalDiff: homeGoals == null || awayGoals == null ? null : homeGoals - awayGoals
      }
    });
    await tx.matchResult.create({
      data: {
        matchId,
        status: publishOfficial ? "OFFICIAL" : "DRAFT",
        homeGoals,
        awayGoals,
        qualifiedTeamId,
        isActive: true,
        isOfficial: publishOfficial,
        createdBy: "admin"
      }
    });
    await tx.matchResultEvent.create({
      data: {
        matchId,
        eventType: publishOfficial ? "PUBLISH_OFFICIAL" : "SAVE_DRAFT",
        previousStatus: previous.status,
        nextStatus: publishOfficial ? "OFFICIAL" : "DRAFT",
        previousHomeGoals: previous.homeGoals,
        previousAwayGoals: previous.awayGoals,
        nextHomeGoals: homeGoals,
        nextAwayGoals: awayGoals,
        qualifiedTeamId,
        phase: previous.fase,
        matchday: previous.jornadaId,
        createdBy: "admin"
      }
    });
    await tx.adminLog.create({
      data: {
        action: publishOfficial ? "RESULT_OFFICIAL" : "RESULT_DRAFT",
        message: publishOfficial ? `Resultado oficial publicado: ${matchId}` : `Borrador guardado: ${matchId}`
      }
    });
  });
  if (publishOfficial) {
    await recalculateAll(prisma, { trigger: "official-result", matchId, createdBy: "admin" });
  }
  redirect("/admin/resultados?saved=1");
}

export async function deleteResultAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) redirect("/admin/resultados?error=1");

  const previous = await prisma.match.findUnique({ where: { matchId } });
  if (!previous) redirect("/admin/resultados?error=1");

  const wasOfficial = previous.status === "OFFICIAL";

  await prisma.$transaction(async (tx) => {
    await tx.matchResult.updateMany({ where: { matchId, isActive: true }, data: { isActive: false } });
    await tx.match.update({
      where: { matchId },
      data: {
        homeGoals: null,
        awayGoals: null,
        homePens: null,
        awayPens: null,
        finished: false,
        resultText: null,
        realSign: null,
        goalDiff: null,
        winnerTeamId: null,
        qualifiedTeamId: null,
        overrideQualifiedTeamId: null,
        status: "PENDING"
      }
    });
    await tx.matchResultEvent.create({
      data: {
        matchId,
        eventType: "DELETE_RESULT",
        previousStatus: previous.status,
        nextStatus: "PENDING",
        previousHomeGoals: previous.homeGoals,
        previousAwayGoals: previous.awayGoals,
        nextHomeGoals: null,
        nextAwayGoals: null,
        qualifiedTeamId: null,
        phase: previous.fase,
        matchday: previous.jornadaId,
        createdBy: "admin"
      }
    });
    await tx.adminLog.create({ data: { action: "RESULT_DELETED", message: `Resultado borrado: ${matchId}` } });
  });

  if (wasOfficial) {
    await recalculateAll(prisma, { trigger: "result-deleted", matchId, createdBy: "admin" });
  }
  redirect("/admin/resultados?deleted=1");
}

export async function saveMatchAction(formData: FormData) {
  await requireAdmin();
  const matchId = String(formData.get("matchId") ?? "").trim();
  const matchNoRaw = String(formData.get("matchNo") ?? "");
  const fechaRaw = String(formData.get("fecha") ?? "");
  const homeTeamId = String(formData.get("homeTeamId") ?? "") || null;
  const awayTeamId = String(formData.get("awayTeamId") ?? "") || null;
  const teams = await prisma.team.findMany({
    where: { teamId: { in: [homeTeamId, awayTeamId].filter((value): value is string => Boolean(value)) } },
    select: { teamId: true, seleccion: true }
  });
  const teamNameById = new Map(teams.map((team) => [team.teamId, team.seleccion]));
  const data = {
    matchNo: matchNoRaw === "" ? null : Number(matchNoRaw),
    fecha: fechaRaw ? new Date(fechaRaw) : null,
    jornadaId: String(formData.get("jornadaId") ?? "") || null,
    fase: String(formData.get("fase") ?? "") || null,
    grupo: String(formData.get("grupo") ?? "") || null,
    homeTeamId,
    awayTeamId,
    homeTeam: String(formData.get("homeTeam") ?? "") || teamNameById.get(homeTeamId ?? "") || null,
    awayTeam: String(formData.get("awayTeam") ?? "") || teamNameById.get(awayTeamId ?? "") || null,
    needsPens: formData.get("needsPens") === "on"
  };
  if (!matchId) redirect("/admin/partidos?error=1");
  await prisma.match.upsert({
    where: { matchId },
    update: data,
    create: { matchId, finished: false, status: "PENDING", ...data }
  });
  await prisma.adminLog.create({ data: { action: "MATCH_SAVED", message: `Partido guardado: ${matchId}` } });
  redirect("/admin/partidos?saved=1");
}

export async function clearTestResultsAction() {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.match.updateMany({
      data: {
        homeGoals: null,
        awayGoals: null,
        homePens: null,
        awayPens: null,
        finished: false,
        resultText: null,
        realSign: null,
        goalDiff: null,
        winnerTeamId: null,
        qualifiedTeamId: null,
        overrideQualifiedTeamId: null,
        status: "PENDING"
      }
    });
    await tx.scoringMatch.deleteMany();
    await tx.scoringGroup.deleteMany();
    await tx.scoringBonus.deleteMany();
    await tx.matchResult.updateMany({ data: { isActive: false } });
    await tx.generalRanking.updateMany({
      data: {
        pointsMatches: 0,
        pointsGroups: 0,
        pointsEliminatorias: 0,
        pointsBonus: 0,
        pointsTotal: 0,
        exactScores: 0,
        correctDiff: 0,
        correctSigns: 0,
        correctGroupQualified: 0,
        correctGroupPositions: 0,
        correctCruces: 0,
        deltaPos: 0,
        deltaPoints: 0
      }
    });
    await tx.matchResultEvent.create({
      data: {
        eventType: "CLEAR_TEST_RESULTS",
        nextStatus: "PENDING",
        createdBy: "admin"
      }
    });
    await tx.adminLog.create({ data: { action: "CLEAR_TEST_RESULTS", message: "Resultados de prueba limpiados para inicio de produccion." } });
  });
  await recalculateAll(prisma, { trigger: "production-reset", eventLabel: "Inicio de produccion", createdBy: "admin" });
  redirect("/admin/resultados?cleared=1");
}

export async function saveBoteAction(formData: FormData) {
  await requireAdmin();
  await prisma.boteConfig.upsert({
    where: { id: "default" },
    update: {
      totalAmount: String(formData.get("totalAmount") ?? "0"),
      firstPrize: String(formData.get("firstPrize") ?? "0"),
      secondPrize: String(formData.get("secondPrize") ?? "0"),
      thirdPrize: String(formData.get("thirdPrize") ?? "0"),
      consolationPrize: String(formData.get("consolationPrize") ?? "0"),
      currency: String(formData.get("currency") ?? "EUR") || "EUR",
      notes: String(formData.get("notes") ?? "") || null,
      updatedBy: "admin",
      rules: String(formData.get("rules") ?? "") || "Reparto del bote entre primer, segundo, tercer clasificado y premio de consolacion."
    },
    create: {
      id: "default",
      totalAmount: String(formData.get("totalAmount") ?? "0"),
      firstPrize: String(formData.get("firstPrize") ?? "0"),
      secondPrize: String(formData.get("secondPrize") ?? "0"),
      thirdPrize: String(formData.get("thirdPrize") ?? "0"),
      consolationPrize: String(formData.get("consolationPrize") ?? "0"),
      currency: String(formData.get("currency") ?? "EUR") || "EUR",
      notes: String(formData.get("notes") ?? "") || null,
      updatedBy: "admin",
      rules: String(formData.get("rules") ?? "Reparto del bote entre primer, segundo, tercer clasificado y premio de consolacion."),
      amountPerParticipant: "0",
      manualAdjustment: "0",
      firstPrizePct: 0,
      secondPrizePct: 0,
      thirdPrizePct: 0,
      specialPrizeAmount: "0"
    }
  });
  await prisma.adminLog.create({ data: { action: "BOTE_UPDATED", message: "Configuracion del bote actualizada." } });
  redirect("/admin/bote?saved=1");
}

export async function saveRulesAction(formData: FormData) {
  await requireAdmin();
  const keys = formData.getAll("ruleKey").map((value) => String(value));
  await prisma.$transaction(async (tx) => {
    for (const key of keys) {
      const valueRaw = String(formData.get(`value:${key}`) ?? "0").trim();
      const value = Number(valueRaw);
      if (!key || !Number.isInteger(value)) continue;
      const meta = metadataForRule(key);
      const data = {
        value,
        active: formData.get(`active:${key}`) === "on",
        description: String(formData.get(`description:${key}`) ?? "") || null,
        category: meta.category,
        label: meta.label,
        sortOrder: meta.sortOrder
      };
      await tx.gameRule.upsert({
        where: { key },
        update: data,
        create: { key, ...data }
      });
    }
    await tx.adminLog.create({ data: { action: "RULES_UPDATED", message: "Reglas de puntuacion actualizadas desde admin." } });
  });
  revalidatePath("/reglas");
  revalidatePath("/admin/reglas");
  redirect("/admin/reglas?saved=1");
}
export async function rollbackAction() {
  await requireAdmin();
  const latest = await prisma.rankingSnapshot.findFirst({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, matchId: true }
  });
  const snapshot = await prisma.rankingSnapshot.findFirst({
    where: { isPublished: true, id: latest ? { not: latest.id } : undefined },
    orderBy: { createdAt: "desc" },
    include: { rows: { orderBy: { pos: "asc" } } }
  });
  if (!snapshot) redirect("/admin/rollback?empty=1");
  await prisma.$transaction(async (tx) => {
    if (latest) {
      await tx.rankingSnapshot.update({ where: { id: latest.id }, data: { isPublished: false, isLatest: false } });
      if (latest.matchId) {
        await tx.matchResult.updateMany({ where: { matchId: latest.matchId, status: "OFFICIAL", isActive: true }, data: { isActive: false } });
        await tx.match.update({ where: { matchId: latest.matchId }, data: { status: "PENDING", finished: false, homeGoals: null, awayGoals: null, resultText: null, goalDiff: null, qualifiedTeamId: null } });
      }
    }
    await tx.rankingSnapshot.update({ where: { id: snapshot.id }, data: { isPublished: true, isLatest: true } });
    await tx.generalRanking.deleteMany();
    await tx.generalRanking.createMany({
      data: snapshot.rows.map((row) => ({
        pos: row.pos,
        participantId: row.participantId,
        alias: row.alias,
        departamento: row.departamento,
        rango: row.rango,
        pointsMatches: row.pointsMatches,
        pointsGroups: row.pointsGroups,
        pointsEliminatorias: row.pointsEliminatorias,
        pointsBonus: row.pointsBonus,
        pointsTotal: row.pointsTotal,
        deltaPos: row.deltaPos,
        deltaPoints: row.deltaPoints
      }))
    });
    await tx.adminLog.create({ data: { action: "ROLLBACK", message: `Rollback a snapshot ${snapshot.id}` } });
  });
  redirect("/admin/rollback?ok=1");
}


