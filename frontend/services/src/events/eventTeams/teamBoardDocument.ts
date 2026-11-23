import { TeamBoard, TeamTicketSplit } from "@/interfaces/EventTypes";

const EMPTY_STORED_BOARD: TeamBoard = { teams: [], assignments: {} };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Read an EventTeams document. A missing or unreadable board is an empty layout. */
export function teamBoardFromStored(data: unknown): TeamBoard {
  if (!isRecord(data)) return EMPTY_STORED_BOARD;

  const teams = Array.isArray(data.teams)
    ? data.teams.flatMap((team) => {
        if (!isRecord(team) || typeof team.id !== "string") return [];
        const targetSize =
          typeof team.targetSize === "number" && Number.isFinite(team.targetSize) && team.targetSize > 0
            ? Math.floor(team.targetSize)
            : null;
        return [
          {
            id: team.id,
            name: typeof team.name === "string" ? team.name : "",
            targetSize,
          },
        ];
      })
    : [];

  const assignments: TeamBoard["assignments"] = {};
  if (isRecord(data.assignments)) {
    for (const [orderId, split] of Object.entries(data.assignments)) {
      if (!isRecord(split)) continue;
      const next: TeamTicketSplit = {};
      for (const [teamId, count] of Object.entries(split)) {
        if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue;
        next[teamId] = Math.floor(count);
      }
      if (Object.keys(next).length > 0) assignments[orderId] = next;
    }
  }

  return { teams, assignments };
}
