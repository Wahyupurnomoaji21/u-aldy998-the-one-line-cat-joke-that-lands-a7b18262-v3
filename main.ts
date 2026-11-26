// The One-Line Cat Joke That Lands — v3, "The Tip"
// ---------------------------------------------------
// One joke about cats, one line, 125 characters. The program drops it
// into $MAKEFUN_OUTPUT_DIR/entry.txt and nothing else.
//
// The joke, in full:
//
//   My cat left a dead mouse on my pillow this morning. I said thank you.
//   He brought two the next day — apparently I tipped well.
//
// Why it works as a one-liner: the setup is a behaviour every cat owner
// recognises (the "gift" of a dead mouse), the middle beat rewards the
// cat, and the punchline reframes the reward as a restaurant tip — so the
// cat, behaving like a waiter who got a good tip, upsells the owner with
// a second mouse. Setup, escalation, turn: all inside one sentence chain.
// No ghost, no office, no resignation — a fresh angle on the same animal.
//
// Entry rules the program enforces before writing anything:
//   * exactly one line (no newline inside the joke),
//   * 1–200 characters after trimming,
//   * the file on disk must byte-match the joke plus one trailing newline.

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const JOKE_LINES = [
  "My cat left a dead mouse on my pillow this morning.",
  "I said thank you.",
  "He brought two the next day — apparently I tipped well.",
];

const MAX_ENTRY_CHARS = 200;

function buildEntry(lines: string[]): string {
  // Every joke line must carry text: an empty line would silently
  // collapse two beats into one and change the joke's rhythm.
  for (const [index, line] of lines.entries()) {
    if (line.trim().length === 0) fail(`joke line ${index + 1} is empty`);
  }
  const entry = lines.map((line) => line.trim()).join(" ");
  return entry;
}

function fail(message: string): never {
  console.error(`entry invalid: ${message}`);
  process.exit(1);
}

function checkEntry(entry: string): void {
  if (entry.length === 0) fail("empty entry");
  if (entry.length > MAX_ENTRY_CHARS) {
    fail(`too long: ${entry.length} chars, limit ${MAX_ENTRY_CHARS}`);
  }
  if (/[\r\n]/.test(entry)) fail("entry must be a single line");
  if (entry.trim() !== entry) fail("entry has leading or trailing space");
}

function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return resolve(fromEnv);
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  return join(scriptDir, "output");
}

function main(): void {
  const entry = buildEntry(JOKE_LINES);
  checkEntry(entry);

  const outDir = resolveOutputDir();
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  const payload = entry + "\n";
  // Atomic write: stage the bytes in a temp file in the same directory,
  // then rename over entry.txt, so a reader never sees a half-written
  // entry if the process is interrupted mid-write.
  const tmpPath = join(outDir, `.entry.txt.tmp-${process.pid}`);
  writeFileSync(tmpPath, payload, "utf8");
  renameSync(tmpPath, outPath);

  if (!existsSync(outPath)) fail(`could not create ${outPath}`);
  if (statSync(outPath).size !== Buffer.byteLength(payload, "utf8")) {
    fail("entry.txt size mismatch after write");
  }
  const roundTripped = readFileSync(outPath, "utf8");
  if (roundTripped !== payload) fail("entry.txt content mismatch after write");

  console.log(`wrote entry.txt (${entry.length} chars): ${entry}`);
}

main();
