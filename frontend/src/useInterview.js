import { useEffect, useRef, useState } from 'react';
import { post } from './api.js';
import { loadAudio } from './audio.js';

export default function useInterview() {
  const [subject, setSubject] = useState(null);
  const [phase, setPhase] = useState('ready');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [recording, setRecording] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [questionText, setQuestionText] = useState('');
  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const controllerRef = useRef(null);
  const completeRef = useRef(false);

  function releaseMedia() {
    controllerRef.current?.abort();
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      if (recorder.state !== 'inactive') recorder.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
      audio.removeAttribute('src');
      audio.load();
    }
  }
  useEffect(() => () => releaseMedia(), []);

  function reset(nextSubject = null) {
    releaseMedia();
    completeRef.current = false;
    setSubject(nextSubject); setPhase('ready'); setQuestionNumber(1);
    setRecording(null); setFeedback(null); setError(''); setNotice(''); setQuestionText('');
  }

  async function receiveQuestion(response, signal) {
    completeRef.current = response.headers.get('X-Interview-Complete') === 'true';
    const number = Number(response.headers.get('X-Question-Number'));
    if (number > 0) setQuestionNumber(Math.min(number, 5));
    setRecording(null);
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      signal.throwIfAborted();
      setQuestionText(data.question || data.message || '');
      setPhase(completeRef.current ? 'complete' : 'answer');
      return;
    }
    setQuestionText(''); setPhase('speaking');
    await loadAudio(response, audioRef.current, signal, () => setNotice('Press Play on the audio player to hear the interviewer.'));
  }

  function newRequest() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(''); setNotice('');
    return controller.signal;
  }

  async function start() {
    const signal = newRequest();
    setPhase('connecting');
    try {
      await receiveQuestion(await post('/start-interview', { subject }, signal), signal);
    } catch (err) {
      if (signal.aborted) return;
      setError(err.message); setPhase('ready');
    }
  }

  async function startRecording() {
    setError(''); setPhase('permission');
    const signal = newRequest();
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording requires a supported browser on localhost or HTTPS. Try Chrome or Edge.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (signal.aborted) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (signal.aborted) return;
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setRecording(blob.size ? blob : null);
        setPhase('answer');
        if (!blob.size) setError('No audio captured. Please record again.');
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        stream.getTracks().forEach(track => track.stop());
        setError('Recording failed. Please try again.'); setPhase('answer');
      };
      recorder.start(); setRecording(null); setPhase('recording');
    } catch (err) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (signal.aborted) return;
      setError(err.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it in your browser and try again.' : err.message);
      setPhase('answer');
    }
  }

  function stopRecording() {
    setPhase('saving');
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
  }

  async function submit() {
    if (!recording) return;
    const signal = newRequest();
    setPhase('submitting');
    const form = new FormData();
    form.append('audio', recording, recording.type.includes('mp4') ? 'answer.mp4' : 'answer.webm');
    try {
      await receiveQuestion(await post('/submit-answer', form, signal), signal);
    } catch (err) {
      if (signal.aborted) return;
      setError(`${err.message} The server may have processed the answer; restart if the question count is out of sync.`);
      setPhase('answer');
    }
  }

  async function getFeedback() {
    const signal = newRequest();
    setPhase('feedback-loading');
    try {
      const data = await (await post('/get-feedback', {}, signal)).json();
      signal.throwIfAborted();
      if (!data.success || !data.feedback) throw new Error('Feedback could not be generated. Please retry.');
      setFeedback(data.feedback); setPhase('feedback');
    } catch (err) {
      if (signal.aborted) return;
      setError(err.message); setPhase('complete');
    }
  }

  function playbackEnded() {
    setNotice(''); setPhase(completeRef.current ? 'complete' : 'answer');
  }
  function playbackError() {
    setError('Audio playback failed. You can continue recording or start a new interview.');
    playbackEnded();
  }
  function end() {
    releaseMedia(); setRecording(null); setPhase('complete');
  }
  return { subject, phase, questionNumber, recording, feedback, error, notice, questionText, audioRef,
    reset, start, startRecording, stopRecording, submit, getFeedback, playbackEnded, playbackError, end };
}
