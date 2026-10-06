"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  buildTeamCsvRows,
  newTeamId,
  peopleFromOrders,
  placeSeats,
  removeTeam,
  renameTeam,
  seatsFor,
  seatsOnTeam,
  setTeamTargetSize,
  unassignedSeats,
  visibleBoard,
  type TeamBoard,
  type TeamPerson,
} from "./teamBoard";

type EventHubTeamsProps = {
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  initialBoard?: TeamBoard;
  onPersist?: (board: TeamBoard) => Promise<void>;
};

const PERSIST_DELAY_MS = 400;

const fieldClass =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function EventHubTeams({
  orderTicketsMap,
  eventName,
  initialBoard = EMPTY_TEAM_BOARD,
  onPersist,
}: EventHubTeamsProps) {
  const people = useMemo(() => peopleFromOrders(orderTicketsMap), [orderTicketsMap]);
  const [board, setBoard] = useState<TeamBoard>(initialBoard);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSize, setDraftSize] = useState("");
  const [armReshuffle, setArmReshuffle] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SettingsAutosaveStatus>("idle");
  const [hasPendingEdit, setHasPendingEdit] = useState(false);
  const [appliedInitialBoard, setAppliedInitialBoard] = useState(initialBoard);
  if (initialBoard !== appliedInitialBoard) {
    setAppliedInitialBoard(initialBoard);
    if (!hasPendingEdit) setBoard(initialBoard);
  }
  const onPersistRef = useRef(onPersist);
  const boardRef = useRef(board);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const persistChainRef = useRef(Promise.resolve());
  const failedBoardRef = useRef<TeamBoard | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    onPersistRef.current = onPersist;
  }, [onPersist]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const enqueuePersist = useCallback((next: TeamBoard) => {
    const persist = onPersistRef.current;
    if (!persist) return;
    if (mountedRef.current) setSaveStatus("saving");
    persistChainRef.current = persistChainRef.current
      .catch(() => undefined)
      .then(async () => {
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

  const view = useMemo(() => (board ? visibleBoard(board, people) : EMPTY_TEAM_BOARD), [board, people]);
  const unassigned = people.flatMap((person) => {
    const count = unassignedSeats(person, view.assignments[person.orderId]);
    return count > 0 ? [{ person, count }] : [];
  });
  const unassignedSeatTotal = unassigned.reduce((sum, entry) => sum + entry.count, 0);
  const csvRows = useMemo(() => buildTeamCsvRows(view, people), [people, view]);
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

  return (
    <EventHubStage>
      {onPersist ? (
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
          {people.length === 0
            ? "Teams are built from approved signups."
            : `${unassignedSeatTotal} unassigned · ${view.teams.length} ${view.teams.length === 1 ? "team" : "teams"}`}
          {onPersist ? "" : " · Preview only"}
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
            disabled={view.teams.length === 0 || people.length === 0}
            onClick={() => {
              if (!armReshuffle) {
                setArmReshuffle(true);
                return;
              }
              update(autoFillTeams(view, people, { reshuffle: true }));
            }}
          >
            {armReshuffle ? "Reshuffle everyone" : "Reshuffle"}
          </EventHubGhostButton>
          <EventHubGhostButton
            disabled={view.teams.length === 0 || unassignedSeatTotal === 0}
            onClick={() => update(autoFillTeams(view, people, { reshuffle: false }))}
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

      {people.length === 0 && view.teams.length === 0 && !creating ? (
        <EventHubEmpty>
          No approved attendees yet. Once someone is approved on Registrations, they can be placed on a team.
        </EventHubEmpty>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-background" aria-label="Unassigned">
            <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
              <h2 className="text-sm font-semibold text-foreground font-sans">Unassigned</h2>
              <span className="text-xs tabular-nums text-foreground-muted font-sans">{unassignedSeatTotal}</span>
            </header>
            {people.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                No approved attendees yet.
              </p>
            ) : unassignedSeatTotal === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                Every ticket is on a team.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {unassigned.map(({ person, count }) => (
                  <PersonRow
                    key={person.orderId}
                    person={person}
                    teams={view.teams}
                    teamId=""
                    count={count}
                    onMove={(amount, toTeamId) =>
                      update(placeSeats(view, person.orderId, null, toTeamId, amount, seatsFor(person)))
                    }
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
              <EventHubEmpty>Create a team, then move people across from Unassigned or use Auto-fill.</EventHubEmpty>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {view.teams.map((team) => {
                  const members = people.flatMap((person) => {
                    const count = view.assignments[person.orderId]?.[team.id] ?? 0;
                    return count > 0 ? [{ person, count }] : [];
                  });
                  const filled = seatsOnTeam(view, team.id);
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
                        <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">No one yet.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {members.map(({ person, count }) => (
                            <PersonRow
                              key={person.orderId}
                              person={person}
                              teams={view.teams}
                              teamId={team.id}
                              count={count}
                              onMove={(amount, toTeamId) =>
                                update(
                                  placeSeats(view, person.orderId, team.id, toTeamId, amount, seatsFor(person))
                                )
                              }
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

function PersonRow({
  person,
  teams,
  teamId,
  count,
  onMove,
}: {
  person: TeamPerson;
  teams: { id: string; name: string }[];
  teamId: string;
  count: number;
  onMove: (count: number, toTeamId: string | null) => void;
}) {
  const seats = seatsFor(person);
  const [amount, setAmount] = useState(String(count));
  const [amountFor, setAmountFor] = useState(count);
  if (count !== amountFor) {
    setAmountFor(count);
    setAmount(String(count));
  }
  const destinations = [
    ...(teamId ? [{ id: "unassigned", name: "Unassigned" }] : []),
    ...teams.filter((team) => team.id !== teamId).map((team) => ({ id: team.id, name: team.name })),
  ];
  const ticketLabel =
    teamId === ""
      ? count === seats
        ? `${seats} ${seats === 1 ? "ticket" : "tickets"}`
        : `${count} of ${seats} unassigned`
      : `${count} of ${seats}`;

  return (
    <li className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <EventHubInitials name={person.fullName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground font-sans">{person.fullName}</p>
          <p className="text-xs text-foreground-muted font-sans">
            <span className="break-all">{person.email || "—"}</span>
            <span className="whitespace-nowrap">{` · ${ticketLabel}`}</span>
          </p>
        </div>
      </div>
      {destinations.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor={`count-${teamId}-${person.orderId}`}>
            Tickets to move for {person.fullName}
          </label>
          <input
            id={`count-${teamId}-${person.orderId}`}
            inputMode="numeric"
            aria-label={`Tickets to move for ${person.fullName}`}
            value={amount}
            disabled={count <= 1}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
            className="w-12 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-xs tabular-nums text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
          />
          <label className="sr-only" htmlFor={`move-${teamId}-${person.orderId}`}>
            Move {person.fullName}
          </label>
          <select
            id={`move-${teamId}-${person.orderId}`}
            aria-label={`Move ${person.fullName}`}
            value=""
            onChange={(event) => {
              const destination = event.target.value;
              if (!destination) return;
              const parsed = Number.parseInt(amount, 10);
              const moving = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), count) : count;
              onMove(moving, destination === "unassigned" ? null : destination);
            }}
            className="max-w-[9.5rem] rounded-lg border border-border bg-background py-1.5 pl-2 pr-7 text-xs text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <option value="">Move…</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </li>
  );
}
