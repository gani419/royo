import { useEffect, useRef } from "react";
import {
  Sparkles,
  Wrench,
  Disc3,
  Thermometer,
  Link2,
  Send,
  ShieldCheck,
  Bike,
  ArrowUpRight,
} from "lucide-react";
import type { Vehicle, ChatMessage } from "@royo/types";
import type { useAIChat } from "@royo/features";

type Chat = ReturnType<typeof useAIChat>;
const suggestions = [
  {
    icon: Wrench,
    title: "An unfamiliar engine sound",
    detail: "Rattling, ticking, or knocking?",
    prompt:
      "My engine makes a rattling sound when accelerating. What should I check?",
  },
  {
    icon: Disc3,
    title: "Something with the brakes",
    detail: "Squealing or a different lever feel?",
    prompt: "My front brake squeals when slowing down. What should I do?",
  },
  {
    icon: Thermometer,
    title: "Trouble getting started",
    detail: "Cold starts or a rough idle?",
    prompt:
      "My motorcycle struggles to start when cold. What information would help?",
  },
  {
    icon: Link2,
    title: "Everyday maintenance",
    detail: "Get to know your motorcycle.",
    prompt: "How can I safely inspect and maintain my drive chain?",
  },
];

function Message({
  message,
  followup,
}: {
  message: ChatMessage;
  followup: (text: string) => void;
}) {
  const data = message.structuredData;
  return (
    <article className={`chat-message ${message.senderType}`}>
      <div className="message-label">
        {message.senderType === "user" ? "You" : "ROYO · AI guidance"}
      </div>
      <p>{message.content}</p>
      {data && (
        <>
          {!!data.possibleCauses?.length && (
            <section className="response-section">
              <h3>Possible causes</h3>
              <ul>
                {data.possibleCauses.map((c, i) => (
                  <li key={i}>
                    <strong>{c.component}</strong>
                    <small>{c.explanation}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!!data.troubleshootingSteps?.length && (
            <section className="response-section">
              <h3>Checks to discuss with your mechanic</h3>
              <ol>
                {data.troubleshootingSteps.map((s, i) => (
                  <li key={i}>
                    {s.instruction}
                    {s.safetyPrecaution && <small>{s.safetyPrecaution}</small>}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {data.safetyWarnings?.map((s, i) => (
            <p className="warning" key={i}>
              {s}
            </p>
          ))}
          {data.professionalHelpRecommended && (
            <p className="warning">
              Professional help recommended. Arrange a qualified mechanic’s
              inspection.
            </p>
          )}
          <div className="followups">
            {data.followUpQuestions?.map((q, i) => (
              <button className="secondary" key={i} onClick={() => followup(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}
      {!!message.videos?.length && (
        <div className="video-list">
          {message.videos
            .filter((v) => /^https:\/\/(www\.)?youtube\.com\//.test(v.videoUrl))
            .map((v) => (
              <a
                className="video-link"
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                key={v.id}
              >
                <img src={v.thumbnailUrl} alt="" loading="lazy" />
                <span>
                  {v.title}
                  <small>{v.channelTitle}</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))}
        </div>
      )}
    </article>
  );
}

export function Assistant({
  vehicle,
  chat,
  authenticated,
  onSetup,
  onGarage,
}: {
  vehicle: Vehicle | null;
  chat: Chat;
  authenticated: boolean;
  onSetup: () => void;
  onGarage: () => void;
}) {
  const stream = useRef<HTMLDivElement>(null);
  useEffect(() => {
    stream.current?.scrollTo({
      top: stream.current.scrollHeight,
      behavior: "auto",
    });
  }, [chat.messages, chat.isGenerating]);
  const send = async (text: string) => {
    if (!authenticated || !vehicle) {
      chat.setDraft(text);
      onSetup();
      return;
    }
    await chat.sendMessage(text);
  };
  return (
    <div className="assistant-layout">
      <section className="assistant-panel" aria-label="Repair conversation">
        <div className="assistant-top">
          <div className="empty-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h2>Your repair companion</h2>
            <p>
              {vehicle
                ? `${vehicle.model.manufacturer?.name ?? ""} ${vehicle.model.name}`
                : "A little knowledge. A more confident ride."}
            </p>
          </div>
          <span className="pill">
            <ShieldCheck size={12} /> AI guidance
          </span>
        </div>
        <button className="mobile-ride" onClick={vehicle ? onGarage : onSetup}>
          <Bike size={15} />
          <span>
            {vehicle
              ? vehicle.nickname || vehicle.model.name
              : "Add your motorcycle"}
          </span>
          {vehicle && <small>{vehicle.odometerKm.toLocaleString()} km</small>}
        </button>
        {chat.messages.length ? (
          <div
            className="chat-stream"
            ref={stream}
            role="log"
            aria-label="Conversation"
          >
            {chat.messages.map((m) => (
              <Message message={m} key={m.id} followup={chat.setDraft} />
            ))}
          </div>
        ) : (
          <div className="welcome">
            <div className="welcome-symbol">
              <Sparkles size={29} />
            </div>
            <h2>
              Let’s understand
              <br />
              your motorcycle.
            </h2>
            <p>
              That new sound. That unexpected vibration. Tell us what’s
              happening, and we’ll help you find a sensible next step.
            </p>
            <div className="suggestion-label">NOT SURE WHERE TO START?</div>
            <div className="suggestion-grid">
              {suggestions.map((s) => (
                <button
                  className="suggestion"
                  key={s.title}
                  onClick={() => chat.setDraft(s.prompt)}
                >
                  <s.icon size={20} />
                  <strong>{s.title}</strong>
                  <span>{s.detail}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {(chat.isGenerating || chat.isLoadingMessages) && (
          <p className="muted chat-error" role="status">
            {chat.isGenerating
              ? "Working through your question…"
              : "Loading conversation…"}
          </p>
        )}
        {chat.chatError && (
          <p role="alert" className="error chat-error">
            {chat.chatError}
          </p>
        )}
        <div className="composer-area">
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(chat.currentDraft);
            }}
          >
            <label className="sr-only" htmlFor="symptoms">
              Describe your motorcycle issue
            </label>
            <textarea
              id="symptoms"
              rows={2}
              maxLength={1000}
              placeholder="Describe what you’re noticing…"
              value={chat.currentDraft}
              onChange={(e) => chat.setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send(chat.currentDraft);
                }
              }}
            />
            <button
              className="primary"
              aria-label="Send message"
              disabled={
                chat.isGenerating ||
                chat.isLoadingMessages ||
                chat.currentDraft.trim().length < 5
              }
            >
              <Send size={18} />
            </button>
          </form>
          <p className="safety-caption">
            AI can make mistakes. Guidance is not a diagnosis or confirmation
            that your motorcycle is safe to ride.
          </p>
        </div>
      </section>
      <aside className="assistant-aside">
        <section className="context-card">
          <div className="eyebrow">YOUR GARAGE</div>
          <h3>Your ride, in focus.</h3>
          <div className="context-art">
            <Bike size={72} strokeWidth={1.25} />
          </div>
          {vehicle ? (
            <>
              <h3>{vehicle.nickname || vehicle.model.name}</h3>
              <p>
                {vehicle.model.manufacturer?.name} · {vehicle.model.name}
              </p>
              <div className="context-stats">
                <div>
                  <small>MODEL YEAR</small>
                  <strong>{vehicle.modelYear}</strong>
                </div>
                <div>
                  <small>ODOMETER</small>
                  <strong>{vehicle.odometerKm.toLocaleString()} km</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Every ride has a story.</h3>
              <p>
                Add your motorcycle for guidance with the right vehicle context.
              </p>
            </>
          )}
          <button className="secondary" onClick={vehicle ? onGarage : onSetup}>
            {vehicle ? "Manage garage" : "Add your motorcycle"}
            <ArrowUpRight size={14} />
          </button>
        </section>
        <section className="safety-card">
          <ShieldCheck size={22} />
          <h3>Confidence starts with care.</h3>
          <p>
            Brake, steering, fuel leaks, or electrical concerns? Stop riding and
            get a qualified mechanic’s help. Always follow your owner’s manual.
          </p>
        </section>
      </aside>
    </div>
  );
}
