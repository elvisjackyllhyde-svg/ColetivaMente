import assert from "node:assert/strict";
import test from "node:test";
import { roomQuestions, validateQuestions } from "../lib/room-quiz.ts";

// ponytail: `npm run build` (see package.json "test" script) already exercises the
// full SSR bundle and catches import/syntax breaks. A `dist/server/index.js` fetch
// smoke test isn't runnable here — it imports `cloudflare:workers`, a Workers-only
// builtin plain Node can't resolve without a miniflare/vitest-pool-workers harness.

test("validateQuestions accepts a well-formed custom quiz", () => {
  const input = [{ text: "Pergunta?", options: ["A", "B", "C", "D"], correct: 2, explanation: "Porque sim." }];
  const result = validateQuestions(input);
  assert.ok(result);
  assert.equal(result.length, 1);
  assert.equal(result[0].correct, 2);
  assert.equal(result[0].options.length, 4);
});

test("validateQuestions rejects a non-array payload", () => {
  assert.equal(validateQuestions("not an array"), null);
  assert.equal(validateQuestions(null), null);
  assert.equal(validateQuestions([]), null);
});

test("validateQuestions rejects questions without exactly 4 options", () => {
  const input = [{ text: "Pergunta?", options: ["A", "B", "C"], correct: 0, explanation: "" }];
  assert.equal(validateQuestions(input), null);
});

test("validateQuestions rejects an out-of-range correct index", () => {
  const input = [{ text: "Pergunta?", options: ["A", "B", "C", "D"], correct: 4, explanation: "" }];
  assert.equal(validateQuestions(input), null);
});

test("validateQuestions rejects a missing question text", () => {
  const input = [{ text: "", options: ["A", "B", "C", "D"], correct: 0, explanation: "" }];
  assert.equal(validateQuestions(input), null);
});

test("roomQuestions falls back to the default bank on missing or malformed data", () => {
  assert.ok(roomQuestions(null).length > 0);
  assert.ok(roomQuestions("").length > 0);
  assert.ok(roomQuestions("{not json").length > 0);
  assert.ok(roomQuestions("[]").length > 0);
});

test("roomQuestions returns the stored custom questions when valid", () => {
  const custom = [{ text: "Custom?", options: ["A", "B", "C", "D"], correct: 1, explanation: "", timeLimit: 15 }];
  const result = roomQuestions(JSON.stringify(custom));
  assert.equal(result.length, 1);
  assert.equal(result[0].text, "Custom?");
});
