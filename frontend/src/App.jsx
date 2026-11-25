import React from 'react';
import useInterview from './useInterview.js';

const topics = ['Self Introduction', 'Generative AI', 'Python', 'English', 'HTML', 'CSS'];
const symbols = ['◎', '✦', '⌘', 'Aa', '</>', '#'];

function TopicSidebar({ subject, onSelect, disabled }) {
  return <aside><div className="brand"><span className="brand-icon">✦</span>AI Interview</div>
    <p className="eyebrow">Select topic</p><nav aria-label="Interview topics">
      {topics.map((topic, index) => <button key={topic} disabled={disabled} aria-pressed={subject === topic}
        className={`topic ${subject === topic ? 'active' : ''}`} onClick={() => onSelect(topic)}>
        <span className="topic-icon" aria-hidden="true">{symbols[index]}</span>{topic}</button>)}
    </nav><p className="sidebar-footer">Practice. Reflect. Improve.</p></aside>;
}

function FeedbackPanel({ feedback, subject }) {
  const raw = Number(feedback.candidate_score);
  const score = Number.isFinite(raw) ? Math.max(0, Math.min(5, raw)) : 0;
  return <section className="feedback" aria-label="Interview feedback">
    <div className="feedback-heading"><div><p className="eyebrow">Detailed feedback</p><h2>{feedback.subject || subject}</h2></div>
      <div className="score"><strong>{score}</strong><span>/ 5</span></div></div>
    <article><h3>Strengths & feedback</h3><p>{feedback.feedback || 'No feedback available.'}</p></article>
    <article><h3>Areas to improve</h3><p>{feedback.areas_of_improvement || 'No suggestions available.'}</p></article>
  </section>;
}

const statusText = {
  ready: 'Click Start Interview to begin', connecting: 'Connecting to your interviewer…',
  speaking: 'Listen to Natalie’s question', permission: 'Allow microphone access to continue',
  answer: 'Record your answer when you are ready', recording: 'Recording… click Stop when finished',
  saving: 'Saving your recording…', submitting: 'Transcribing your answer and preparing the next question…',
  complete: 'Interview ended. Generate your feedback below.', 'feedback-loading': 'Generating personalized feedback…',
  feedback: 'Your feedback is ready',
};

export default function App() {
  const interview = useInterview();
  const { subject, phase, questionNumber, recording, feedback } = interview;
  const active = !['ready', 'complete', 'feedback'].includes(phase);
  return <div className="app-shell">
    <TopicSidebar subject={subject} onSelect={interview.reset} disabled={active} />
    <main><header><p className="eyebrow">Your next opportunity starts here</p><h1>Master Your Interview</h1>
      <p>Ace your technical interviews with AI-powered practice and feedback.</p></header>
      <div className="content">
        {!subject ? <section className="welcome"><div className="welcome-icon">♬</div><h2>Ready to practice?</h2><p>Select a topic from the sidebar to begin.</p><p className="hint">Five questions. A natural conversation. Feedback to help you grow.</p></section> :
          <section className="interview"><div className="session-heading"><span className="badge">{subject}</span><span>Question <strong>{questionNumber}</strong> / 5</span></div>
            <div className="interviewer"><div className={`avatar ${phase === 'speaking' ? 'speaking' : ''}`}>N</div><h2>Natalie</h2><p>Your AI interviewer</p></div>
            <div className="controls"><p role="status" aria-live="polite">{statusText[phase]}</p>
              {interview.questionText && <blockquote>{interview.questionText}</blockquote>}
              {/* The audio element stays mounted so refs and browser playback remain stable. */}
              <audio ref={interview.audioRef} controls hidden={phase !== 'speaking'} onEnded={interview.playbackEnded} onError={phase === 'speaking' ? interview.playbackError : undefined} />
              {interview.notice && <p className="hint">{interview.notice}</p>}
              {phase === 'ready' && <button className="primary" onClick={interview.start}>Start Interview</button>}
              {phase === 'answer' && <><button className="record" onClick={interview.startRecording}>{recording ? 'Record Again' : 'Record Answer'}</button>
                {recording && <button className="primary" onClick={interview.submit}>Submit Answer</button>}</>}
              {phase === 'recording' && <button className="record recording" onClick={interview.stopRecording}>■ Stop Recording</button>}
              {['answer', 'speaking'].includes(phase) && <button className="secondary" onClick={interview.end}>End Interview</button>}
              {phase === 'complete' && <button className="primary" onClick={interview.getFeedback}>Get Feedback</button>}
              {interview.error && <p role="alert" className="error">{interview.error}</p>}
            </div>
            {feedback && <FeedbackPanel feedback={feedback} subject={subject} />}
            {!['connecting', 'submitting', 'feedback-loading', 'permission', 'saving'].includes(phase) && <div className="reset-area"><button className="secondary" onClick={() => interview.reset()}>New Interview</button></div>}
          </section>}
      </div><footer>Powered by Gemini · AssemblyAI · Murf AI</footer>
    </main>
  </div>;
}
