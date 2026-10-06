import { EventTeam, OrderId, TeamBoard } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";

export type { EventTeam, TeamBoard };

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

/** Drop assignments for orders that are no longer approved, and for deleted teams. */
export function visibleBoard(board: TeamBoard, people: TeamPerson[]): TeamBoard {
  const validOrders = new Set(people.map((person) => person.orderId));
  const teamIds = new Set(board.teams.map((team) => team.id));
  const assignments: Record<string, string> = {};
  for (const [orderId, teamId] of Object.entries(board.assignments)) {
    if (validOrders.has(orderId as OrderId) && teamIds.has(teamId)) {
      assignments[orderId] = teamId;
    }
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
  const assignments: Record<string, string> = {};
  for (const [orderId, assigned] of Object.entries(board.assignments)) {
    if (assigned !== teamId) assignments[orderId] = assigned;
  }
  return {
    teams: board.teams.filter((team) => team.id !== teamId),
    assignments,
  };
}

export function assignPerson(board: TeamBoard, orderId: string, teamId: string | null): TeamBoard {
  const assignments = { ...board.assignments };
  if (!teamId) {
    delete assignments[orderId];
  } else {
    assignments[orderId] = teamId;
  }
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
 * Deal people round-robin onto the teams with the fewest members.
 * A target size is a cap for this fill. Manual moves can still go past it.
 */
export function autoFillTeams(
  board: TeamBoard,
  people: TeamPerson[],
  options: { reshuffle: boolean; random?: () => number }
): TeamBoard {
  if (board.teams.length === 0 || people.length === 0) return board;

  const random = options.random ?? Math.random;
  const assignments = options.reshuffle ? {} : { ...board.assignments };
  const counts = new Map(board.teams.map((team) => [team.id, 0]));

  if (!options.reshuffle) {
    for (const teamId of Object.values(assignments)) {
      if (counts.has(teamId)) counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
    }
  }

  const pool = people
    .map((person) => person.orderId)
    .filter((orderId) => options.reshuffle || !assignments[orderId]);

  for (const orderId of shuffle(pool, random)) {
    const open = board.teams.filter((team) => teamHasRoom(team, counts.get(team.id) ?? 0));
    if (open.length === 0) break;
    open.sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0));
    const smallest = counts.get(open[0].id) ?? 0;
    const choice = open.find((team) => (counts.get(team.id) ?? 0) === smallest) ?? open[0];
    assignments[orderId] = choice.id;
    counts.set(choice.id, smallest + 1);
  }

  return { ...board, assignments };
}

export function buildTeamCsvRows(board: TeamBoard, people: TeamPerson[]) {
  const teamName = new Map(board.teams.map((team) => [team.id, team.name]));
  return [...people]
    .sort((a, b) => {
      const teamA = teamName.get(board.assignments[a.orderId] ?? "") ?? "Unassigned";
      const teamB = teamName.get(board.assignments[b.orderId] ?? "") ?? "Unassigned";
      const byTeam = teamA.localeCompare(teamB, undefined, { sensitivity: "base" });
      if (byTeam !== 0) return byTeam;
      return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" });
    })
    .map((person) => ({
      team: teamName.get(board.assignments[person.orderId] ?? "") ?? "Unassigned",
      name: person.fullName,
      email: person.email,
      tickets: person.ticketCount,
    }));
}
