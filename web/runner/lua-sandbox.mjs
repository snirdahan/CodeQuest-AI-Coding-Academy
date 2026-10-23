// CodeQuest Lua sandbox.
// Runs ONE piece of learner code in real Lua 5.4 (compiled to WebAssembly) and prints a JSON result.
// This file always runs in its own child process (see src/lib/grading/lua-runner.ts), started with
// Node's permission model, so it cannot write files, spawn processes or start workers.
// Inside Lua the learner only gets a whitelisted environment: no io, os, debug, package, require, load.
//
// Input (stdin, JSON):  { code: string, harness?: string, instructionLimit?: number }
// Output (stdout, JSON): { ok, output: string[], error?: {message, line?, kind}, results?: object, truncated }

import { LuaFactory } from "wasmoon";

const MAX_OUTPUT_LINES = 200;
const MAX_OUTPUT_CHARS = 20000;
const MEMORY_LIMIT_BYTES = 32 * 1024 * 1024;

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
  });
}

// Lua side of the sandbox. Builds a safe environment, installs limits, then loads and runs the
// learner chunk (learner code + optional grading harness appended in the same chunk so the harness
// can see the learner's top-level locals).
const PRELUDE = `
local __out, __emit, __src, __limit = ...
local _load, _sethook, _pcall, _error, _tostring, _type, _pairs, _select, _concat =
  load, debug.sethook, pcall, error, tostring, type, pairs, select, table.concat

local function safe_print(...)
  local n = _select("#", ...)
  local parts = {}
  for i = 1, n do parts[i] = _tostring((_select(i, ...))) end
  __out(_concat(parts, "\\t"))
end

-- tiny JSON encoder for harness results (strings, numbers, booleans, nil, nested tables)
local function enc(v, depth)
  depth = depth or 0
  if depth > 6 then return '"<deep>"' end
  local t = _type(v)
  if t == "nil" then return "null"
  elseif t == "boolean" then return v and "true" or "false"
  elseif t == "number" then
    if v ~= v or v == math.huge or v == -math.huge then return '"' .. _tostring(v) .. '"' end
    if math.type(v) == "integer" then return string.format("%d", v) end
    return string.format("%.14g", v)
  elseif t == "string" then
    return '"' .. v:gsub('[%c"\\\\]', function(c) return string.format("\\\\u%04x", c:byte()) end) .. '"'
  elseif t == "table" then
    local isArr, n = true, 0
    for k in _pairs(v) do n = n + 1; if _type(k) ~= "number" then isArr = false end end
    local parts = {}
    if isArr and n == #v then
      for i = 1, #v do parts[i] = enc(v[i], depth + 1) end
      return "[" .. _concat(parts, ",") .. "]"
    end
    for k, val in _pairs(v) do parts[#parts + 1] = enc(_tostring(k)) .. ":" .. enc(val, depth + 1) end
    return "{" .. _concat(parts, ",") .. "}"
  else
    return '"<' .. t .. '>"'
  end
end

local muted = false
local cq = {
  mute = function(m) muted = m and true or false end,
  report = function(tbl) __emit(enc(tbl)) end,
  type = _type,
  -- call a learner function safely; returns ok, result-or-error
  call = function(fn, ...) return _pcall(fn, ...) end,
}

local function printer(...)
  if not muted then safe_print(...) end
end

local safe_string = {}
for k, v in _pairs(string) do safe_string[k] = v end
safe_string.dump = nil
local raw_rep = string.rep
safe_string.rep = function(s, n, sep)
  if _type(n) == "number" and n * (#_tostring(s) + #_tostring(sep or "")) > 1000000 then
    _error("string.rep: result too large for the CodeQuest sandbox", 2)
  end
  return raw_rep(s, n, sep)
end
string.rep = safe_string.rep
string.dump = nil

local function copy(t) local r = {} for k, v in _pairs(t) do r[k] = v end return r end

local env = {
  print = printer,
  assert = assert, error = error, ipairs = ipairs, next = next, pairs = pairs, pcall = pcall,
  select = select, tonumber = tonumber, tostring = tostring, type = type, unpack = table.unpack,
  rawequal = rawequal, rawget = rawget, rawlen = rawlen, rawset = rawset,
  setmetatable = setmetatable, getmetatable = getmetatable, xpcall = xpcall,
  math = copy(math), string = safe_string, table = copy(table), utf8 = copy(utf8),
  os = { time = os.time, clock = os.clock, date = os.date },
  __cq = cq,
}
env._G = env

local fn, cerr = _load(__src, "=main.lua", "t", env)
if not fn then return enc({ ok = false, kind = "syntax", message = cerr }) end

local count = 0
_sethook(function()
  count = count + 1
  if count * 1000 > __limit then _error("CQ_TIMEOUT: instruction limit reached", 2) end
end, "", 1000)

local ok, rerr = _pcall(fn)
_sethook()
if not ok then
  if count * 1000 > __limit then return enc({ ok = false, kind = "timeout", message = _tostring(rerr) }) end
  return enc({ ok = false, kind = "runtime", message = _tostring(rerr) })
end
return enc({ ok = true })
`;

async function main() {
  const input = JSON.parse(await readStdin());
  const code = String(input.code ?? "");
  const harness = input.harness ? String(input.harness) : "";
  const instructionLimit = Number(input.instructionLimit ?? 5_000_000);

  const output = [];
  const results = [];
  let chars = 0;
  let truncated = false;

  const factory = new LuaFactory();
  const lua = await factory.createEngine({ traceAllocations: true, injectObjects: false, enableProxy: false });
  lua.global.setMemoryMax(MEMORY_LIMIT_BYTES);

  const out = (s) => {
    s = String(s);
    if (output.length >= MAX_OUTPUT_LINES || chars + s.length > MAX_OUTPUT_CHARS) {
      truncated = true;
      return;
    }
    chars += s.length;
    output.push(s);
  };
  const emit = (json) => {
    try {
      results.push(JSON.parse(String(json)));
    } catch {
      results.push({ invalid: true });
    }
  };

  const source = harness ? `${code}\n${harness}` : code;
  let result;
  try {
    const runner = await lua.doString(`return function(...) ${PRELUDE} end`);
    const { ok, kind, message } = JSON.parse(runner(out, emit, source, instructionLimit));
    if (ok) {
      result = { ok: true, output, results, truncated };
    } else {
      result = { ok: false, output, results, truncated, error: describeError(kind, message, code) };
    }
  } catch (e) {
    const msg = String(e?.message ?? e);
    const kind = /not enough memory/i.test(msg) ? "memory" : "internal";
    result = { ok: false, output, results, truncated, error: { kind, message: msg } };
  } finally {
    try { lua.global.close(); } catch {}
  }
  process.stdout.write(JSON.stringify(result));
}

function describeError(kind, message, code) {
  message = String(message ?? "");
  const m = message.match(/main\.lua:(\d+):\s*(.*)$/s);
  const codeLines = code.split("\n").length;
  let line = m ? Number(m[1]) : undefined;
  let text = m ? m[2] : message;
  if (kind === "syntax" && line && line > codeLines) line = codeLines; // error at end of learner code
  if (line && line > codeLines) line = undefined; // error inside the grading harness
  if (/not enough memory/i.test(message)) kind = "memory";
  return { kind, message: text.trim(), line };
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ ok: false, output: [], results: [], error: { kind: "internal", message: String(e?.message ?? e) } }));
});
