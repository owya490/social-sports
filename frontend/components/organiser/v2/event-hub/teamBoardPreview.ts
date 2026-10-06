import { OrderId, TicketId } from "@/interfaces/EventTypes";
import { EMPTY_ORDER_DEFAULTS, Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { addTeam, assignPerson, type TeamBoard } from "./teamBoard";

const SAMPLE = [
  ["maya", "Maya Chen", 1],
  ["jordan", "Jordan Blake", 2],
  ["priya", "Priya Shah", 1],
  ["sam", "Sam Okonkwo", 1],
  ["alex", "Alex Nguyen", 3],
  ["riley", "Riley Hart", 1],
  ["casey", "Casey Walsh", 1],
  ["noah", "Noah Bennett", 1],
  ["harper", "Harper Singh", 2],
  ["quinn", "Quinn Adler", 1],
  ["ellis", "Ellis Moore", 1],
  ["taylor", "Taylor Brooks", 1],
] as const;

function sampleOrder(id: string, name: string, ticketCount: number): Order {
  return {
    ...EMPTY_ORDER_DEFAULTS,
    orderId: id as OrderId,
    fullName: name,
    email: `${id}@example.com`,
    phone: "0400000000",
    tickets: Array.from({ length: ticketCount }, (_, index) => `${id}-ticket-${index + 1}` as TicketId),
  };
}

export function createTeamsPreview(): {
  eventName: string;
  orderTicketsMap: Map<Order, Ticket[]>;
  initialBoard: TeamBoard;
} {
  const orders = SAMPLE.map(([id, name, ticketCount]) => sampleOrder(id, name, ticketCount));
  const orderTicketsMap = new Map<Order, Ticket[]>(orders.map((order) => [order, []]));
  let board = addTeam({ teams: [], assignments: {} }, "Team A", 5, "team-a");
  board = addTeam(board, "Team B", 5, "team-b");
  ["maya", "jordan", "priya", "sam"].forEach((id) => {
    board = assignPerson(board, id, "team-a");
  });
  ["alex", "riley", "casey", "noah"].forEach((id) => {
    board = assignPerson(board, id, "team-b");
  });

  return {
    eventName: "Tuesday social",
    orderTicketsMap,
    initialBoard: board,
  };
}
