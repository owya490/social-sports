import { EventTeam, OrderId, TeamBoard, TeamTicketSplit } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export type { EventTeam, TeamBoard, TeamTicketSplit };

export type TeamPerson = {
  orderId: OrderId;
  fullName: string;
  email: string;
  ticketCount: number;
};

export const EMPTY_TEAM_BOARD: TeamBoard = { teams: [], assignments: {} };

export const TEAM_CSV_HEADERS = [
  { label: "Team", key: "team" },
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Tickets", key: "tickets" },
];

export function newTeamId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `team_${Math.random().toString(36).slice(2, 10)}`;
}

export function peopleFromOrders(orderTicketsMap: Map<Order, Ticket[]>): TeamPerson[] {
  const people: TeamPerson[] = [];
  orderTicketsMap.forEach((tickets, order) => {
    if (order.status !== OrderAndTicketStatus.APPROVED) return;
    const approvedTickets = tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED);
    people.push({
      orderId: order.orderId,
      fullName: order.fullName?.trim() || "Attendee",
      email: order.email?.trim() || "",
      ticketCount: tickets.length > 0 ? approvedTickets.length : order.tickets?.length ?? 0,
    });
  });
  people.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }));
  return people;
}

/** A booking counts as one place per ticket. A person with no ticket detail still counts as one. */
export function seatsFor(person: TeamPerson): number {
  return person.ticketCount > 0 ? person.ticketCount : 1;
}

export function seatsInSplit(split: TeamTicketSplit | undefined): number {
  if (!split) return 0;
  return Object.values(split).reduce((sum, count) => sum + count, 0);
}

export function unassignedSeats(person: TeamPerson, split: TeamTicketSplit | undefined): number {
  return Math.max(0, seatsFor(person) - seatsInSplit(split));
}

export function seatsOnTeam(board: TeamBoard, teamId: string): number {
  return Object.values(board.assignments).reduce((sum, split) => sum + (split[teamId] ?? 0), 0);
}

/**
 * Older boards stored one team id per order. That meant every ticket on that team.
 * Counts are clamped so a split cannot exceed the booking.
 */
