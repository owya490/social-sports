import { EventTeam, OrderId, TeamBoard, TeamTicketSplit, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { ulid } from "ulid";

export type { EventTeam, TeamBoard, TeamTicketSplit };

export type TeamPerson = {
  orderId: OrderId;
  fullName: string;
  email: string;
  ticketIds: TicketId[];
};

export const EMPTY_TEAM_BOARD: TeamBoard = { teams: [], assignments: {}, ticketAssignments: null };

export const TEAM_CSV_HEADERS = [
  { label: "Team", key: "team" },
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Tickets", key: "tickets" },
];

export function newTeamId(): string {
  return `tem_${ulid()}`;
}

function ticketIdsFor(order: Order, tickets: Ticket[]): TicketId[] {
  if (tickets.length > 0) {
    return tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED).map((ticket) => ticket.ticketId);
  }
  return order.tickets ?? [];
}

export function peopleFromOrders(orderTicketsMap: Map<Order, Ticket[]>): TeamPerson[] {
  const people: TeamPerson[] = [];
  orderTicketsMap.forEach((tickets, order) => {
    if (order.status !== OrderAndTicketStatus.APPROVED) return;
    people.push({
      orderId: order.orderId,
      fullName: order.fullName?.trim() || "Attendee",
      email: order.email?.trim() || "",
      ticketIds: ticketIdsFor(order, tickets),
    });
  });
  people.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }));
  return people;
}

/** A booking counts as one place per ticket. A person with no ticket ids still counts as one. */
export function seatsFor(person: TeamPerson): number {
  return person.ticketIds.length > 0 ? person.ticketIds.length : 1;
}

export function seatsInSplit(split: TeamTicketSplit | undefined): number {
  if (!split) return 0;
  return Object.values(split).reduce((sum, count) => sum + count, 0);
}

