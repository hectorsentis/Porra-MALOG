import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCachedKickoffWindows: vi.fn(),
  hasMatchInLiveWindow: vi.fn(),
  runApiFootballLivePoll: vi.fn()
}));

vi.mock("@/lib/live/kickoffCache", () => ({
  getCachedKickoffWindows: mocks.getCachedKickoffWindows,
  hasMatchInLiveWindow: mocks.hasMatchInLiveWindow
}));

vi.mock("@/lib/api-football/livePoll", () => ({
  runApiFootballLivePoll: mocks.runApiFootballLivePoll
}));

import { GET } from "@/app/api/cron/live-poll/route";

describe("live poll cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("fails closed when the kickoff precheck cannot reach the database", async () => {
    mocks.getCachedKickoffWindows.mockRejectedValueOnce(new Error("pool unavailable"));
    const request = new Request("http://localhost/api/cron/live-poll", {
      headers: { authorization: "Bearer test-secret" }
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ skipped: true, reason: "database-unavailable" });
    expect(mocks.runApiFootballLivePoll).not.toHaveBeenCalled();
  });

  it("skips API-Football when there is no match in the live window", async () => {
    mocks.getCachedKickoffWindows.mockResolvedValueOnce([]);
    mocks.hasMatchInLiveWindow.mockReturnValueOnce(false);
    const request = new Request("http://localhost/api/cron/live-poll", {
      headers: { authorization: "Bearer test-secret" }
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mocks.runApiFootballLivePoll).not.toHaveBeenCalled();
  });
});
