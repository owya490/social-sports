/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { runOptimisticSave, SettingsAutosavePreparation, SettingsAutosaveResult, useSettingsAutosave } from "./useSettingsAutosave";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

describe("runOptimisticSave", () => {
  it("keeps the optimistic value when persistence succeeds", async () => {
    const apply = jest.fn();
    const persist = jest.fn().mockResolvedValue(undefined);
    const rollback = jest.fn();

    await expect(runOptimisticSave({ apply, persist, rollback })).resolves.toBe(true);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
  });

  it("restores the previous value when persistence fails", async () => {
    const apply = jest.fn();
    const persist = jest.fn().mockRejectedValue(new Error("write failed"));
    const rollback = jest.fn();

    await expect(runOptimisticSave({ apply, persist, rollback })).resolves.toBe(false);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(rollback).toHaveBeenCalledTimes(1);
  });

  it("surfaces an unexpected rollback failure", async () => {
    const apply = jest.fn();
    const persist = jest.fn().mockRejectedValue(new Error("write failed"));
    const rollback = jest.fn(() => {
      throw new Error("rollback failed");
    });

    await expect(runOptimisticSave({ apply, persist, rollback })).rejects.toThrow("rollback failed");
  });
});

describe("useSettingsAutosave", () => {
  afterEach(() => jest.useRealTimers());

  it("acquires the shared lock synchronously and reports busy without another dispatch", async () => {
    const request = deferred();
    const mutationLockRef = { current: false };
    const operation = { apply: jest.fn(), persist: jest.fn(() => request.promise), rollback: jest.fn() };
    const prepare = jest.fn((): SettingsAutosavePreparation => ({ kind: "ready", operation }));
    const { result } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    let pending!: Promise<SettingsAutosaveResult>;

    act(() => {
      pending = result.current.run(true);
    });
    expect(result.current.status).toBe("saving");
    expect(mutationLockRef.current).toBe(true);
    await expect(result.current.run(false)).resolves.toEqual({ kind: "busy" });
    await expect(result.current.retry()).resolves.toEqual({ kind: "busy" });
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(operation.persist).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.reject(new Error("private server detail"));
      expect(await pending).toEqual({ kind: "error" });
    });
    expect(operation.rollback).toHaveBeenCalledTimes(1);
    expect(mutationLockRef.current).toBe(false);
    expect(result.current.failedIntent).toBe(true);
    expect(result.current.errorMessage).not.toContain("private server detail");
  });

  it("rechecks eligibility and prepares the original desired value with current rollback state", async () => {
    const mutationLockRef = { current: false };
    const persist = jest.fn().mockRejectedValue(new Error("write failed"));
    let visible = 1;
    const apply = jest.fn((next: number) => { visible = next; });
    const rollback = jest.fn((previous: number) => { visible = previous; });
    const prepare = jest.fn((next: number): SettingsAutosavePreparation => {
      const previous = visible;
      return { kind: "ready", operation: {
        apply: () => apply(next),
        persist: () => persist(next),
        rollback: () => rollback(previous),
      } };
    });
    const { result, rerender } = renderHook(
      ({ currentPrepare }: { currentPrepare: (intent: number) => SettingsAutosavePreparation }) =>
        useSettingsAutosave<number>({ prepare: currentPrepare, mutationLockRef }),
      { initialProps: { currentPrepare: prepare } }
    );
    await act(async () => { await result.current.run(4); });
    expect(visible).toBe(1);

    const blocked = jest.fn((_next: number): SettingsAutosavePreparation => ({ kind: "blocked", message: "Choose a current limit." }));
    rerender({ currentPrepare: blocked });
    await act(async () => {
      expect(await result.current.retry()).toEqual({ kind: "blocked" });
    });
    expect(result.current.failedIntent).toBe(4);
    expect(result.current.errorMessage).toBe("Choose a current limit.");
    expect(apply).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(rollback).toHaveBeenCalledTimes(1);
    expect(mutationLockRef.current).toBe(false);

    visible = 2;
    rerender({ currentPrepare: prepare });
    await act(async () => { await result.current.retry(); });
    expect(persist).toHaveBeenLastCalledWith(4);
    expect(rollback).toHaveBeenLastCalledWith(2);
    expect(visible).toBe(2);

    persist.mockResolvedValue(undefined);
    await act(async () => { await result.current.retry(); });
    expect(visible).toBe(4);
    expect(result.current.status).toBe("saved");
    expect(result.current.failedIntent).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("keeps failed intent on busy attempts and supersedes it only after acquiring the lock", async () => {
    const mutationLockRef = { current: false };
    const persist = jest.fn().mockRejectedValueOnce(new Error("write failed")).mockResolvedValue(undefined);
    const prepare = jest.fn((value: boolean): SettingsAutosavePreparation => ({
      kind: "ready",
      operation: { apply: jest.fn(), persist: () => persist(value), rollback: jest.fn() },
    }));
    const { result } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    await act(async () => { await result.current.run(true); });
    mutationLockRef.current = true;
    await expect(result.current.run(false)).resolves.toEqual({ kind: "busy" });
    expect(result.current.failedIntent).toBe(true);
    expect(result.current.status).toBe("error");
    mutationLockRef.current = false;

    await act(async () => { await result.current.run(false); });
    expect(persist).toHaveBeenLastCalledWith(false);
    expect(result.current.failedIntent).toBeNull();
    await expect(result.current.retry()).resolves.toEqual({ kind: "idle" });
  });

  it.each(["prepare", "apply", "rollback"])("contains %s exceptions and releases the lock for recovery", async (phase) => {
    const mutationLockRef = { current: false };
    const fail = () => { throw new Error("private exception"); };
    const prepare = jest.fn((): SettingsAutosavePreparation => {
      if (phase === "prepare") fail();
      return { kind: "ready", operation: {
        apply: phase === "apply" ? fail : jest.fn(),
        persist: jest.fn().mockRejectedValue(new Error("write failed")),
        rollback: phase === "rollback" ? fail : jest.fn(),
      } };
    });
    const { result } = renderHook(() => useSettingsAutosave<boolean>({
      prepare, mutationLockRef, failureMessage: "Preference could not be saved. Try again.",
    }));

    await act(async () => {
      expect(await result.current.run(true)).toEqual({ kind: "error" });
    });
    expect(mutationLockRef.current).toBe(false);
    expect(result.current.failedIntent).toBe(true);
    expect(result.current.errorMessage).toBe("Preference could not be saved. Try again.");
    await act(async () => { await result.current.retry(); });
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(mutationLockRef.current).toBe(false);
  });

  it("shows Saved for three seconds and restarts confirmation for another success", async () => {
    jest.useFakeTimers();
    const mutationLockRef = { current: false };
    const prepare = (): SettingsAutosavePreparation => ({ kind: "ready", operation: {
      apply: jest.fn(), persist: jest.fn().mockResolvedValue(undefined), rollback: jest.fn(),
    } });
    const { result } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    await act(async () => { await result.current.run(true); });
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.status).toBe("saved");

    await act(async () => { await result.current.run(false); });
    act(() => jest.advanceTimersByTime(2999));
    expect(result.current.status).toBe("saved");
    act(() => jest.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("never lets old Saved timing hide a newer request or persistent failure", async () => {
    jest.useFakeTimers();
    const request = deferred();
    const mutationLockRef = { current: false };
    const persist = jest.fn().mockResolvedValueOnce(undefined).mockReturnValueOnce(request.promise);
    const prepare = (): SettingsAutosavePreparation => ({ kind: "ready", operation: {
      apply: jest.fn(), persist, rollback: jest.fn(),
    } });
    const { result } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    await act(async () => { await result.current.run(true); });
    act(() => jest.advanceTimersByTime(2000));
    let pending!: Promise<SettingsAutosaveResult>;
    act(() => { pending = result.current.run(false); });
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.status).toBe("saving");
    await act(async () => {
      request.reject(new Error("write failed"));
      await pending;
    });
    act(() => jest.advanceTimersByTime(10000));
    expect(result.current.status).toBe("error");
    expect(result.current.failedIntent).toBe(false);
  });

  it.each(["resolve", "reject"] as const)("suppresses stale completion and rollback after unmount when requests %s", async (outcome) => {
    const request = deferred();
    const mutationLockRef = { current: false };
    const rollback = jest.fn();
    const prepare = jest.fn((): SettingsAutosavePreparation => ({ kind: "ready", operation: {
      apply: jest.fn(), persist: () => request.promise, rollback,
    } }));
    const { result, unmount } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    const retry = result.current.retry;
    let pending!: Promise<SettingsAutosaveResult>;
    act(() => { pending = result.current.run(true); });
    unmount();
    if (outcome === "resolve") request.resolve();
    else request.reject(new Error("write failed"));

    await expect(pending).resolves.toEqual({ kind: "disposed" });
    await expect(retry()).resolves.toEqual({ kind: "disposed" });
    expect(rollback).not.toHaveBeenCalled();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(mutationLockRef.current).toBe(false);
  });

  it("cleans up Saved timing when its owner unmounts", async () => {
    jest.useFakeTimers();
    const mutationLockRef = { current: false };
    const prepare = (): SettingsAutosavePreparation => ({ kind: "ready", operation: {
      apply: jest.fn(), persist: jest.fn().mockResolvedValue(undefined), rollback: jest.fn(),
    } });
    const { result, unmount } = renderHook(() => useSettingsAutosave<boolean>({ prepare, mutationLockRef }));
    await act(async () => { await result.current.run(true); });
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