export function splitForPerson(board: TeamBoard, person: TeamPerson): TeamTicketSplit {
  if (board.ticketAssignments == null || person.ticketIds.length === 0) {
    return board.assignments[person.orderId] ?? {};
  }
  const teamIds = new Set(board.teams.map((team) => team.id));
  const split: TeamTicketSplit = {};
  for (const ticketId of person.ticketIds) {
    const teamId = board.ticketAssignments[ticketId];
    if (!teamId || !teamIds.has(teamId)) continue;
    split[teamId] = (split[teamId] ?? 0) + 1;
  }
  return split;
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

function sameAssignments(
  left: Record<string, TeamTicketSplit>,
  right: Record<string, TeamTicketSplit>
): boolean {
  const leftIds = Object.keys(left);
  if (leftIds.length !== Object.keys(right).length) return false;
  return leftIds.every((orderId) => {
    const leftSplit = left[orderId];
    const rightSplit = right[orderId];
    if (!rightSplit) return false;
    const teamIds = Object.keys(leftSplit);
    if (teamIds.length !== Object.keys(rightSplit).length) return false;
    return teamIds.every((teamId) => leftSplit[teamId] === rightSplit[teamId]);
  });
}

function sameTicketAssignments(
  left: Record<string, string> | null | undefined,
  right: Record<string, string> | null | undefined
): boolean {
  if (left == null || right == null) return left == null && right == null;
  const leftIds = Object.keys(left);
  if (leftIds.length !== Object.keys(right).length) return false;
  return leftIds.every((ticketId) => left[ticketId] === right[ticketId]);
}

function teamIdSet(board: TeamBoard): Set<string> {
  return new Set(board.teams.map((team) => team.id));
}

/** Order counts that match the ticket map, plus count-only bookings that have no ticket ids. */
function assignmentsFromTickets(
  board: TeamBoard,
  ticketAssignments: Record<string, string>,
  people: TeamPerson[]
): Record<string, TeamTicketSplit> {
  const teamIds = teamIdSet(board);
  const assignments: Record<string, TeamTicketSplit> = {};
  for (const person of people) {
    if (person.ticketIds.length === 0) {
      const split = normalizeSplit(board.assignments[person.orderId], seatsFor(person), teamIds);
      if (Object.keys(split).length > 0) assignments[person.orderId] = split;
      continue;
    }
    const split: TeamTicketSplit = {};
    for (const ticketId of person.ticketIds) {
      const teamId = ticketAssignments[ticketId];
      if (!teamId || !teamIds.has(teamId)) continue;
      split[teamId] = (split[teamId] ?? 0) + 1;
    }
    if (Object.keys(split).length > 0) assignments[person.orderId] = split;
  }
  return assignments;
}

/**
 * Copy a count-only board onto ticket ids in ticket order.
 * Boards that already name tickets are left alone, so loading one does not rewrite it.
 */
function withTicketAssignments(board: TeamBoard, people: TeamPerson[]): TeamBoard {
  if (board.ticketAssignments != null) return board;
  const teamIds = teamIdSet(board);
  const ticketAssignments: Record<string, string> = {};
  for (const person of people) {
    if (person.ticketIds.length === 0) continue;
    const split = normalizeSplit(board.assignments[person.orderId], seatsFor(person), teamIds);
    let index = 0;
    for (const [teamId, count] of Object.entries(split)) {
      for (let i = 0; i < count && index < person.ticketIds.length; i += 1) {
        ticketAssignments[person.ticketIds[index]] = teamId;
        index += 1;
      }
    }
  }
  return {
    ...board,
    ticketAssignments,
    assignments: assignmentsFromTickets(board, ticketAssignments, people),
  };
}

/**
 * Stored seats still match approved orders.
 * A refund from 5 tickets to 4 fails this check until that extra seat is dropped.
 */
export function boardMatchesOrders(board: TeamBoard, people: TeamPerson[]): boolean {
  const visible = visibleBoard(board, people);
  return (
    sameAssignments(board.assignments, visible.assignments) &&
    sameTicketAssignments(board.ticketAssignments, visible.ticketAssignments)
  );
}

/** Drop orders that are no longer approved, seats on deleted teams, and seats past the current ticket count. */
export function visibleBoard(board: TeamBoard, people: TeamPerson[]): TeamBoard {
  const peopleById = new Map(people.map((person) => [person.orderId, person]));
  const teamIds = teamIdSet(board);
  if (board.ticketAssignments == null) {
    const assignments: Record<string, TeamTicketSplit> = {};
    for (const [orderId, raw] of Object.entries(board.assignments as Record<string, unknown>)) {
      const person = peopleById.get(orderId as OrderId);
      if (!person) continue;
      const split = normalizeSplit(raw, seatsFor(person), teamIds);
      if (Object.keys(split).length > 0) assignments[orderId] = split;
    }
    return { teams: board.teams, assignments, ticketAssignments: null };
  }

  const knownTickets = new Set<string>(people.flatMap((person) => person.ticketIds));
  const ticketAssignments: Record<string, string> = {};
  for (const [ticketId, teamId] of Object.entries(board.ticketAssignments)) {
    if (!knownTickets.has(ticketId) || !teamIds.has(teamId)) continue;
    ticketAssignments[ticketId] = teamId;
  }
  return {
    teams: board.teams,
    ticketAssignments,
    assignments: assignmentsFromTickets(board, ticketAssignments, people),
  };
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
  if (board.ticketAssignments == null) {
    return { ...board, teams: board.teams.filter((team) => team.id !== teamId), assignments };
  }
  const ticketAssignments: Record<string, string> = {};
  for (const [ticketId, assignedTeam] of Object.entries(board.ticketAssignments)) {
    if (assignedTeam !== teamId) ticketAssignments[ticketId] = assignedTeam;
  }
  return {
    ...board,
    teams: board.teams.filter((team) => team.id !== teamId),
    assignments,
    ticketAssignments,
  };
}

function ticketsInPool(board: TeamBoard, person: TeamPerson, fromTeamId: string | null): string[] {
  const assigned = board.ticketAssignments ?? {};
  return person.ticketIds.filter((ticketId) => {
    const teamId = assigned[ticketId] ?? null;
    return fromTeamId == null ? teamId == null : teamId === fromTeamId;
  });
}

function applyCountMove(
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

/** Put every ticket from one booking on a single team. */
export function placeAllSeats(board: TeamBoard, person: TeamPerson, teamId: string, people: TeamPerson[]): TeamBoard {
  if (seatsFor(person) <= 0) return board;
  if (person.ticketIds.length === 0) {
    return {
      ...board,
      assignments: { ...board.assignments, [person.orderId]: { [teamId]: seatsFor(person) } },
    };
  }
  const next = withTicketAssignments(board, people);
  const ticketAssignments = { ...(next.ticketAssignments ?? {}) };
  for (const ticketId of person.ticketIds) ticketAssignments[ticketId] = teamId;
  return {
    ...next,
    ticketAssignments,
    assignments: assignmentsFromTickets(next, ticketAssignments, people),
  };
}

/** Move tickets from one team, or from the unassigned pool, onto another team or back to unassigned. */
export function placeSeats(
  board: TeamBoard,
  person: TeamPerson,
  fromTeamId: string | null,
  toTeamId: string | null,
  count: number,
  people: TeamPerson[]
): TeamBoard {
  if (fromTeamId === toTeamId || count <= 0) return board;
  if (person.ticketIds.length === 0) {
    return applyCountMove(board, person.orderId, fromTeamId, toTeamId, count, seatsFor(person));
  }

  const next = withTicketAssignments(board, people);
  const moving = ticketsInPool(next, person, fromTeamId).slice(0, Math.floor(count));
  if (moving.length === 0) return board;

  const ticketAssignments = { ...(next.ticketAssignments ?? {}) };
  for (const ticketId of moving) {
    if (toTeamId) ticketAssignments[ticketId] = toTeamId;
    else delete ticketAssignments[ticketId];
  }
  return {
    ...next,
    ticketAssignments,
    assignments: assignmentsFromTickets(next, ticketAssignments, people),
  };
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
  let next: TeamBoard = options.reshuffle
    ? { ...board, assignments: {}, ticketAssignments: board.ticketAssignments == null ? null : {} }
    : board;
  const pool = shuffle(
    people.flatMap((person) => {
      const open = options.reshuffle ? seatsFor(person) : unassignedSeats(person, splitForPerson(next, person));
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
    if (!person) continue;
    next = placeSeats(next, person, null, choice.id, 1, people);
  }

  return next;
}

export function buildTeamCsvRows(board: TeamBoard, people: TeamPerson[]) {
  const teamName = new Map(board.teams.map((team) => [team.id, team.name]));
  const rows = people.flatMap((person) => {
    const split = splitForPerson(board, person);
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
