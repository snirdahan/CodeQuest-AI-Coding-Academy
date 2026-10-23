import { describe, expect, it } from "vitest";
import { runLua } from "@/lib/grading/lua-runner";

describe("Lua sandbox security", () => {
  it("runs real Lua 5.4", async () => {
    const r = await runLua('print(_VERSION == nil, 7 // 2, math.type(1), ("ab"):upper())');
    expect(r.ok).toBe(true);
    expect(r.output).toEqual(["true\t3\tinteger\tAB"]);
  });

  it("has no access to io, os.execute, require, load, debug", async () => {
    const r = await runLua("print(io, os.execute, os.remove, require, load, loadfile, dofile, debug, package)");
    expect(r.output).toEqual([Array(9).fill("nil").join("\t")]);
  });

  it("cannot escape through string metatable or _G", async () => {
    const r = await runLua('print(("x").dump, string.dump, _G.io, rawget(_G, "os").getenv)');
    expect(r.output).toEqual(["nil\tnil\tnil\tnil"]);
  });

  it("stops infinite loops", async () => {
    const r = await runLua("while true do end");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("timeout");
  });

  it("stops infinite loops that swallow errors with pcall (hard kill)", async () => {
    const t = Date.now();
    const r = await runLua("while true do pcall(function() while true do end end) end");
    expect(r.ok).toBe(false);
    expect(r.error?.kind).toBe("timeout");
    expect(Date.now() - t).toBeLessThan(6000);
  });

  it("limits memory", async () => {
    const r = await runLua("local t = {} for i = 1, 1e9 do t[i] = i end");
    expect(r.ok).toBe(false);
    expect(["memory", "timeout"]).toContain(r.error?.kind);
  });

  it("limits output size", async () => {
    const r = await runLua("for i = 1, 100000 do print(i) end");
    expect(r.truncated).toBe(true);
    expect(r.output.length).toBeLessThanOrEqual(200);
  });

  it("reports syntax errors with a line number", async () => {
    const r = await runLua('print("a")\nif x then\nprint("b")');
    expect(r.error?.kind).toBe("syntax");
    expect(r.error?.line).toBe(3);
  });
});
