import { TeamBoard, TicketId } from "@/interfaces/EventTypes";

const EMPTY_STORED_BOARD: TeamBoard = { teams: [], assignments: {} };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function ticketIdsFrom(value: unknown): TicketId[] {
  if (!Array.isArray(value)) return [];
  const ids: TicketId[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || entry.length === 0 || seen.has(entry)) continue;
    seen.add(entry);
    ids.push(entry as TicketId);
  }
  return ids;
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
            ticketIds: ticketIdsFrom(team.ticketIds),
          },
        ];
      })
    : [];

  return { teams, assignments: {} };
}
