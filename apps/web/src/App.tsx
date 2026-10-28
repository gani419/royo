import { useEffect, useState } from "react";
import {
  Sparkles,
  Bike,
  Wrench,
  History,
  ArrowRight,
  Plus,
  Sun,
  Moon,
  LogOut,
  MessageSquare,
  Trash2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  useAuthSession,
  useVehicleManager,
  useAIChat,
  useAIQuota,
  useMaintenance,
} from "@royo/features";
import { AuthDialog } from "./components/AuthDialog";
import { VehicleDialog } from "./components/VehicleDialog";
import { Assistant } from "./pages/Assistant";
import { Logbook } from "./pages/Logbook";

const tabs = [
  {
    id: "assistant",
    label: "Repair assistant",
    short: "Assistant",
    icon: Sparkles,
  },
  { id: "garage", label: "My garage", short: "Garage", icon: Bike },
  { id: "logbook", label: "Service logbook", short: "Logbook", icon: Wrench },
  { id: "history", label: "Conversations", short: "History", icon: History },
] as const;
type Tab = (typeof tabs)[number]["id"];
const headings = {
  assistant: ["A better understanding.", "A better ride."],
  garage: ["Your motorcycles.", "All in one place."],
  logbook: ["Keep your ride", "in good company."],
  history: ["Pick up where", "you left off."],
};

function Brand() {
  return (
    <picture>
      <source
        media="(min-width: 600px) and (max-width: 1199px)"
        srcSet="/assets/royo-symbol.png"
      />
      <img src="/assets/royo-wordmark.png" alt="ROYO — Repair On Your Own" />
    </picture>
  );
}