function normalizeSplit(raw: unknown, seatTotal: number, teamIds: Set<string>): TeamTicketSplit {
  if (seatTotal <= 0) return {};
  if (typeof raw === "string") {
    return teamIds.has(raw) ? { [raw]: seatTotal } : {};
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const split: TeamTicketSplit = {};
  let used = 0;
  for (const [teamId, count] of Object.entries(raw as Record<string, unknown>)) {
    if (!teamIds.has(teamId) || typeof count !== "number" || !Number.isFinite(count)) continue;
    const take = Math.min(Math.floor(count), seatTotal - used);
    if (take <= 0) continue;
    split[teamId] = take;
    used += take;
  }
  return split;
}

/** Drop assignments for orders that are no longer approved, and for deleted teams. */
export function visibleBoard(board: TeamBoard, people: TeamPerson[]): TeamBoard {
  const peopleById = new Map(people.map((person) => [person.orderId, person]));
  const teamIds = new Set(board.teams.map((team) => team.id));
  const assignments: Record<string, TeamTicketSplit> = {};
  for (const [orderId, raw] of Object.entries(board.assignments as Record<string, unknown>)) {
    const person = peopleById.get(orderId as OrderId);
    if (!person) continue;
    const split = normalizeSplit(raw, seatsFor(person), teamIds);
    if (Object.keys(split).length > 0) assignments[orderId] = split;
  }
  return { teams: board.teams, assignments };
}

export function addTeam(board: TeamBoard, name: string, targetSize: number | null, id: string): TeamBoard {
  const trimmed = name.trim();
  return {
    ...board,
    teams: [
      ...board.teams,
      {
        id,
        name: trimmed || `Team ${board.teams.length + 1}`,
        targetSize: targetSize && targetSize > 0 ? targetSize : null,
      },
    ],
  };
}

export function renameTeam(board: TeamBoard, teamId: string, name: string): TeamBoard {
  return {
    ...board,
    teams: board.teams.map((team) => (team.id === teamId ? { ...team, name } : team)),
  };
}

export function setTeamTargetSize(board: TeamBoard, teamId: string, targetSize: number | null): TeamBoard {
  const next = targetSize && targetSize > 0 ? targetSize : null;
  return {
    ...board,
    teams: board.teams.map((team) => (team.id === teamId ? { ...team, targetSize: next } : team)),
  };
}

export function removeTeam(board: TeamBoard, teamId: string): TeamBoard {
  const assignments: Record<string, TeamTicketSplit> = {};
  for (const [orderId, split] of Object.entries(board.assignments)) {
    const next = { ...split };
    delete next[teamId];
    if (Object.keys(next).length > 0) assignments[orderId] = next;
  }
  return {
    teams: board.teams.filter((team) => team.id !== teamId),
    assignments,
  };
}

/** Put every ticket from one booking on a single team. */
export function placeAllSeats(board: TeamBoard, orderId: string, teamId: string, seatTotal: number): TeamBoard {
  if (seatTotal <= 0) return board;
  return {
    ...board,
    assignments: { ...board.assignments, [orderId]: { [teamId]: seatTotal } },
  };
}

/** Move tickets from one team, or from the unassigned pool, onto another team or back to unassigned. */
export function placeSeats(
  board: TeamBoard,
  orderId: string,
  fromTeamId: string | null,
  toTeamId: string | null,
  count: number,
  seatTotal: number
): TeamBoard {
  if (fromTeamId === toTeamId || count <= 0 || seatTotal <= 0) return board;

  const split = { ...(board.assignments[orderId] ?? {}) };
  const assigned = seatsInSplit(split);
  const available = fromTeamId == null ? Math.max(0, seatTotal - assigned) : (split[fromTeamId] ?? 0);
  const take = Math.min(Math.floor(count), available);
  if (take <= 0) return board;

  if (fromTeamId) {
    const left = (split[fromTeamId] ?? 0) - take;
    if (left <= 0) delete split[fromTeamId];
    else split[fromTeamId] = left;
  }
  if (toTeamId) {
    split[toTeamId] = (split[toTeamId] ?? 0) + take;
  }

  const assignments = { ...board.assignments };
  if (Object.keys(split).length === 0) delete assignments[orderId];
  else assignments[orderId] = split;
  return { ...board, assignments };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

function teamHasRoom(team: EventTeam, count: number): boolean {
  return team.targetSize == null || count < team.targetSize;
}

/**
 * Deal tickets onto the teams with the fewest places taken.
 * One booking can land on more than one team. A target size caps this fill.
 * Manual moves can still go past it.
 */
export function autoFillTeams(
  board: TeamBoard,
  people: TeamPerson[],
  options: { reshuffle: boolean; random?: () => number }
): TeamBoard {
  if (board.teams.length === 0 || people.length === 0) return board;

  const random = options.random ?? Math.random;
  let next = options.reshuffle ? { ...board, assignments: {} } : board;
  const pool = shuffle(
    people.flatMap((person) => {
      const open = options.reshuffle
        ? seatsFor(person)
        : unassignedSeats(person, next.assignments[person.orderId]);
      return Array.from({ length: open }, () => person.orderId);
    }),
    random
  );

  for (const orderId of pool) {
    const counts = new Map(next.teams.map((team) => [team.id, seatsOnTeam(next, team.id)]));
    const open = next.teams.filter((team) => teamHasRoom(team, counts.get(team.id) ?? 0));
    if (open.length === 0) break;
    open.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0));
    const smallest = counts.get(open[0].id) ?? 0;
    const choice = open.find((team) => (counts.get(team.id) ?? 0) === smallest) ?? open[0];
    const person = people.find((entry) => entry.orderId === orderId);
    next = placeSeats(next, orderId, null, choice.id, 1, person ? seatsFor(person) : 1);
  }

  return next;
}

export function buildTeamCsvRows(board: TeamBoard, people: TeamPerson[]) {
  const teamName = new Map(board.teams.map((team) => [team.id, team.name]));
  const rows = people.flatMap((person) => {
    const split = board.assignments[person.orderId] ?? {};
    const placed = Object.entries(split).map(([teamId, tickets]) => ({
      team: teamName.get(teamId) ?? "Unassigned",
      name: person.fullName,
      email: person.email,
      tickets,
    }));
    const leftover = unassignedSeats(person, split);
    if (leftover > 0) {
      placed.push({
        team: "Unassigned",
        name: person.fullName,
        email: person.email,
        tickets: leftover,
      });
    }
    return placed;
  });

  return rows.sort((a, b) => {
    const byTeam = a.team.localeCompare(b.team, undefined, { sensitivity: "base" });
    if (byTeam !== 0) return byTeam;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
