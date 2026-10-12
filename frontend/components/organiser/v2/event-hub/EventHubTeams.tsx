"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { saveEventTeamBoard, subscribeToEventTeamBoard } from "@/services/src/events/eventTeams/eventTeamsService";
import { ChevronRightIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EventHubPanel } from "./EventHubPanel";
import {
  EventHubEmpty,
  EventHubGhostButton,
  EventHubInitials,
  EventHubPrimaryButton,
  EventHubSavingIndicator,
  EventHubStage,
} from "./EventHubStage";
import type { SettingsAutosaveStatus } from "./useSettingsAutosave";
import {
  EMPTY_TEAM_BOARD,
  TEAM_CSV_HEADERS,
  addTeam,
  autoFillTeams,
  boardMatchesTickets,
  buildTeamCsvRows,
  newTeamId,
  placeTicket,
  removeTeam,
  renameTeam,
  setTeamTargetSize,
  ticketsFromOrders,
  visibleBoard,
  type TeamBoard,
  type TeamTicket,
} from "./teamBoard";

type EventHubTeamsProps = {
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  /** When set, the layout is loaded from and saved to EventTeams/{eventId}. */
  eventId?: EventId;
  initialBoard?: TeamBoard;
  onPersist?: (board: TeamBoard) => Promise<void>;
};

const PERSIST_DELAY_MS = 400;

