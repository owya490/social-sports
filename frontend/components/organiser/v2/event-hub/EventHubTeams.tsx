"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EventHubEmpty,
  EventHubGhostButton,
  EventHubInitials,
  EventHubPrimaryButton,
  EventHubStage,
} from "./EventHubStage";
import {
  EMPTY_TEAM_BOARD,
  TEAM_CSV_HEADERS,
  addTeam,
  assignPerson,
  autoFillTeams,
  buildTeamCsvRows,
  newTeamId,
  parseStoredTeamBoard,
  peopleFromOrders,
  removeTeam,
  renameTeam,
  setTeamTargetSize,
  visibleBoard,
  type TeamBoard,
  type TeamPerson,
} from "./teamBoard";

type EventHubTeamsProps = {
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  storageKey: string;
  initialBoard?: TeamBoard;
};

const fieldClass =
  "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function loadBoard(storageKey: string, fallback: TeamBoard): TeamBoard {
  if (typeof window === "undefined") return fallback;
  return parseStoredTeamBoard(window.localStorage.getItem(storageKey)) ?? fallback;
}

export function EventHubTeams({
  orderTicketsMap,
  eventName,
  storageKey,
  initialBoard = EMPTY_TEAM_BOARD,
}: EventHubTeamsProps) {
  const people = useMemo(() => peopleFromOrders(orderTicketsMap), [orderTicketsMap]);
  const [board, setBoard] = useState<TeamBoard | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftSize, setDraftSize] = useState("");
  const [armReshuffle, setArmReshuffle] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBoard(loadBoard(storageKey, initialBoard));
  }, [initialBoard, storageKey]);

  useEffect(() => {
    if (!board || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(board));
  }, [board, storageKey]);

  const view = useMemo(() => (board ? visibleBoard(board, people) : EMPTY_TEAM_BOARD), [board, people]);
  const assignedIds = useMemo(() => new Set(Object.keys(view.assignments)), [view.assignments]);
  const unassigned = people.filter((person) => !assignedIds.has(person.orderId));
  const csvRows = useMemo(() => buildTeamCsvRows(view, people), [people, view]);
  const filename = `${(eventName || "event").trim().replace(/\s+/g, "-").toLowerCase()}-teams.csv`;

  const update = (next: TeamBoard) => {
    setBoard(next);
    setArmReshuffle(false);
    setPendingDeleteId(null);
  };

  const createTeam = (event: FormEvent) => {
    event.preventDefault();
    const size = Number.parseInt(draftSize, 10);
    update(addTeam(view, draftName, Number.isFinite(size) ? size : null, newTeamId()));
    setDraftName("");
    setDraftSize("");
    setCreating(false);
  };

  if (!board) {
    return (
      <EventHubStage>
        <div className="space-y-3 pt-2">
          <div className="h-10 rounded-xl bg-surface-muted" />
          <div className="h-40 rounded-xl bg-surface-muted" />
        </div>
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-muted font-sans">
          {people.length === 0
            ? "Teams are built from approved signups."
            : `${unassigned.length} unassigned · ${view.teams.length} ${view.teams.length === 1 ? "team" : "teams"}`}
          <span className="text-foreground-muted"> · Saved in this browser</span>
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
            disabled={view.teams.length === 0 || unassigned.length === 0}
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
              <span className="text-xs tabular-nums text-foreground-muted font-sans">{unassigned.length}</span>
            </header>
            {people.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                No approved attendees yet.
              </p>
            ) : unassigned.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-foreground-muted font-sans">
                Everyone approved is on a team.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {unassigned.map((person) => (
                  <PersonRow
                    key={person.orderId}
                    person={person}
                    teams={view.teams}
                    teamId=""
                    onAssign={(teamId) => update(assignPerson(view, person.orderId, teamId))}
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
                  const members = people.filter((person) => view.assignments[person.orderId] === team.id);
                  const overTarget = team.targetSize != null && members.length > team.targetSize;
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
                          {members.length}
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
                          {members.map((person) => (
                            <PersonRow
                              key={person.orderId}
                              person={person}
                              teams={view.teams}
                              teamId={team.id}
                              onAssign={(teamId) => update(assignPerson(view, person.orderId, teamId))}
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
  onAssign,
}: {
  person: TeamPerson;
  teams: { id: string; name: string }[];
  teamId: string;
  onAssign: (teamId: string | null) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <EventHubInitials name={person.fullName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground font-sans">{person.fullName}</p>
        <p className="truncate text-xs text-foreground-muted font-sans">
          {person.email || "—"}
          {person.ticketCount > 0
            ? ` · ${person.ticketCount} ${person.ticketCount === 1 ? "ticket" : "tickets"}`
            : ""}
        </p>
      </div>
      <label className="sr-only" htmlFor={`move-${person.orderId}`}>
        Team for {person.fullName}
      </label>
      <select
        id={`move-${person.orderId}`}
        aria-label={`Team for ${person.fullName}`}
        value={teamId}
        onChange={(event) => onAssign(event.target.value || null)}
        className="max-w-[9.5rem] shrink-0 rounded-lg border border-border bg-background py-1.5 pl-2 pr-7 text-xs text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <option value="">Unassigned</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </li>
  );
}
