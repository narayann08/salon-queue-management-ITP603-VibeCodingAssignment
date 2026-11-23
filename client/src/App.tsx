import React, { useEffect, useState, useRef } from "react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";
import {
  Scissors,
  Clock,
  Users,
  Sparkles,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Shield,
  Volume2,
  VolumeX,
  Play,
  Check,
  Plus,
  RefreshCw,
  X,
  ArrowRight,
  LogOut,
  Coffee,
  Calendar,
  Layers,
  ChevronRight,
  Tv,
  Settings,
  Lock,
} from "lucide-react";
import type {
  AdminSnapshot,
  Barber,
  DisplaySnapshot,
  HomeSummary,
  Language,
  QueueStatusView,
  Service,
  StaffOverview,
} from "../../shared/types";
import { languageLabels } from "./i18n";
import { soundManager } from "./utils/sound";

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
const apiUrl = configuredApiUrl
  ? configuredApiUrl.endsWith("/api")
    ? configuredApiUrl
    : `${configuredApiUrl}/api`
  : "/api";
const socketUrl = apiUrl === "/api" ? window.location.origin : apiUrl.replace(/\/api\/?$/, "");
const socketClient = () => io(socketUrl, { transports: ["websocket", "polling"] });

function message(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), template);
}

// Global Luxury Header
function Header({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
}) {
  const labels = languageLabels[language];
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const toggleLanguage = () => {
    const next = language === "en" ? "gu" : "en";
    setLanguage(next);
    window.localStorage.setItem("salon-language", next);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#0B0F17]/90 backdrop-blur-md border-b border-amber-500/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Emblem */}
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient p-0.5 shadow-gold-sm flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
              <Scissors className="w-5 h-5 text-amber-400 group-hover:text-black transition-colors" />
            </div>
          </div>
          <div>
            <span className="font-serif text-xl tracking-wider font-bold text-gold-gradient block leading-none">
              {labels.appName}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-slate-400 block mt-0.5 font-medium">
              {labels.tagline}
            </span>
          </div>
        </Link>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Portal Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{labels.quickNav}</span>
              <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${navOpen ? "rotate-90" : ""}`} />
            </button>

            {navOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl glass-card-gold p-2 shadow-2xl z-50 animate-fade-in"
                onClick={() => setNavOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-amber-400/80 font-bold border-b border-white/10">
                  {labels.quickNav}
                </div>
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <Scissors className="w-4 h-4 text-amber-400" />
                  {labels.navHome}
                </Link>
                <Link
                  to="/join"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  {labels.navJoin}
                </Link>
                <Link
                  to="/reception"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    {labels.navReception}
                  </span>
                  <Lock className="w-3 h-3 text-amber-400/60" />
                </Link>
                <Link
                  to="/barber/Ravi"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-amber-400" />
                    {labels.navBarber}
                  </span>
                  <Lock className="w-3 h-3 text-amber-400/60" />
                </Link>
                <Link
                  to="/display"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <Tv className="w-4 h-4 text-amber-400" />
                  {labels.navDisplay}
                </Link>
                <Link
                  to="/admin"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-amber-400" />
                    {labels.navAdmin}
                  </span>
                  <Lock className="w-3 h-3 text-amber-400/60" />
                </Link>
              </div>
            )}
          </div>

          {/* Bilingual EN / GU Toggle Switch */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 transition-all shadow-gold-sm"
          >
            <span>{language === "en" ? "ગુજરાતી" : "English"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold text-black font-extrabold uppercase">
              {language}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

// -------------------------------------------------------------
// SCREEN 1: HOME (/)
// -------------------------------------------------------------
function Home({ language }: { language: Language }) {
  const labels = languageLabels[language];
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch(`${apiUrl}/home`);
      if (!response.ok) throw new Error();
      setSummary(await response.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const socket = socketClient();
    socket.on("queue:update", () => void load());
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      socket.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  if (loading && !summary) {
    return (
      <main className="min-h-screen px-4 pt-28 pb-12 flex items-center justify-center">
        <div className="glass-card-gold rounded-3xl p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-slate-300 font-medium">{labels.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen px-4 pt-28 pb-12 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-300 font-medium">{labels.error}</p>
          <button
            onClick={() => void load()}
            className="px-6 py-2.5 rounded-full bg-gold font-bold text-black hover:bg-gold-light transition-all"
          >
            {labels.retry}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pt-24 pb-16 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Salon Status Header Card */}
        <section className="glass-card-gold rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-300 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{labels.homeTitle}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
                {labels.appName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">{labels.tagline}</p>
            </div>

            {/* Open / Closed Live Badge */}
            <div className="self-start sm:self-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold shadow-lg ${
                  summary.isOpen
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-500/10"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping ${
                    summary.isOpen ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span>{summary.isOpen ? labels.open : labels.closed}</span>
              </div>
            </div>
          </div>

          {/* Live Queue Metrics Banner */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0B0F17]/70 rounded-2xl p-5 border border-amber-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {summary.waitingCount === 0 ? labels.noWaiting : labels.waitingStatus}
                </p>
                <p className="text-2xl font-bold font-serif text-white mt-0.5">
                  {summary.waitingCount === 0
                    ? labels.walkRightIn
                    : message(labels.waitingLive, { count: summary.waitingCount })}
                </p>
              </div>
            </div>

            <div className="bg-[#0B0F17]/70 rounded-2xl p-5 border border-amber-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {labels.waitingTime}
                </p>
                <p className="text-2xl font-bold font-serif text-white mt-0.5">
                  {summary.estimatedWaitMinutes === null
                    ? labels.unavailableWait
                    : summary.estimatedWaitMinutes === 0
                    ? labels.walkRightIn
                    : message(labels.estimatedWait, { minutes: summary.estimatedWaitMinutes })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Master Stylists Live Availability */}
        <section className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-amber-400/90 flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              <span>Master Stylists On Duty</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.barbers.map((barber) => {
              const isBusy = barber.status === "busy";
              const isBreak = barber.status === "break";
              return (
                <div
                  key={barber.id}
                  className={`rounded-2xl p-4 border transition-all flex items-center gap-3.5 ${
                    isBusy
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : isBreak
                      ? "bg-slate-800/40 border-slate-700 text-slate-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                      isBusy
                        ? "bg-amber-500/20 text-amber-300"
                        : isBreak
                        ? "bg-slate-700 text-slate-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {barber.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{barber.name}</p>
                    <p className="text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isBusy ? "bg-amber-400" : isBreak ? "bg-slate-500" : "bg-emerald-400"
                        }`}
                      />
                      <span>
                        {isBusy ? labels.barberBusy : isBreak ? labels.barberBreak : labels.barberFree}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Closed or Closing Soon Banner */}
        {!summary.joinEnabled && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              {summary.joinMessage === "closingSoon"
                ? labels.closingSoonMessage
                : labels.closedMessage}
            </p>
          </div>
        )}

        {/* Primary Call to Action: Join Queue */}
        <div>
          {summary.joinEnabled ? (
            <Link
              to="/join"
              className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover text-black font-extrabold text-lg shadow-gold hover:shadow-gold-lg transition-all duration-300 transform active:scale-[0.98] no-underline"
            >
              <Sparkles className="w-5 h-5 text-black" />
              <span>{labels.joinQueue}</span>
              <ArrowRight className="w-5 h-5 text-black" />
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-4 px-8 rounded-full bg-slate-800 border border-slate-700 text-slate-500 font-bold text-lg cursor-not-allowed"
            >
              {labels.joinQueue} ({labels.closed})
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// SCREEN 2: JOIN QUEUE (/join)
// -------------------------------------------------------------
function JoinQueue({ language }: { language: Language }) {
  const labels = languageLabels[language];
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [preferred, setPreferred] = useState("");
  const [preview, setPreview] = useState<{
    totalMinutes: number;
    totalPrice: number;
    expectedWaitMinutes: number | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/services`).then((r) => r.json()),
      fetch(`${apiUrl}/barbers`).then((r) => r.json()),
      fetch(`${apiUrl}/home`).then((r) => r.json()),
    ])
      .then(([s, b, h]) => {
        setServices(s);
        setBarbers(b);
        setSummary(h);
      })
      .catch(() => setError(labels.joinError));
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const socket = socketClient();
    socket.on("queue:update", () => {
      Promise.all([
        fetch(`${apiUrl}/services`).then((r) => r.json()),
        fetch(`${apiUrl}/barbers`).then((r) => r.json()),
        fetch(`${apiUrl}/home`).then((r) => r.json()),
      ])
        .then(([s, b, h]) => {
          setServices(s);
          setBarbers(b);
          setSummary(h);
        })
        .catch(() => {});
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch server preview for price, duration, and expected wait
  useEffect(() => {
    if (!selected.length) {
      setPreview(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiUrl}/join/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceIds: selected, preferredBarberId: preferred || null }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error);
          setPreview(null);
        } else {
          setPreview(data);
          setError("");
        }
      } catch {
        setError(labels.joinError);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [selected, preferred]);

  const toggleService = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      if (selected.length >= 3) {
        setError(labels.serviceLimit);
        return;
      }
      setError("");
      setSelected([...selected, id]);
    }
  };

  const submit = async () => {
    if (!name.trim()) return setError(labels.nameRequired);
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) return setError(labels.phoneRequired);
    if (!selected.length) return setError(labels.serviceRequired);

    try {
      setSubmitting(true);
      const response = await fetch(`${apiUrl}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanedPhone,
          serviceIds: selected,
          preferredBarberId: preferred || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || labels.joinError);

      // Play soft chime
      soundManager.playTick();
      navigate(`/status/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : labels.joinError);
    } finally {
      setSubmitting(false);
    }
  };

  const chosenBreak = barbers.find((b) => String(b.id) === preferred)?.onBreak;
  const isJoinDisabled = !summary?.joinEnabled || !!chosenBreak || submitting;

  return (
    <main className="min-h-screen px-4 pt-24 pb-32 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>{labels.back}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            {/* Step 1: Guest Personal Info */}
            <section className="glass-card-gold rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>1. Guest Contact Details</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                    {labels.name}
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Patel"
                      className="w-full bg-[#0B0F17] border border-slate-700 focus:border-amber-400 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                    {labels.phone}
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className="w-full bg-[#0B0F17] border border-slate-700 focus:border-amber-400 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Select Services (Max 3) */}
            <section className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>2. {labels.selectServices}</span>
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  {message(labels.selectedCount, { count: selected.length })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services
                  .filter((s) => s.enabled)
                  .map((service) => {
                    const isSelected = selected.includes(service.id);
                    return (
                      <button
                        type="button"
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-400 shadow-gold-sm"
                            : "bg-[#0B0F17]/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                            {language === "gu" ? service.nameGu : service.nameEn}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-gold border-amber-300 text-black"
                                : "border-slate-700 bg-slate-900"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                            {service.minutes} {labels.minuteUnit}
                          </span>
                          <span className="font-bold text-amber-300 text-sm">
                            ₹{service.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </section>

            {/* Step 3: Choose Stylist */}
            <section className="glass-card rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>3. {labels.chooseBarber}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferred("")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    preferred === ""
                      ? "bg-amber-500/15 border-amber-400 shadow-gold-sm"
                      : "bg-[#0B0F17]/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-sm text-white">{labels.anyBarber}</p>
                  <p className="text-xs text-slate-400 mt-1">Shortest wait time automatically</p>
                </button>

                {barbers
                  .filter((b) => b.onDuty)
                  .map((barber) => (
                    <button
                      type="button"
                      key={barber.id}
                      disabled={barber.onBreak}
                      onClick={() => setPreferred(String(barber.id))}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        preferred === String(barber.id)
                          ? "bg-amber-500/15 border-amber-400 shadow-gold-sm"
                          : barber.onBreak
                          ? "opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800"
                          : "bg-[#0B0F17]/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{barber.name}</span>
                        {barber.onBreak && (
                          <span className="text-[10px] uppercase font-bold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10">
                            {labels.barberBreak}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Senior Master Stylist</p>
                    </button>
                  ))}
              </div>
            </section>
          </div>

          {/* Sticky Live Summary Sidebar */}
          <aside className="space-y-4">
            <div className="glass-card-gold rounded-3xl p-6 lg:sticky lg:top-24 space-y-5">
              <h3 className="font-serif font-bold text-lg text-white border-b border-white/10 pb-3">
                {labels.liveSummary}
              </h3>

              {preview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Total Duration
                    </span>
                    <span className="font-bold text-white">
                      {preview.totalMinutes} {labels.minuteUnit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      {labels.expectedWait.split(":")[0]}
                    </span>
                    <span className="font-bold text-amber-300">
                      ~{preview.expectedWaitMinutes ?? "--"} {labels.minuteUnit}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">Total Price</span>
                    <span className="text-2xl font-serif font-bold text-gold-gradient">
                      ₹{preview.totalPrice}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select at least one service above to preview estimated wait time and total price.
                </p>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-medium">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={isJoinDisabled}
                className="w-full py-4 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover text-black font-extrabold text-base shadow-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                {submitting ? "Reserving..." : labels.confirm}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// SCREEN 3: MY STATUS (/status/:id)
// -------------------------------------------------------------
function StatusPage({ language }: { language: Language }) {
  const labels = languageLabels[language];
  const { id } = useParams();
  const [status, setStatus] = useState<QueueStatusView | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const celebrationFiredRef = useRef(false);

  const load = async () => {
    try {
      const response = await fetch(`${apiUrl}/status/${id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data);
      setCountdown(data.waitMinutes);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : labels.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const socket = socketClient();
    socket.on("queue:update", () => void load());
    const timer = window.setInterval(() => void load(), 12000);
    return () => {
      socket.disconnect();
      window.clearInterval(timer);
    };
  }, [id]);

  // Minute-by-minute countdown timer
  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setInterval(() => {
      setCountdown((curr) => (curr === null ? null : Math.max(0, curr - 1)));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [countdown === null]);

  // Handle Called Turn Alert with Vibration, Chime, and Confetti
  useEffect(() => {
    if (status?.status === "Called" && !celebrationFiredRef.current) {
      celebrationFiredRef.current = true;
      soundManager.playCallChime();
      if ("vibrate" in navigator) {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
      try {
        void confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D4A017", "#FDE047", "#FFFFFF", "#F59E0B"],
        });
      } catch {}
    }
  }, [status?.status]);

  const cancelSpot = async () => {
    if (!window.confirm(labels.cancelConfirm)) return;
    try {
      const response = await fetch(`${apiUrl}/status/${id}/cancel`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data);
      setCancelled(true);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : labels.error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 pt-28 flex items-center justify-center">
        <div className="glass-card-gold rounded-3xl p-8 max-w-sm text-center">
          <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-300 text-sm font-medium">{labels.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !status) {
    return (
      <main className="min-h-screen px-4 pt-28 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold font-serif text-white">{labels.resolvedTitle}</h1>
          <p className="text-sm text-slate-400">This queue token is either completed or invalid.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold font-bold text-black no-underline hover:bg-gold-light"
          >
            {labels.backHome}
          </Link>
        </div>
      </main>
    );
  }

  // CALLED STATE - FULL SCREEN LUXURY GOLD ALERT
  if (status.status === "Called") {
    const barberName = status.assignedBarberName || status.preferredBarberName || "Stylist";
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-gold-gradient px-6 text-center animate-fade-in">
        <div className="max-w-md w-full bg-[#0B0F17]/95 p-8 rounded-3xl border-2 border-amber-300 shadow-2xl space-y-6 animate-pulse-subtle">
          <div className="w-20 h-20 rounded-full bg-gold-gradient mx-auto flex items-center justify-center shadow-gold-lg">
            <Sparkles className="w-10 h-10 text-black" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/20">
              {status.token}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-black text-white mt-3">
              {labels.turnAlert}
            </h1>
            <p className="text-lg font-bold text-amber-300 mt-2">
              {message(labels.goToBarber, { barber: barberName })}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Please walk directly into the styling chair. Your master stylist is ready for you now.
          </p>

          <Link
            to="/"
            className="inline-block w-full py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700"
          >
            {labels.backHome}
          </Link>
        </div>
      </main>
    );
  }

  // IN CHAIR STATE
  if (status.status === "In chair") {
    const barberName = status.assignedBarberName || status.preferredBarberName || "Stylist";
    return (
      <main className="min-h-screen px-4 pt-28 pb-12 flex items-center justify-center">
        <div className="glass-card-gold rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300">
            <Scissors className="w-3.5 h-3.5" />
            {labels.inChairStatus}
          </span>

          <div>
            <p className="text-6xl font-serif font-black text-gold-gradient">{status.token}</p>
            <p className="text-base font-bold text-white mt-2">
              {message(labels.yourBarber, { barber: barberName })}
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#0B0F17]/80 p-4 rounded-2xl border border-white/10">
            {labels.inChairMessage}
          </p>

          <Link
            to="/"
            className="inline-block px-6 py-2.5 rounded-full border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
          >
            {labels.backHome}
          </Link>
        </div>
      </main>
    );
  }

  // CANCELLED OR RESOLVED
  if (cancelled || ["Cancelled", "Done", "No-show"].includes(status.status)) {
    return (
      <main className="min-h-screen px-4 pt-28 pb-12 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-serif font-bold text-white">
            {cancelled ? labels.cancelledTitle : labels.resolvedTitle}
          </h1>
          <p className="text-sm font-bold text-amber-400">{status.token}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold font-bold text-black no-underline"
          >
            {labels.backHome}
          </Link>
        </div>
      </main>
    );
  }

  // WAITING STATUS VIEW
  return (
    <main className="min-h-screen px-4 pt-24 pb-16 text-slate-100">
      <div className="max-w-lg mx-auto glass-card-gold rounded-3xl p-6 sm:p-8 text-center space-y-6 animate-fade-in relative">
        {/* Live sync beacon */}
        <div className="flex items-center justify-between text-xs font-semibold border-b border-white/10 pb-3">
          <span className="text-slate-400">{labels.appName}</span>
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {labels.liveSync}
          </span>
        </div>

        {/* Large Luxury Token */}
        <div>
          <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            {labels.waitingStatus}
          </span>
          <h1 className="text-7xl font-serif font-black text-gold-gradient mt-4 tracking-tight">
            {status.token}
          </h1>
          {status.position && (
            <p className="text-lg font-bold text-white mt-2">
              {message(labels.position, { position: status.position })}
            </p>
          )}
        </div>

        {/* Animated Countdown Dial */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" className="stroke-slate-800 stroke-[6] fill-none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-amber-400 stroke-[6] fill-none stroke-linecap-round transition-all duration-1000"
              strokeDasharray={264}
              strokeDashoffset={countdown ? Math.min(264, Math.max(20, countdown * 5)) : 20}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-serif font-black text-white">{countdown ?? 0}</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              {labels.minuteUnit}
            </span>
          </div>
        </div>

        {/* 2nd in Line Alert Banner */}
        {status.position === 2 && (
          <div className="rounded-2xl bg-amber-500/20 border border-amber-400/50 p-4 text-xs font-bold text-amber-200 animate-pulse">
            {labels.secondPosition}
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">{labels.waitingStatusMessage}</p>

        {/* Cancel Spot Button */}
        {status.status === "Waiting" && (
          <button
            onClick={() => void cancelSpot()}
            className="w-full py-3 rounded-full border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-xs font-bold transition-all"
          >
            {labels.cancelSpot}
          </button>
        )}
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// PIN PROTECTION GATE FOR STAFF ACCESS (Default PIN: 1234)
// -------------------------------------------------------------
function StaffPinGate({
  language,
  children,
}: {
  language: Language;
  children: (pin: string) => React.ReactNode;
}) {
  const labels = languageLabels[language];
  const [pin, setPin] = useState(() => window.sessionStorage.getItem("salon-staff-pin") || "");
  const [entered, setEntered] = useState("");
  const [error, setError] = useState("");

  const unlock = async () => {
    try {
      const response = await fetch(`${apiUrl}/staff/overview`, {
        headers: { "x-staff-pin": entered },
      });
      if (!response.ok) {
        setError(labels.enteredPinInvalid);
        return;
      }
      window.sessionStorage.setItem("salon-staff-pin", entered);
      setPin(entered);
    } catch {
      setError(labels.enteredPinInvalid);
    }
  };

  if (pin) return <>{children(pin)}</>;

  return (
    <main className="min-h-screen px-4 pt-32 pb-16 flex items-center justify-center">
      <div className="glass-card-gold rounded-3xl p-8 max-w-sm w-full space-y-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold text-white">{labels.staffPin}</h1>
          <p className="text-xs text-slate-400 mt-1">{labels.pinPrompt}</p>
        </div>

        <input
          type="password"
          maxLength={8}
          value={entered}
          onChange={(e) => setEntered(e.target.value)}
          placeholder="••••"
          className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-[#0B0F17] border border-slate-700 rounded-xl py-3 text-white focus:outline-none focus:border-amber-400"
        />

        {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

        <button
          onClick={() => void unlock()}
          className="w-full py-3 rounded-full bg-gold font-bold text-black hover:bg-gold-light transition-all"
        >
          {labels.unlock}
        </button>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// SCREEN 4: RECEPTION DASHBOARD (/reception)
// -------------------------------------------------------------
function ReceptionWorkspace({ pin, language }: { pin: string; language: Language }) {
  const labels = languageLabels[language];
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [showWalkIn, setShowWalkIn] = useState(false);

  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInServices, setWalkInServices] = useState<number[]>([]);
  const [walkInBarber, setWalkInBarber] = useState("");
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", "x-staff-pin": pin };

  const load = async () => {
    try {
      const [staffRes, sRes, bRes] = await Promise.all([
        fetch(`${apiUrl}/staff/overview`, { headers: { "x-staff-pin": pin } }),
        fetch(`${apiUrl}/services`),
        fetch(`${apiUrl}/barbers`),
      ]);
      if (!staffRes.ok) throw new Error(labels.enteredPinInvalid);
      setOverview(await staffRes.json());
      setServices(await sRes.json());
      setBarbers(await bRes.json());
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : labels.error);
    }
  };

  useEffect(() => {
    void load();
    const socket = socketClient();
    socket.on("queue:update", () => void load());
    return () => {
      socket.disconnect();
    };
  }, [pin]);

  const request = async (path: string, body?: unknown) => {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || labels.error);
    return data;
  };

  const submitWalkIn = async () => {
    if (!walkInName.trim()) return setError(labels.nameRequired);
    const cleaned = walkInPhone.replace(/\D/g, "");
    if (cleaned.length !== 10) return setError(labels.phoneRequired);
    if (!walkInServices.length) return setError(labels.serviceRequired);

    try {
      await request("/staff/walk-in", {
        name: walkInName.trim(),
        phone: cleaned,
        serviceIds: walkInServices,
        preferredBarberId: walkInBarber || null,
      });
      setShowWalkIn(false);
      setWalkInName("");
      setWalkInPhone("");
      setWalkInServices([]);
      setWalkInBarber("");
      setError("");
    } catch (walkInErr) {
      setError(walkInErr instanceof Error ? walkInErr.message : labels.error);
    }
  };

  return (
    <main className="min-h-screen px-4 pt-24 pb-16 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
          <div>
            <h1 className="text-2xl font-serif font-black text-white">{labels.reception}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Front-Desk Queue Coordinator · Tablet Landscape Optimized
            </p>
          </div>

          <button
            onClick={() => setShowWalkIn(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover text-black font-extrabold text-sm shadow-gold"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{labels.addWalkIn}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Walk-in Guest Modal */}
        {showWalkIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card-gold rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-amber-500/40">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-serif font-bold text-lg text-white">{labels.addWalkIn}</h3>
                <button onClick={() => setShowWalkIn(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={labels.name}
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder={labels.phone}
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                />

                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-2">
                    {labels.selectServices}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {services
                      .filter((s) => s.enabled)
                      .map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() =>
                            setWalkInServices((curr) =>
                              curr.includes(s.id)
                                ? curr.filter((id) => id !== s.id)
                                : curr.length < 3
                                ? [...curr, s.id]
                                : curr
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            walkInServices.includes(s.id)
                              ? "bg-gold text-black border-amber-300"
                              : "bg-[#0B0F17] border-slate-700 text-slate-300"
                          }`}
                        >
                          {language === "gu" ? s.nameGu : s.nameEn} (₹{s.price})
                        </button>
                      ))}
                  </div>
                </div>

                <select
                  value={walkInBarber}
                  onChange={(e) => setWalkInBarber(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="">{labels.anyBarber}</option>
                  {barbers
                    .filter((b) => b.onDuty)
                    .map((b) => (
                      <option key={b.id} value={b.id} disabled={b.onBreak}>
                        {b.name} {b.onBreak ? `(${labels.barberBreak})` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => void submitWalkIn()}
                  className="flex-1 py-3 rounded-full bg-gold font-bold text-black hover:bg-gold-light"
                >
                  {labels.add}
                </button>
                <button
                  onClick={() => setShowWalkIn(false)}
                  className="px-6 py-3 rounded-full border border-slate-700 text-slate-400 hover:text-white"
                >
                  {labels.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {overview && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* Left Column: Stylist Stations */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-amber-400 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                <span>Stylist Chairs</span>
              </h2>

              <div className="space-y-3">
                {overview.barbers.map((barber) => {
                  const calledEntry = overview.called.find((c) => c.barberId === barber.id);
                  const displayCustomer = barber.currentCustomer || calledEntry?.name;
                  const displayToken = barber.currentToken || calledEntry?.token;
                  const elapsed = barber.startedAt
                    ? (Date.now() - new Date(barber.startedAt).getTime()) / 60000
                    : 0;
                  const progress = barber.currentMinutes
                    ? Math.min(100, (elapsed / barber.currentMinutes) * 100)
                    : 0;

                  return (
                    <article
                      key={barber.id}
                      className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-white text-base">
                          {barber.name}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            barber.onBreak
                              ? "bg-slate-700 text-slate-300"
                              : displayCustomer
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {barber.onBreak
                            ? labels.onBreak
                            : displayCustomer
                            ? labels.barberBusy
                            : labels.available}
                        </span>
                      </div>

                      <div className="bg-[#0B0F17]/80 rounded-xl p-3 border border-white/5">
                        <p className="text-xs text-slate-400">{labels.currentCustomer}</p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {displayCustomer ? `${displayToken} · ${displayCustomer}` : labels.noCustomerInChair}
                        </p>

                        {barber.startedAt && (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-400">
                              <span>{labels.timeLeft}</span>
                              <span className="font-bold text-amber-300">
                                {Math.max(0, Math.ceil(barber.currentMinutes - elapsed))} {labels.minuteUnit}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        disabled={barber.onBreak || !barber.onDuty || !!displayCustomer}
                        onClick={() =>
                          void request(`/staff/barbers/${barber.id}/call`).catch((e) =>
                            setError(e.message)
                          )
                        }
                        className="w-full py-2.5 rounded-xl bg-gold font-bold text-black text-xs hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {labels.callNext}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Waiting List & Called Queue */}
            <div className="space-y-6">
              {/* Waiting List */}
              <section className="glass-card rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>{labels.waitingList} ({overview.waiting.length})</span>
                  </h2>
                </div>

                {overview.waiting.length === 0 ? (
                  <p className="py-12 text-center text-slate-400 text-sm">
                    {labels.noOneWaiting}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="py-2.5 px-3">{labels.token}</th>
                          <th className="py-2.5 px-3">{labels.name}</th>
                          <th className="py-2.5 px-3">{labels.services}</th>
                          <th className="py-2.5 px-3">{labels.preferred}</th>
                          <th className="py-2.5 px-3">{labels.waitingTime}</th>
                          <th className="py-2.5 px-3 text-right">{labels.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {overview.waiting.map((entry) => {
                          const waitedMinutes = Math.floor(
                            (Date.now() - new Date(entry.joinedAt).getTime()) / 60000
                          );
                          const isOverSixty = waitedMinutes > 60;
                          return (
                            <tr
                              key={entry.id}
                              className={isOverSixty ? "bg-amber-500/10 text-amber-200" : "hover:bg-white/5"}
                            >
                              <td className="py-3 px-3 font-serif font-black text-amber-300 text-sm">
                                {entry.token}
                              </td>
                              <td className="py-3 px-3 font-semibold text-white">{entry.name}</td>
                              <td className="py-3 px-3 text-slate-300">
                                {entry.services
                                  .map((s) => (language === "gu" ? s.nameGu : s.nameEn))
                                  .join(", ")}
                              </td>
                              <td className="py-3 px-3 text-slate-400">
                                {entry.preferredBarberName || labels.anyBarber}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    isOverSixty
                                      ? "bg-red-500/20 text-red-300 font-bold"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {waitedMinutes} {labels.minuteUnit}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() =>
                                    void request(`/staff/entries/${entry.id}/cancel`).catch((e) =>
                                      setError(e.message)
                                    )
                                  }
                                  className="px-3 py-1 rounded-full border border-slate-700 hover:border-red-400 hover:text-red-300 text-slate-400 text-[11px] font-semibold"
                                >
                                  {labels.cancel}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Called & Late Arrival Handling */}
              {overview.called.length > 0 && (
                <section className="glass-card-gold rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                    Clients Called · Awaiting Arrival
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.called.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-[#0B0F17] rounded-2xl p-4 border border-amber-500/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-serif font-bold text-amber-400 text-base">{entry.token}</p>
                          <p className="text-xs text-white font-semibold">{entry.name}</p>
                          <p className="text-[11px] text-slate-400">Stylist: {entry.barberName}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(labels.confirmNoShow)) {
                              void request(`/staff/entries/${entry.id}/no-show`, {
                                confirmedTenMinutes: true,
                              }).catch((e) => setError(e.message));
                            }
                          }}
                          className="px-3 py-1.5 rounded-full border border-amber-500/60 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold"
                        >
                          {labels.noShow}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Reception({ language }: { language: Language }) {
  return (
    <StaffPinGate language={language}>
      {(pin) => <ReceptionWorkspace pin={pin} language={language} />}
    </StaffPinGate>
  );
}

// -------------------------------------------------------------
// SCREEN 5: BARBER VIEW (/barber/:name)
// -------------------------------------------------------------
function BarberWorkspace({
  pin,
  language,
  routeName,
}: {
  pin: string;
  language: Language;
  routeName: string;
}) {
  const labels = languageLabels[language];
  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [error, setError] = useState("");
  const routeBarberName = decodeURIComponent(routeName);
  const barber = overview?.barbers.find(
    (b) => b.name.toLowerCase() === routeBarberName.toLowerCase()
  );

  const headers = { "Content-Type": "application/json", "x-staff-pin": pin };

  const load = async () => {
    const res = await fetch(`${apiUrl}/staff/overview`, { headers: { "x-staff-pin": pin } });
    if (!res.ok) throw new Error(labels.enteredPinInvalid);
    setOverview(await res.json());
  };

  useEffect(() => {
    void load().catch((e) => setError(e.message));
    const socket = socketClient();
    socket.on("queue:update", () => void load().catch((e) => setError(e.message)));
    return () => {
      socket.disconnect();
    };
  }, [pin]);

  const request = async (path: string, body?: unknown) => {
    const res = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || labels.error);
    return data;
  };

  if (!barber) {
    return (
      <main className="min-h-screen px-4 pt-28 flex items-center justify-center">
        <div className="glass-card rounded-3xl p-8 max-w-sm text-center">
          <p className="text-slate-300 font-semibold">{labels.error}</p>
        </div>
      </main>
    );
  }

  const calledEntry = overview?.called.find((c) => c.barberId === barber.id);
  const nextClient = overview?.waiting.find(
    (w) => w.preferredBarberId === barber.id || w.preferredBarberId === null
  );

  return (
    <main className="min-h-screen px-4 pt-24 pb-16 text-slate-100">
      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Barber Header Card */}
        <section className="glass-card-gold rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold text-black font-serif font-black flex items-center justify-center text-lg">
              {barber.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="font-serif font-black text-xl text-white">{barber.name}</h1>
              <p className="text-xs text-amber-300 font-medium">Master Barber Station</p>
            </div>
          </div>

          <button
            onClick={() =>
              void request(`/staff/barbers/${barber.id}/availability`, {
                onBreak: !barber.onBreak,
              }).catch((e) => setError(e.message))
            }
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              barber.onBreak
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            }`}
          >
            {barber.onBreak ? labels.available : labels.onBreak}
          </button>
        </section>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold">
            {error}
          </div>
        )}

        {/* Chair Work Card */}
        <section className="glass-card rounded-3xl p-6 text-center space-y-5 border border-amber-500/30">
          {barber.currentCustomer ? (
            <>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 px-3 py-1 rounded-full bg-amber-500/20">
                {labels.currentCustomer}
              </span>
              <p className="text-5xl font-serif font-black text-gold-gradient mt-2">
                {barber.currentToken}
              </p>
              <p className="text-lg font-bold text-white">{barber.currentCustomer}</p>

              {barber.startedAt && <LiveTimer startedAt={barber.startedAt} />}

              <button
                onClick={() =>
                  void request(`/staff/barbers/${barber.id}/done/${barber.currentEntryId}`).catch(
                    (e) => setError(e.message)
                  )
                }
                className="w-full py-4 rounded-full bg-gold-gradient text-black font-extrabold text-base shadow-gold hover:shadow-gold-lg transition-all"
              >
                {labels.done}
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 mb-2">
                <Scissors className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-slate-300">{labels.noCustomerInChair}</p>

              {calledEntry && (
                <div className="p-4 rounded-2xl bg-[#0B0F17] border border-amber-500/30 space-y-3">
                  <p className="text-xs text-amber-300 font-semibold">
                    Client Called: {calledEntry.token} · {calledEntry.name}
                  </p>
                  <button
                    onClick={() =>
                      void request(`/staff/barbers/${barber.id}/start/${calledEntry.id}`).catch((e) =>
                        setError(e.message)
                      )
                    }
                    className="w-full py-3.5 rounded-full bg-gold text-black font-extrabold text-sm hover:bg-gold-light"
                  >
                    {labels.start}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Up Next for This Barber Card */}
        <section className="glass-card rounded-2xl p-5 border border-slate-800">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
            {labels.nextForYou}
          </h2>
          {nextClient ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif font-bold text-amber-400 text-lg">{nextClient.token}</p>
                <p className="text-xs text-white font-medium">{nextClient.name}</p>
              </div>
              <span className="text-xs text-slate-400">
                {nextClient.services.map((s) => s.nameEn).join(", ")}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">{labels.noNextCustomer}</p>
          )}
        </section>
      </div>
    </main>
  );
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () =>
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="py-2">
      <span className="text-4xl font-mono font-bold text-amber-300 tracking-wider">
        {mins}:{secs}
      </span>
    </div>
  );
}

function BarberView({ language, name }: { language: Language; name: string }) {
  return (
    <StaffPinGate language={language}>
      {(pin) => <BarberWorkspace pin={pin} language={language} routeName={name} />}
    </StaffPinGate>
  );
}

// -------------------------------------------------------------
// SCREEN 6: WAITING-AREA TV DISPLAY (/display)
// -------------------------------------------------------------
function DisplayScreen({ language }: { language: Language }) {
  const labels = languageLabels[language];
  const [snapshot, setSnapshot] = useState<DisplaySnapshot | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [flashToken, setFlashToken] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const loadDisplay = async () => {
    try {
      const response = await fetch(`${apiUrl}/display`);
      if (!response.ok) throw new Error();
      setSnapshot(await response.json());
    } catch {
      setReconnecting(true);
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const ist = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date());
      setCurrentTime(ist);
    };
    updateClock();
    const clockTimer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    void loadDisplay();
    const socket = socketClient();
    socket.on("connect", () => {
      setReconnecting(false);
      void loadDisplay();
    });
    socket.on("disconnect", () => setReconnecting(true));
    socket.on("reconnect", () => setReconnecting(false));
    socket.on("queue:update", () => void loadDisplay());
    socket.on("queue:called", (called: { token: string }) => {
      setFlashToken(called.token);
      soundManager.playCallChime();
      window.setTimeout(() => setFlashToken(null), 5000);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const enableAudio = () => {
    soundManager.enableAudio();
    soundManager.setMuted(false);
    soundManager.playTick();
    setSoundEnabled(true);
  };

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-[#070A0F] text-white select-none">
      {/* Newly Called Token Gold Flash Overlay */}
      {flashToken && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center animate-fade-in pointer-events-none">
          <div className="bg-gold-gradient text-black px-16 py-10 rounded-[3rem] shadow-gold-lg text-center transform scale-110 animate-bounce">
            <p className="text-xl font-bold uppercase tracking-widest">{labels.calledStatus}</p>
            <p className="text-8xl font-serif font-black mt-2">{flashToken}</p>
          </div>
        </div>
      )}

      {/* Top Banner with Clock & Audio Control */}
      <div className="absolute top-6 left-8 right-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold-gradient p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-[#070A0F] rounded-[14px] flex items-center justify-center">
              <Scissors className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-serif font-black text-gold-gradient tracking-wide">
              {labels.appName}
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-400">
              Executive Lounge Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-amber-300 font-bold">
            {currentTime}
          </div>

          <button
            onClick={enableAudio}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              soundEnabled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-gold text-black border-amber-300 shadow-gold"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "Audio Chime Active" : labels.enableSound}</span>
          </button>
        </div>
      </div>

      {reconnecting && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-black px-6 py-2 rounded-full font-bold text-xs shadow-lg">
          {labels.reconnecting}
        </div>
      )}

      {/* Main Split Screen */}
      <div className="flex w-full h-full pt-28 pb-8 px-8 gap-8">
        {/* Left 65%: Serving Now In Chair */}
        <section className="flex-[3] flex flex-col space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{labels.now}</span>
          </h2>

          <div className="flex-1 grid grid-cols-1 gap-4">
            {snapshot?.barbers.map((barber) => (
              <article
                key={barber.id}
                className="glass-card rounded-3xl p-6 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center font-serif text-3xl font-black text-black">
                    {barber.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-black text-white">{barber.name}</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {barber.currentCustomer
                        ? `Client: ${barber.currentCustomer}`
                        : labels.noCustomerInChair}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {barber.currentToken ? (
                    <div className="px-8 py-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400">
                      <span className="text-xs uppercase tracking-widest text-amber-300 font-bold block">
                        Serving
                      </span>
                      <span className="text-5xl font-serif font-black text-amber-300">
                        {barber.currentToken}
                      </span>
                    </div>
                  ) : (
                    <div className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 font-semibold text-sm">
                      Ready for Call
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Right 35%: Up Next in Queue */}
        <aside className="flex-[2] glass-card rounded-3xl p-6 border border-slate-800 flex flex-col">
          <h2 className="text-base font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" />
            <span>{labels.upNext}</span>
          </h2>

          {snapshot?.upNext.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-lg">
              {labels.queueEmpty}
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              {snapshot?.upNext.map((entry, index) => (
                <div
                  key={entry.token}
                  className="bg-[#0B0F17] rounded-2xl p-4 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="font-serif text-2xl font-black text-white">{entry.token}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {entry.estimatedMinutes === null
                      ? "--"
                      : `~${entry.estimatedMinutes} ${labels.minuteUnit}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

// -------------------------------------------------------------
// SCREEN 7: OWNER SETTINGS (/admin)
// -------------------------------------------------------------
function AdminWorkspace({ pin, language }: { pin: string; language: Language }) {
  const labels = languageLabels[language];
  const [admin, setAdmin] = useState<AdminSnapshot | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    nameEn: "",
    nameGu: "",
    minutes: "30",
    price: "150",
    enabled: true,
  });

  const headers = { "Content-Type": "application/json", "x-staff-pin": pin };

  const loadAdmin = async () => {
    const res = await fetch(`${apiUrl}/staff/admin`, { headers: { "x-staff-pin": pin } });
    if (!res.ok) throw new Error(labels.enteredPinInvalid);
    setAdmin(await res.json());
  };

  useEffect(() => {
    void loadAdmin().catch((e) => setError(e.message));
    const socket = socketClient();
    socket.on("queue:update", () => void loadAdmin().catch((e) => setError(e.message)));
    return () => {
      socket.disconnect();
    };
  }, [pin]);

  const request = async (path: string, method: "POST" | "PUT" | "PATCH", body: unknown) => {
    const res = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || labels.error);
    await loadAdmin();
  };

  const createService = async () => {
    try {
      await request("/staff/services", "POST", {
        nameEn: draft.nameEn.trim(),
        nameGu: draft.nameGu.trim(),
        minutes: Number(draft.minutes),
        price: Number(draft.price),
        enabled: draft.enabled,
      });
      setDraft({ nameEn: "", nameGu: "", minutes: "30", price: "150", enabled: true });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    }
  };

  return (
    <main className="min-h-screen px-4 pt-24 pb-16 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-serif font-black text-white">{labels.admin}</h1>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 font-semibold">
            {error}
          </div>
        )}

        {admin && (
          <>
            {/* Daily Operational KPI Metrics */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {labels.servedToday}
                </p>
                <p className="text-4xl font-serif font-black text-white mt-2">
                  {admin.stats.served}
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {labels.averageWait}
                </p>
                <p className="text-4xl font-serif font-black text-amber-400 mt-2">
                  {admin.stats.averageWait} {labels.minuteUnit}
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  {labels.noShowsToday}
                </p>
                <p className="text-4xl font-serif font-black text-rose-400 mt-2">
                  {admin.stats.noShows}
                </p>
              </div>
            </section>

            {/* Online Joining Switch */}
            <section className="glass-card-gold rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white">{labels.onlineJoining}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable or disable remote bookings from mobile client devices.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void request("/staff/settings/open", "PATCH", { isOpen: !admin.isOpen }).catch(
                    (e) => setError(e.message)
                  )
                }
                className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all ${
                  admin.isOpen
                    ? "bg-gold text-black shadow-gold"
                    : "bg-slate-800 border border-slate-700 text-slate-400"
                }`}
              >
                {admin.isOpen ? labels.open : labels.closed}
              </button>
            </section>

            {/* Services Management & Stylist Duty Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services List & Add Service */}
              <section className="glass-card rounded-3xl p-6 space-y-5 border border-slate-800">
                <h2 className="font-serif font-bold text-lg text-white">{labels.services}</h2>

                <div className="space-y-3">
                  {admin.services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-[#0B0F17] rounded-2xl p-4 border border-slate-800 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          id={`s-en-${service.id}`}
                          defaultValue={service.nameEn}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          id={`s-gu-${service.id}`}
                          defaultValue={service.nameGu}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          id={`s-min-${service.id}`}
                          type="number"
                          defaultValue={service.minutes}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                        <input
                          id={`s-price-${service.id}`}
                          type="number"
                          defaultValue={service.price}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nameEn = (
                              document.getElementById(`s-en-${service.id}`) as HTMLInputElement
                            ).value;
                            const nameGu = (
                              document.getElementById(`s-gu-${service.id}`) as HTMLInputElement
                            ).value;
                            const minutes = Number(
                              (document.getElementById(`s-min-${service.id}`) as HTMLInputElement)
                                .value
                            );
                            const price = Number(
                              (document.getElementById(`s-price-${service.id}`) as HTMLInputElement)
                                .value
                            );
                            void request(`/staff/services/${service.id}`, "PUT", {
                              nameEn,
                              nameGu,
                              minutes,
                              price,
                              enabled: service.enabled,
                            }).catch((e) => setError(e.message));
                          }}
                          className="px-4 py-1.5 rounded-full bg-gold text-black font-bold text-xs"
                        >
                          {labels.save}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void request(`/staff/services/${service.id}/enabled`, "PATCH", {
                              enabled: !service.enabled,
                            }).catch((e) => setError(e.message))
                          }
                          className={`px-4 py-1.5 rounded-full border text-xs font-bold ${
                            service.enabled
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-slate-700 text-slate-500"
                          }`}
                        >
                          {service.enabled ? labels.enabled : labels.closed}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Service Sub-Form */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-amber-400">
                    {labels.createService}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder={labels.nameEn}
                      value={draft.nameEn}
                      onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                      className="bg-[#0B0F17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder={labels.nameGu}
                      value={draft.nameGu}
                      onChange={(e) => setDraft({ ...draft, nameGu: e.target.value })}
                      className="bg-[#0B0F17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder={labels.minutes}
                      value={draft.minutes}
                      onChange={(e) => setDraft({ ...draft, minutes: e.target.value })}
                      className="bg-[#0B0F17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      placeholder={labels.price}
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      className="bg-[#0B0F17] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void createService()}
                    className="w-full py-2.5 rounded-full bg-gold text-black font-bold text-xs hover:bg-gold-light"
                  >
                    + {labels.createService}
                  </button>
                </div>
              </section>

              {/* Stylists On Duty Controls */}
              <section className="glass-card rounded-3xl p-6 space-y-5 border border-slate-800">
                <h2 className="font-serif font-bold text-lg text-white">{labels.barber}</h2>

                <div className="space-y-3">
                  {admin.barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="bg-[#0B0F17] rounded-2xl p-4 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-serif font-bold text-white text-base">{barber.name}</p>
                        <p className="text-xs text-slate-400">
                          {barber.onBreak
                            ? labels.onBreak
                            : barber.onDuty
                            ? labels.available
                            : labels.offDuty}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void request(`/staff/barbers/${barber.id}/duty`, "PATCH", {
                            onDuty: !barber.onDuty,
                          }).catch((e) => setError(e.message))
                        }
                        className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                          barber.onDuty
                            ? "bg-gold text-black shadow-gold-sm"
                            : "bg-slate-800 border border-slate-700 text-slate-400"
                        }`}
                      >
                        {barber.onDuty ? labels.onDuty : labels.offDuty}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function AdminScreen({ language }: { language: Language }) {
  return (
    <StaffPinGate language={language}>
      {(pin) => <AdminWorkspace pin={pin} language={language} />}
    </StaffPinGate>
  );
}

// -------------------------------------------------------------
// MAIN APP ROUTING & PROVIDER
// -------------------------------------------------------------
export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    return (window.localStorage.getItem("salon-language") as Language) || "en";
  });
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col font-sans">
      {location.pathname !== "/display" && (
        <Header language={language} setLanguage={setLanguage} />
      )}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home language={language} />} />
          <Route path="/join" element={<JoinQueue language={language} />} />
          <Route path="/status/:id" element={<StatusPage language={language} />} />
          <Route path="/reception" element={<Reception language={language} />} />
          <Route path="/barber/:name" element={<BarberRoute language={language} />} />
          <Route path="/display" element={<DisplayScreen language={language} />} />
          <Route path="/admin" element={<AdminScreen language={language} />} />
          <Route
            path="*"
            element={
              <main className="min-h-screen px-4 pt-32 text-center">
                <h1 className="text-2xl font-serif font-bold">404 - Page Not Found</h1>
                <Link
                  to="/"
                  className="mt-4 inline-block px-6 py-2 rounded-full bg-gold text-black font-bold"
                >
                  Return to Home
                </Link>
              </main>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function BarberRoute({ language }: { language: Language }) {
  const { name = "" } = useParams();
  return <BarberView language={language} name={name} />;
}