const fieldClass =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function EventHubTeams({
  orderTicketsMap,
  eventName,
  eventId,
  initialBoard = EMPTY_TEAM_BOARD,
  onPersist,
}: EventHubTeamsProps) {
  const tickets = useMemo(() => ticketsFromOrders(orderTicketsMap), [orderTicketsMap]);
  const [remoteBoard, setRemoteBoard] = useState<TeamBoard | null>(null);
  const [remoteError, setRemoteError] = useState(false);
  const [trackedEventId, setTrackedEventId] = useState(eventId);
  const [board, setBoard] = useState<TeamBoard>(initialBoard);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSize, setDraftSize] = useState("");
  const [armReshuffle, setArmReshuffle] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SettingsAutosaveStatus>("idle");
  const [hasPendingEdit, setHasPendingEdit] = useState(false);
  const [appliedInitialBoard, setAppliedInitialBoard] = useState<TeamBoard | null>(eventId ? null : initialBoard);
  const [syncedTicketKey, setSyncedTicketKey] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState<TeamBoard | null>(null);
  if (eventId !== trackedEventId) {
    setTrackedEventId(eventId);
    setRemoteBoard(null);
    setRemoteError(false);
  }
  const sourceBoard = !eventId ? initialBoard : eventId === trackedEventId ? remoteBoard : null;
  if (sourceBoard && sourceBoard !== appliedInitialBoard) {
    setAppliedInitialBoard(sourceBoard);
    if (!hasPendingEdit) setBoard(sourceBoard);
  }
  const onPersistRef = useRef(onPersist);
  const boardRef = useRef(board);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const persistChainRef = useRef(Promise.resolve());
  const failedBoardRef = useRef<TeamBoard | null>(null);
  const mountedRef = useRef(true);
  const persistedSyncRef = useRef<TeamBoard | null>(null);
  if (sourceBoard && (eventId || onPersist) && !hasPendingEdit && !boardMatchesTickets(sourceBoard, tickets)) {
    const next = visibleBoard(sourceBoard, tickets);
    const key = JSON.stringify(next.teams.map((team) => [team.id, team.ticketIds]));
    if (syncedTicketKey !== key) {
      setSyncedTicketKey(key);
      setPendingSync(next);
      setBoard(next);
      setHasPendingEdit(true);
    }
  } else if (sourceBoard && boardMatchesTickets(sourceBoard, tickets) && (syncedTicketKey !== null || pendingSync !== null)) {
    setSyncedTicketKey(null);
    setPendingSync(null);
  }

  useEffect(() => {
    onPersistRef.current = eventId ? (next) => saveEventTeamBoard(eventId, next) : onPersist;
  }, [eventId, onPersist]);

  useEffect(() => {
    if (!eventId) return;
    return subscribeToEventTeamBoard(
      eventId,
      (next) => {
        setRemoteError(false);
        setRemoteBoard(next);
      },
      () => setRemoteError(true)
    );
  }, [eventId]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const enqueuePersist = useCallback((next: TeamBoard) => {
    const persist = onPersistRef.current;
    if (!persist) return;
    persistChainRef.current = persistChainRef.current
      .catch(() => undefined)
      .then(async () => {
        if (mountedRef.current) setSaveStatus("saving");
        try {
          await persist(next);
          if (!mountedRef.current || boardRef.current !== next) return;
          failedBoardRef.current = null;
          setHasPendingEdit(false);
          setSaveStatus("idle");
        } catch {
          if (!mountedRef.current || boardRef.current !== next) return;
          failedBoardRef.current = next;
          setSaveStatus("error");
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        enqueuePersist(boardRef.current);
      }
    };
  }, [enqueuePersist]);

  const view = useMemo(() => (board ? visibleBoard(board, tickets) : EMPTY_TEAM_BOARD), [board, tickets]);

  useEffect(() => {
    if (!pendingSync || pendingSync !== board || persistedSyncRef.current === pendingSync) return;
    persistedSyncRef.current = pendingSync;
    enqueuePersist(pendingSync);
  }, [board, enqueuePersist, pendingSync]);
  const listedTickets = new Map(tickets.map((ticket, index) => [ticket.ticketId, { ticket, index }]));
  const assignedIds = new Set(view.teams.flatMap((team) => team.ticketIds));
  const unassigned = tickets.filter((ticket) => !assignedIds.has(ticket.ticketId));
  const csvRows = useMemo(() => buildTeamCsvRows(view, tickets), [tickets, view]);
  const filename = `${(eventName || "event").trim().replace(/\s+/g, "-").toLowerCase()}-teams.csv`;

  const queuePersist = (next: TeamBoard) => {
    if (!onPersistRef.current) return;
    dirtyRef.current = true;
    setHasPendingEdit(true);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      dirtyRef.current = false;
      enqueuePersist(next);
    }, PERSIST_DELAY_MS);
  };

  const update = (next: TeamBoard) => {
    boardRef.current = next;
    setBoard(next);
    setArmReshuffle(false);
    setPendingDeleteId(null);
    queuePersist(next);
  };

  const createTeam = (event: FormEvent) => {
    event.preventDefault();
    const size = Number.parseInt(draftSize, 10);
    update(addTeam(view, draftName, Number.isFinite(size) ? size : null, newTeamId()));
    setDraftName("");
    setDraftSize("");
    setCreating(false);
  };

  const persists = Boolean(eventId || onPersist);
  if (eventId && remoteBoard == null) {
    return (
      <EventHubStage>
        <EventHubEmpty>
          {remoteError
            ? "Teams could not be loaded. Reload the page to try again."
            : "Loading teams…"}
        </EventHubEmpty>
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      {persists ? (
        <EventHubSavingIndicator
          status={saveStatus}
          onRetry={() => {
            const failed = failedBoardRef.current;
            if (failed) enqueuePersist(failed);
          }}
        />
      ) : null}
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted font-sans">
          {tickets.length === 0
            ? "Teams are built from approved tickets."
            : `${unassigned.length} unassigned · ${view.teams.length} ${view.teams.length === 1 ? "team" : "teams"}`}
          {persists ? "" : " · Preview only"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadCsvButton
            compact
            data={csvRows}
            headers={TEAM_CSV_HEADERS}
            filename={filename}
            label="CSV"
          />
          <EventHubGhostButton
            disabled={view.teams.length === 0 || tickets.length === 0}
            onClick={() => {
              if (!armReshuffle) {
                setArmReshuffle(true);
                return;
              }
              update(autoFillTeams(view, tickets, { reshuffle: true }));
            }}
          >
            {armReshuffle ? "Reshuffle everyone" : "Reshuffle"}
          </EventHubGhostButton>
          <EventHubGhostButton
            disabled={view.teams.length === 0 || unassigned.length === 0}
            onClick={() => update(autoFillTeams(view, tickets, { reshuffle: false }))}
          >
            Auto-fill
          </EventHubGhostButton>
          <EventHubPrimaryButton
            onClick={() => {
              setCreating(true);
              setDraftName(`Team ${view.teams.length + 1}`);
              setDraftSize("");
            }}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            New team
          </EventHubPrimaryButton>
        </div>
      </div>

      {tickets.length === 0 && view.teams.length === 0 && !creating ? (
        <EventHubEmpty>
          No approved tickets yet. Once a signup is approved on Registrations, each ticket can be placed on a team.
        </EventHubEmpty>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-background" aria-label="Unassigned">
            <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
              <h2 className="text-sm font-semibold text-foreground font-sans">Unassigned</h2>
              <span className="text-xs tabular-nums text-foreground-muted font-sans">{unassigned.length}</span>
            </header>
            {tickets.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                No approved tickets yet.
              </p>
            ) : unassigned.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                Every ticket is on a team.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {unassigned.map((ticket) => (
                  <TicketRow
                    key={ticket.ticketId}
                    ticket={ticket}
                    teams={view.teams}
                    teamId=""
                    onMove={(toTeamId) => update(placeTicket(view, ticket.ticketId, toTeamId))}
                  />
                ))}
              </ul>
            )}
          </section>

          <div className="min-w-0 space-y-4">
            {creating ? (
              <form
                onSubmit={createTeam}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-end"
              >
                <label className="min-w-0 flex-1 text-xs font-medium text-foreground-secondary font-sans">
                  Team name
                  <input
                    autoFocus
                    required
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className={`${fieldClass} mt-1 w-full`}
                  />
                </label>
                <label className="text-xs font-medium text-foreground-secondary font-sans">
                  Target size
                  <input
                    inputMode="numeric"
                    value={draftSize}
                    onChange={(event) => setDraftSize(event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Any"
                    className={`${fieldClass} mt-1 w-full sm:w-24`}
                  />
                </label>
                <div className="flex gap-2">
                  <EventHubPrimaryButton type="submit">Create</EventHubPrimaryButton>
                  <EventHubGhostButton
                    onClick={() => {
                      setCreating(false);
                      setDraftName("");
                      setDraftSize("");
                    }}
                  >
                    Cancel
                  </EventHubGhostButton>
                </div>
              </form>
            ) : null}

            {view.teams.length === 0 && !creating ? (
              <EventHubEmpty>Create a team, then move tickets across from Unassigned or use Auto-fill.</EventHubEmpty>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {view.teams.map((team) => {
                  const members = team.ticketIds
                    .flatMap((ticketId) => {
                      const listed = listedTickets.get(ticketId);
                      return listed ? [listed] : [];
                    })
                    .sort((a, b) => a.index - b.index)
                    .map((listed) => listed.ticket);
                  const filled = members.length;
                  const overTarget = team.targetSize != null && filled > team.targetSize;
                  return (
                    <section key={team.id} className="rounded-xl border border-border bg-background" aria-label={team.name}>
                      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                        <input
                          aria-label={`Name for ${team.name || "team"}`}
                          value={team.name}
                          placeholder="Team name"
                          onChange={(event) => update(renameTeam(view, team.id, event.target.value))}
                          onBlur={() => {
                            if (!team.name.trim()) {
                              update(renameTeam(view, team.id, `Team ${view.teams.indexOf(team) + 1}`));
                            }
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        />
                        <label className="sr-only" htmlFor={`size-${team.id}`}>
                          Target size for {team.name}
                        </label>
                        <input
                          id={`size-${team.id}`}
                          inputMode="numeric"
                          aria-label={`Target size for ${team.name}`}
                          value={team.targetSize ?? ""}
                          placeholder="Size"
                          onChange={(event) => {
                            const digits = event.target.value.replace(/[^\d]/g, "");
                            update(setTeamTargetSize(view, team.id, digits ? Number.parseInt(digits, 10) : null));
                          }}
                          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center text-xs tabular-nums text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        />
                        <span
                          className={`text-xs tabular-nums font-sans ${
                            overTarget ? "font-semibold text-foreground" : "text-foreground-muted"
                          }`}
                        >
                          {filled}
                          {team.targetSize != null ? `/${team.targetSize}` : ""}
                        </span>
                        {pendingDeleteId === team.id ? (
                          <button
                            type="button"
                            onClick={() => update(removeTeam(view, team.id))}
                            className="shrink-0 text-xs font-semibold text-foreground font-sans hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Delete ${team.name}`}
                            onClick={() => setPendingDeleteId(team.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                      </header>
                      {members.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">No tickets yet.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {members.map((ticket) => (
                            <TicketRow
                              key={ticket.ticketId}
                              ticket={ticket}
                              teams={view.teams}
                              teamId={team.id}
                              onMove={(toTeamId) => update(placeTicket(view, ticket.ticketId, toTeamId))}
                            />
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </EventHubStage>
  );
}

function TicketRow({
  ticket,
  teams,
  teamId,
  onMove,
}: {
  ticket: TeamTicket;
  teams: { id: string; name: string }[];
  teamId: string;
  onMove: (toTeamId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const destinations = [
    ...(teamId ? [{ id: "unassigned", name: "Unassigned" }] : []),
    ...teams.filter((team) => team.id !== teamId).map((team) => ({ id: team.id, name: team.name })),
  ];
  const formId = `move-${ticket.ticketId}-${teamId || "unassigned"}`;

  const openMove = () => {
    setDestination("");
    setOpen(true);
  };

  const submitMove = (event: FormEvent) => {
    event.preventDefault();
    if (!destination) return;
    onMove(destination === "unassigned" ? null : destination);
    setOpen(false);
  };

  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <EventHubInitials name={ticket.fullName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground font-sans">{ticket.label}</p>
        <p className="truncate text-xs text-foreground-muted font-sans">{ticket.email || "—"}</p>
      </div>
      {destinations.length > 0 ? (
        <button
          type="button"
          aria-label={`Move ${ticket.label}`}
          onClick={openMove}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      <EventHubPanel
        open={open}
        onClose={() => setOpen(false)}
        title={`Move ${ticket.label}`}
        footer={
          <EventHubPrimaryButton type="submit" form={formId}>
            Move
          </EventHubPrimaryButton>
        }
      >
        <form id={formId} className="space-y-4" onSubmit={submitMove}>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Which team?</span>
            <select
              required
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <option value="">Choose a team</option>
              {destinations.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </form>
      </EventHubPanel>
    </li>
  );
}
