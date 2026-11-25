// A fetch chunk can end in the middle of a base64 line. Keep the remainder.
export async function* decodeAudioLines(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  const decode = line => Uint8Array.from(atob(line.trim()), c => c.charCodeAt(0));
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop();
      for (const line of lines) if (line.trim()) yield decode(line);
      if (done) break;
    }
    if (pending.trim()) yield decode(pending);
  } finally { reader.releaseLock(); }
}

export async function loadAudio(response, audio, signal, onAutoplayBlocked) {
  if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
  // Stream MP3 into MediaSource where supported; otherwise collect a playable Blob.
  const canStream = typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg');
  const attemptPlay = () => { audio.play().catch(() => { if (!signal.aborted) onAutoplayBlocked(); }); };
  if (!canStream) {
    const chunks = [];
    for await (const chunk of decodeAudioLines(response.body)) chunks.push(chunk);
    signal.throwIfAborted();
    audio.src = URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }));
    attemptPlay();
    return;
  }
  const media = new MediaSource();
  audio.src = URL.createObjectURL(media);
  await new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    media.addEventListener('sourceopen', () => { signal.removeEventListener('abort', abort); resolve(); }, { once: true });
  });
  signal.throwIfAborted();
  const buffer = media.addSourceBuffer('audio/mpeg');
  let started = false;
  for await (const chunk of decodeAudioLines(response.body)) {
    signal.throwIfAborted();
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        buffer.removeEventListener('updateend', finish);
        buffer.removeEventListener('error', fail);
        signal.removeEventListener('abort', fail);
      };
      const finish = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(signal.aborted ? new DOMException('Aborted', 'AbortError') : new Error('Audio decoding failed.')); };
      buffer.addEventListener('updateend', finish, { once: true });
      buffer.addEventListener('error', fail, { once: true });
      signal.addEventListener('abort', fail, { once: true });
      try { buffer.appendBuffer(chunk); } catch (error) { cleanup(); reject(error); }
    });
    if (!started) { started = true; attemptPlay(); }
  }
  signal.throwIfAborted();
  if (!started) throw new Error('The speech service returned no audio.');
  if (media.readyState === 'open') media.endOfStream();
}
