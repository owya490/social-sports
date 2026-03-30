"use client";

import Loading from "@/components/loading/Loading";
import { EventData, EventId, OrderId } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { getOrderById } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { displayPrice } from "@/utilities/priceUtils";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import Logo from "../../public/images/BlackLogo.svg";

/** Firestore order document ids are auto-generated (not strictly UUID). */
function isPlausibleOrderId(id: string): boolean {
  const t = id.trim();
  return t.length >= 10 && t.length <= 128 && /^[A-Za-z0-9_-]+$/.test(t);
}

function formatFirestoreTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return "—";
  try {
    return ts.toDate().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function StatusChip({ status }: { status: OrderAndTicketStatus }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border";
  if (status === OrderAndTicketStatus.APPROVED) {
    return <span className={`${base} border-gray-300 bg-gray-50 text-gray-800`}>Approved</span>;
  }
  if (status === OrderAndTicketStatus.PENDING) {
    return <span className={`${base} border-gray-400 bg-gray-100 text-gray-800`}>Pending</span>;
  }
  return <span className={`${base} border-gray-500 bg-gray-200 text-gray-900`}>Rejected</span>;
}

export default function PurchaserOrderPage() {
  const params = useParams();
  const orderIdParam = params?.orderId as OrderId | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setOrder(null);
      setTickets([]);
      setEvent(null);

      if (!orderIdParam || !isPlausibleOrderId(orderIdParam)) {
        setError("This order link is not valid. Open the link from your confirmation email.");
        setLoading(false);
        return;
      }

      try {
        const orderDoc = await getOrderById(orderIdParam);
        if (cancelled) return;

        if (!orderDoc.tickets?.length) {
          setOrder(orderDoc);
          setTickets([]);
          setEvent(null);
          setError("This order has no tickets associated with it.");
          setLoading(false);
          return;
        }

        const ticketDocs = await getTicketsByIds(orderDoc.tickets);
        if (cancelled) return;

        const eventIds = new Set(ticketDocs.map((t) => t.eventId));
        if (eventIds.size !== 1) {
          setError("We could not load this order. Please contact the organiser.");
          setLoading(false);
          return;
        }

        const eventId = ticketDocs[0].eventId as EventId;
        const eventData = await getEventById(eventId);
        if (cancelled) return;

        setOrder(orderDoc);
        setTickets(ticketDocs);
        setEvent(eventData);
      } catch {
        if (cancelled) return;
        setError("We could not find this order. Check the link in your confirmation email.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderIdParam]);

  const orderTotalCents = useMemo(() => tickets.reduce((sum, t) => sum + (t.price ?? 0), 0), [tickets]);

  if (loading) {
    return <Loading />;
  }

  if (error && !order) {
    return (
      <div className="min-h-[calc(100vh-var(--footer-height)-4rem)] w-full bg-core-hover/30 px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 flex justify-center">
            <Link href="/" className="inline-block" aria-label="SPORTSHUB home">
              <Image src={Logo} alt="SPORTSHUB" width={140} height={40} className="h-9 w-auto" priority />
            </Link>
          </div>
          <div className="rounded-lg border border-core-outline bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-lg font-medium text-core-text">Something went wrong</p>
            <p className="mt-3 text-sm font-light text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  if (!event) {
    return (
      <div className="min-h-[calc(100vh-var(--footer-height)-4rem)] w-full bg-core-hover/30 px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="flex justify-center">
            <Link href="/" className="inline-block" aria-label="SPORTSHUB home">
              <Image src={Logo} alt="SPORTSHUB" width={160} height={46} className="h-10 w-auto" priority />
            </Link>
          </div>
          <section className="rounded-xl border border-core-outline bg-white px-6 py-8 shadow-sm sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Order</p>
            <h1 className="mt-1 text-2xl font-semibold text-core-text">Your booking</h1>
            <p className="mt-2 text-sm font-light text-gray-600">{error}</p>
            <dl className="mt-6 space-y-3 text-sm font-light text-gray-800">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <dt className="text-xs text-gray-500">Order ID</dt>
                <dd className="min-w-0 flex-1 break-all font-mono text-xs text-gray-700">{order.orderId}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Name</dt>
                <dd className="min-w-0 flex-1">{order.fullName || "—"}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="min-w-0 flex-1 break-all">{order.email || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    );
  }

  const eventHref = `/event/${event.eventId}`;
  const orderTypeLabel =
    order.type === OrderAndTicketType.MANUAL
      ? "Manual"
      : order.type === OrderAndTicketType.GENERAL
        ? "General"
        : String(order.type);

  return (
    <div className="min-h-[calc(100vh-var(--footer-height)-4rem)] w-full bg-core-hover/30 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/" className="inline-block" aria-label="SPORTSHUB home">
            <Image src={Logo} alt="SPORTSHUB" width={160} height={46} className="h-10 w-auto" priority />
          </Link>
        </div>

        <section className="overflow-hidden rounded-xl border border-core-outline bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Order</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-core-text sm:text-3xl">Your booking</h1>
            <p className="mt-2 text-sm font-light text-gray-600">
              Purchased {formatFirestoreTimestamp(order.datePurchased)}
            </p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-core-outline pt-5">
              <span className="text-xs font-medium text-gray-500">Order ID</span>
              <span className="min-w-0 flex-1 break-all font-mono text-sm text-core-text">{order.orderId}</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusChip status={order.status} />
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                {orderTypeLabel}
              </span>
            </div>
            <dl className="mt-6 space-y-3 border-t border-core-outline pt-6 text-sm font-light text-gray-800">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Name</dt>
                <dd className="min-w-0 flex-1">{order.fullName || "—"}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="min-w-0 flex-1 break-all">{order.email || "—"}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd className="min-w-0 flex-1">{order.phone || "—"}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-xs text-gray-500">Tickets</dt>
                <dd className="min-w-0 flex-1">{order.tickets.length}</dd>
              </div>
            </dl>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-core-outline bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Tickets</p>
          <ul className="mt-4 divide-y divide-core-outline">
            {tickets.map((ticket) => (
              <li key={ticket.ticketId} className="flex flex-col gap-3 py-5 first:pt-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-xs font-medium text-gray-500">ID</span>
                  <span className="min-w-0 flex-1 break-all font-mono text-sm text-core-text">{ticket.ticketId}</span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">{formatFirestoreTimestamp(ticket.purchaseDate)}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusChip status={ticket.status} />
                    <span className="text-sm font-medium text-core-text">${displayPrice(ticket.price).toFixed(2)}</span>
                  </div>
                </div>
                {ticket.formResponseId && event.formId ? (
                  <div className="pt-1">
                    <Link
                      href={`/forms/${event.formId}/${event.eventId}/${ticket.formResponseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-core-text underline underline-offset-4 decoration-gray-400 hover:decoration-core-text"
                    >
                      View Form Responses
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {tickets.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-core-outline pt-4 text-sm font-semibold text-core-text">
              <span>Order total</span>
              <span>${displayPrice(orderTotalCents).toFixed(2)}</span>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-core-outline bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Event</p>
          <h2 className="mt-2 text-xl font-semibold text-core-text sm:text-2xl">{event.name}</h2>
          <p className="mt-3 text-sm font-light text-gray-600">
            {formatFirestoreTimestamp(event.startDate)} – {formatFirestoreTimestamp(event.endDate)}
          </p>
          <p className="mt-2 text-sm font-light text-gray-600">{event.location}</p>
          <div className="mt-6">
            <Link
              href={eventHref}
              className="inline-flex items-center justify-center rounded-md border border-core-text bg-core-text px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-900"
            >
              View event page
            </Link>
          </div>
        </section>

        <p className="pb-4 text-center text-xs font-light text-gray-500">
          Keep this page private — anyone with the link can see these details.
        </p>
      </div>
    </div>
  );
}
