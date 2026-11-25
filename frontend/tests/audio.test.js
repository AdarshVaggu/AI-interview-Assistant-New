import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeAudioLines } from '../src/audio.js';

function stream(parts) {
  return new ReadableStream({ start(controller) {
    parts.forEach(part => controller.enqueue(new TextEncoder().encode(part)));
    controller.close();
  } });
}
test('decodes base64 records split across arbitrary network boundaries', async () => {
  const chunks = [];
  for await (const chunk of decodeAudioLines(stream(['AQ', 'ID\nBA', 'U=\n\n', 'Bg==']))) chunks.push([...chunk]);
  assert.deepEqual(chunks, [[1, 2, 3], [4, 5], [6]]);
});
test('accepts CRLF and skips blank records', async () => {
  const chunks = [];
  for await (const chunk of decodeAudioLines(stream(['\r\nAQ==\r\n\r\n']))) chunks.push([...chunk]);
  assert.deepEqual(chunks, [[1]]);
});
test('rejects corrupt base64 instead of silently losing speech', async () => {
  await assert.rejects(async () => { for await (const chunk of decodeAudioLines(stream(['!invalid!\n']))) void chunk; });
});