export function App() {
  const auth = useAuthSession();
  const garage = useVehicleManager();
  const chat = useAIChat(garage.activeVehicle);
  const quota = useAIQuota();
  const maintenance = useMaintenance(garage.activeVehicle);
  const [tab, setTab] = useState<Tab>(() => {
    const hash = window.location.hash.slice(1);
    return tabs.some((t) => t.id === hash) ? (hash as Tab) : "assistant";
  });
  const [modal, setModal] = useState<"auth" | "vehicle" | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("royo-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    void auth.checkSession();
  }, [auth.checkSession]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("royo-theme", theme);
    } catch {
      /* theme still works without storage */
    }
  }, [theme]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const navigate = () => {
      const hash = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === hash)) setTab(hash as Tab);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("hashchange", navigate);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("hashchange", navigate);
    };
  }, []);
  const navigate = (next: Tab) => {
    setTab(next);
    window.location.hash = next;
  };
  const setup = () => setModal(auth.isAuthenticated ? "vehicle" : "auth");
  const selectedTab = tabs.find((t) => t.id === tab)!;
  const filteredSessions = chat.sessions.filter(
    (s) => s.vehicleId === garage.activeVehicle?.id,
  );
  const empty = (
    <div className="empty">
      <div className="empty-icon">
        <Bike size={30} />
      </div>
      <h2>Your garage starts with one ride.</h2>
      <p>
        Add your motorcycle to get vehicle-specific conversations and keep a
        real record of its care.
      </p>
      <button className="primary" onClick={setup}>
        <Plus size={16} />{" "}
        {auth.isAuthenticated ? "Add motorcycle" : "Sign in to get started"}
      </button>
    </div>
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="#assistant" aria-label="ROYO home">
            <Brand />
          </a>
          <div className="nav-label">YOUR WORKSPACE</div>
          <nav className="main-nav" aria-label="Main navigation">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`nav-item ${tab === t.id ? "active" : ""}`}
                aria-current={tab === t.id ? "page" : undefined}
                title={t.label}
                onClick={() => navigate(t.id)}
              >
                <t.icon size={18} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="sidebar-note">
              <ShieldCheck size={20} />
              <strong>Know more. Ride wiser.</strong>A companion for the curious
              rider. Always put safety first.
            </div>
            <p className="sidebar-caption">REPAIR ON YOUR OWN · ROYO</p>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <a
              href="#assistant"
              className="mobile-brand"
              aria-label="ROYO home"
            >
              <Brand />
            </a>
            <div className="breadcrumb">
              Workspace
              <ChevronRight size={12} />
              <strong>{selectedTab.label}</strong>
            </div>
            <div className="top-actions">
              {auth.isAuthenticated && (
                <span className="quota">
                  <strong>
                    {quota.quota ? quota.effectiveRemaining : "—"}
                  </strong>{" "}
                  messages left today
                </span>
              )}
              <button
                className="icon-button"
                aria-label={
                  theme === "light" ? "Use dark theme" : "Use light theme"
                }
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              </button>
              {auth.isAuthenticated ? (
                <>
                  <span className="profile-chip">{auth.user?.fullName}</span>
                  <button
                    className="icon-button"
                    aria-label="Sign out"
                    onClick={() => void auth.logout()}
                  >
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <button className="primary" onClick={() => setModal("auth")}>
                  Sign in
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </header>
          {!online && (
            <p className="offline" role="status">
              You’re offline. Your draft stays here; reconnect to save changes
              or ask ROYO.
            </p>
          )}
          <main className="content" id="main-content" tabIndex={-1}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {tab === "assistant"
                    ? "A LITTLE KNOW-HOW GOES A LONG WAY"
                    : selectedTab.label}
                </div>
                <h1>
                  {headings[tab][0]}
                  <br />
                  {headings[tab][1]}
                </h1>
                <p>
                  {tab === "assistant"
                    ? "Understand your vehicle. Maintain with confidence. Repair smarter."
                    : "Your ride, your records, your peace of mind."}
                </p>
              </div>
              {tab === "assistant" ? (
                <button
                  className="secondary"
                  disabled={chat.isGenerating}
                  onClick={() => chat.selectSession(null)}
                >
                  <Plus size={16} />
                  New conversation
                </button>
              ) : tab === "garage" ? (
                <button className="primary" onClick={setup}>
                  <Plus size={16} />
                  Add motorcycle
                </button>
              ) : null}
            </div>
            {tab === "assistant" && (
              <Assistant
                vehicle={garage.activeVehicle}
                chat={chat}
                authenticated={auth.isAuthenticated}
                onSetup={setup}
                onGarage={() => navigate("garage")}
              />
            )}
            {tab === "garage" && (
              <div className="page-content">
                {garage.error && (
                  <p className="error" role="alert">
                    {garage.error}
                    <button
                      className="text-button"
                      onClick={() => void garage.refresh()}
                    >
                      Retry
                    </button>
                  </p>
                )}
                {garage.isLoading ? (
                  <p role="status">Loading your garage…</p>
                ) : garage.vehicles.length ? (
                  <div className="garage-grid">
                    {garage.vehicles.map((v) => (
                      <article
                        className={`vehicle-card ${v.id === garage.activeVehicle?.id ? "selected" : ""}`}
                        key={v.id}
                      >
                        <div className="context-art">
                          <Bike size={90} strokeWidth={1} />
                        </div>
                        <span className="pill">
                          {v.id === garage.activeVehicle?.id
                            ? "SELECTED RIDE"
                            : "IN YOUR GARAGE"}
                        </span>
                        <h2>{v.nickname || v.model.name}</h2>
                        <p>
                          {v.model.manufacturer?.name} · {v.model.name}
                        </p>
                        <div className="context-stats">
                          <div>
                            <small>YEAR</small>
                            <strong>{v.modelYear}</strong>
                          </div>
                          <div>
                            <small>ODOMETER</small>
                            <strong>{v.odometerKm.toLocaleString()} km</strong>
                          </div>
                          <div>
                            <small>ENGINE</small>
                            <strong>{v.model.engineDisplacementCc} cc</strong>
                          </div>
                        </div>
                        <div className="vehicle-actions">
                          <button
                            className="primary"
                            disabled={chat.isGenerating}
                            onClick={() => {
                              garage.selectVehicle(v.id);
                              navigate("assistant");
                            }}
                          >
                            Ask about this ride
                            <ArrowRight size={14} />
                          </button>
                          <button
                            className="secondary"
                            disabled={chat.isGenerating}
                            onClick={() => {
                              garage.selectVehicle(v.id);
                              navigate("logbook");
                            }}
                          >
                            <Wrench size={14} />
                            Logbook
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  empty
                )}
              </div>
            )}
            {tab === "logbook" &&
              (garage.activeVehicle ? (
                <div className="page-content">
                  <label className="sr-only" htmlFor="logbook-vehicle">
                    Motorcycle
                  </label>
                  <select
                    className="vehicle-select"
                    id="logbook-vehicle"
                    value={garage.activeVehicle.id}
                    disabled={chat.isGenerating}
                    onChange={(e) => garage.selectVehicle(e.target.value)}
                  >
                    {garage.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nickname || v.model.name}
                      </option>
                    ))}
                  </select>
                  <Logbook
                    key={garage.activeVehicle.id}
                    vehicle={garage.activeVehicle}
                    maintenance={maintenance}
                    onSaved={() => void garage.refresh()}
                  />
                </div>
              ) : (
                empty
              ))}
            {tab === "history" &&
              (garage.activeVehicle ? (
                <div className="page-content">
                  <label className="sr-only" htmlFor="history-vehicle">
                    Motorcycle
                  </label>
                  <select
                    className="vehicle-select"
                    id="history-vehicle"
                    value={garage.activeVehicle.id}
                    disabled={chat.isGenerating}
                    onChange={(e) => garage.selectVehicle(e.target.value)}
                  >
                    {garage.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nickname || v.model.name}
                      </option>
                    ))}
                  </select>
                  {chat.chatError && (
                    <p className="error" role="alert">
                      {chat.chatError}
                    </p>
                  )}
                  {filteredSessions.length ? (
                    filteredSessions.map((s) => (
                      <article className="history-row" key={s.id}>
                        <MessageSquare size={19} />
                        <button
                          className="history-open"
                          disabled={chat.isGenerating}
                          onClick={() => {
                            chat.selectSession(s.id);
                            navigate("assistant");
                          }}
                        >
                          <strong>{s.title}</strong>
                          <small>
                            {new Date(s.createdAt).toLocaleDateString()} ·{" "}
                            {garage.activeVehicle?.nickname ||
                              garage.activeVehicle?.model.name}
                          </small>
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={`Delete ${s.title}`}
                          disabled={chat.isGenerating}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this conversation? This cannot be undone.",
                              )
                            )
                              void chat.deleteSession(s.id);
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="empty">
                      <div className="empty-icon">
                        <History size={28} />
                      </div>
                      <h2>Good questions belong here.</h2>
                      <p>
                        Your saved conversations for this motorcycle will appear
                        here.
                      </p>
                      <button
                        className="primary"
                        onClick={() => navigate("assistant")}
                      >
                        Start a conversation
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                empty
              ))}
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => navigate(t.id)}
            >
              <t.icon size={20} />
              {t.short}
            </button>
          ))}
        </nav>
      </div>
      {modal === "auth" && <AuthDialog onClose={() => setModal(null)} />}{" "}
      {modal === "vehicle" && (
        <VehicleDialog
          onClose={() => setModal(null)}
          onAdd={garage.addVehicle}
        />
      )}
    </>
  );
}
