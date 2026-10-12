import { OrderId, TeamBoard, TicketId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { ulid } from "ulid";

export type { TeamBoard };

export type TeamTicket = {
  ticketId: TicketId;
  orderId: OrderId;
  fullName: string;
  email: string;
  label: string;
};

export const EMPTY_TEAM_BOARD: TeamBoard = { teams: [], assignments: {} };

export const TEAM_CSV_HEADERS = [
  { label: "Team", key: "team" },
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
];

export function newTeamId(): string {
  return `tem_${ulid()}`;
}

function approvedTicketIds(order: Order, tickets: Ticket[]): TicketId[] {
  const approved = tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED);
  if (tickets.length === 0) return [...(order.tickets ?? [])];

  const approvedIds = new Set(approved.map((ticket) => ticket.ticketId));
  const listed = (order.tickets ?? []).filter((ticketId) => approvedIds.has(ticketId));
  const listedIds = new Set(listed);
  const extras = approved.map((ticket) => ticket.ticketId).filter((ticketId) => !listedIds.has(ticketId));
  return [...listed, ...extras];
}

/** First ticket keeps the purchaser name. Later tickets are "Name +1", "Name +2", and so on. */
export function ticketsFromOrders(orderTicketsMap: Map<Order, Ticket[]>): TeamTicket[] {
  const groups: { orderId: OrderId; fullName: string; email: string; ticketIds: TicketId[] }[] = [];
  orderTicketsMap.forEach((tickets, order) => {
    if (order.status !== OrderAndTicketStatus.APPROVED) return;
    const ticketIds = approvedTicketIds(order, tickets);
    if (ticketIds.length === 0) return;
    groups.push({
      orderId: order.orderId,
      fullName: order.fullName?.trim() || "Attendee",
      email: order.email?.trim() || "",
      ticketIds,
    });
  });

  groups.sort(
    (a, b) =>
      a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }) || a.orderId.localeCompare(b.orderId)
  );

  return groups.flatMap((group) =>
    group.ticketIds.map((ticketId, index) => ({
      ticketId,
      orderId: group.orderId,
      fullName: group.fullName,
      email: group.email,
      label: index === 0 ? group.fullName : `${group.fullName} +${index}`,
    }))
  );
}

function sameTicketIds(left: TicketId[], right: TicketId[]): boolean {
  return left.length === right.length && left.every((ticketId, index) => ticketId === right[index]);
}

/** Stored ticket ids still match the approved tickets. A removed ticket fails this until it is dropped. */
export function boardMatchesTickets(board: TeamBoard, tickets: TeamTicket[]): boolean {
  const visible = visibleBoard(board, tickets);
  return board.teams.every((team, index) => sameTicketIds(team.ticketIds, visible.teams[index]?.ticketIds ?? []));
}

/** Drop ticket ids that are no longer approved. A ticket stored on two teams stays on the first. */
export function visibleBoard(board: TeamBoard, tickets: TeamTicket[]): TeamBoard {
  const live = new Set(tickets.map((ticket) => ticket.ticketId));
  const seen = new Set<TicketId>();
  return {
    assignments: {},
    teams: board.teams.map((team) => ({
      ...team,
      ticketIds: team.ticketIds.filter((ticketId) => {
        if (!live.has(ticketId) || seen.has(ticketId)) return false;
        seen.add(ticketId);
        return true;
      }),
    })),
  };
}

export function addTeam(board: TeamBoard, name: string, targetSize: number | null, id: string): TeamBoard {
  const trimmed = name.trim();
  return {
    assignments: {},
    teams: [
      ...board.teams,
      {
        id,
        name: trimmed || `Team ${board.teams.length + 1}`,
        targetSize: targetSize && targetSize > 0 ? targetSize : null,
        ticketIds: [],
      },
    ],
  };
}

export function renameTeam(board: TeamBoard, teamId: string, name: string): TeamBoard {
  return {
    assignments: {},
    teams: board.teams.map((team) => (team.id === teamId ? { ...team, name } : team)),
  };
}

export function setTeamTargetSize(board: TeamBoard, teamId: string, targetSize: number | null): TeamBoard {
  const next = targetSize && targetSize > 0 ? targetSize : null;
  return {
    assignments: {},
    teams: board.teams.map((team) => (team.id === teamId ? { ...team, targetSize: next } : team)),
  };
}

export function removeTeam(board: TeamBoard, teamId: string): TeamBoard {
  return {
    assignments: {},
    teams: board.teams.filter((team) => team.id !== teamId),
  };
}

/** Put one ticket on a team, or back in the unassigned list. It cannot sit on two teams. */
export function placeTicket(board: TeamBoard, ticketId: TicketId, toTeamId: string | null): TeamBoard {
  return {
    assignments: {},
    teams: board.teams.map((team) => {
      const without = team.ticketIds.filter((id) => id !== ticketId);
      return { ...team, ticketIds: team.id === toTeamId ? [...without, ticketId] : without };
    }),
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

/**
 * Place unassigned tickets on the teams with the fewest tickets.
 * A target size caps this fill. Manual moves can still go past it.
 */
export function autoFillTeams(
  board: TeamBoard,
  tickets: TeamTicket[],
  options: { reshuffle: boolean; random?: () => number }
): TeamBoard {
  if (board.teams.length === 0 || tickets.length === 0) return board;

  const random = options.random ?? Math.random;
  let next: TeamBoard = options.reshuffle
    ? { assignments: {}, teams: board.teams.map((team) => ({ ...team, ticketIds: [] })) }
    : board;
  const assigned = new Set(next.teams.flatMap((team) => team.ticketIds));
  const pool = shuffle(
    tickets.filter((ticket) => !assigned.has(ticket.ticketId)).map((ticket) => ticket.ticketId),
    random
  );

  for (const ticketId of pool) {
    const open = next.teams
      .filter((team) => team.targetSize == null || team.ticketIds.length < team.targetSize)
      .sort((a, b) => a.ticketIds.length - b.ticketIds.length);
    if (open.length === 0) break;
    const smallest = open[0].ticketIds.length;
    const choice = open.find((team) => team.ticketIds.length === smallest) ?? open[0];
    next = placeTicket(next, ticketId, choice.id);
  }

  return next;
}

export function buildTeamCsvRows(board: TeamBoard, tickets: TeamTicket[]) {
  const teamNameByTicket = new Map<TicketId, string>();
  board.teams.forEach((team) => {
    team.ticketIds.forEach((ticketId) => teamNameByTicket.set(ticketId, team.name));
  });

  return tickets
    .map((ticket) => ({
      team: teamNameByTicket.get(ticket.ticketId) ?? "Unassigned",
      name: ticket.label,
      email: ticket.email,
    }))
    .sort((a, b) => a.team.localeCompare(b.team, undefined, { sensitivity: "base" }));
}
