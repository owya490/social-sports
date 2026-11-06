import { runOptimisticSave } from "./useSettingsAutosave";

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
