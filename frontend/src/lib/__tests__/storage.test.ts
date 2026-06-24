import { beforeEach, describe, expect, it } from "vitest";
import { loadFromStorage, saveToStorage } from "../storage";

describe("storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a value through save and load", () => {
    saveToStorage("key", { a: 1 });
    expect(loadFromStorage("key")).toEqual({ a: 1 });
  });

  it("returns null for a missing key", () => {
    expect(loadFromStorage("missing")).toBeNull();
  });

  it("returns null instead of throwing on corrupted JSON", () => {
    localStorage.setItem("bad", "{not json");
    expect(loadFromStorage("bad")).toBeNull();
  });
});
