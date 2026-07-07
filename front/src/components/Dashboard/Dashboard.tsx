import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../constants/api";
import FlowRankMark from "../FlowRankMark/FlowRankMark";
import type { ApiLink, DashboardMail } from "./dashboard.types";

type MessageWithKey = DashboardMail & {
  displayKey: string;
};

type DashboardStats = {
  total_count: number;
  by_link: Array<{
    link_id: number;
    count: number;
  }>;
};

const MAILBOX_WIDTH_KEY = "flowrank.mailboxSidebarWidth";
const MAIL_LIST_WIDTH_KEY = "flowrank.mailListWidth";
const MAILBOX_COLLAPSED_KEY = "flowrank.mailboxSidebarCollapsed";
const MAIL_LIST_COLLAPSED_KEY = "flowrank.mailListCollapsed";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const storedNumber = (key: string, fallback: number) => {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
};

const storedBoolean = (key: string) => window.localStorage.getItem(key) === "true";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const decodeAccountEmail = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return "Account";

  try {
    const [, payload] = token.split(".");
    if (!payload) return "Account";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    const parsed = JSON.parse(json) as { sub?: unknown };
    return typeof parsed.sub === "string" ? parsed.sub : "Account";
  } catch {
    return "Account";
  }
};

const mailboxLabel = (link: ApiLink) => link.account_email ?? `${link.provider} mailbox`;

const providerLabel = (provider: string) =>
  provider.length > 0 ? provider[0].toUpperCase() + provider.slice(1) : "Mailbox";

const GearIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 0 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 0 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 0 1 4 0V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
  </svg>
);

const InboxIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 4h16l2 10v6H2v-6L4 4Z" />
    <path d="M2 14h6l2 3h4l2-3h6" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
  </svg>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { linkId: linkIdParam } = useParams<{ linkId: string }>();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const selectedId = useMemo(() => {
    if (!linkIdParam) return null;
    const n = Number.parseInt(linkIdParam, 10);
    return Number.isFinite(n) ? n : null;
  }, [linkIdParam]);

  const [accountEmail] = useState(decodeAccountEmail);
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [mails, setMails] = useState<MessageWithKey[]>([]);
  const [selectedMessageKey, setSelectedMessageKey] = useState<string | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const [mailsLoading, setMailsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ total_count: 0, by_link: [] });
  const [statsLoading, setStatsLoading] = useState(false);
  const [mailboxPanelOpen, setMailboxPanelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileMessageOpen, setMobileMessageOpen] = useState(false);
  const [mailboxSidebarWidth, setMailboxSidebarWidth] = useState(() =>
    clamp(storedNumber(MAILBOX_WIDTH_KEY, 280), 220, 420),
  );
  const [mailListWidth, setMailListWidth] = useState(() =>
    clamp(storedNumber(MAIL_LIST_WIDTH_KEY, 420), 320, 640),
  );
  const [mailboxSidebarCollapsed, setMailboxSidebarCollapsed] = useState(() =>
    storedBoolean(MAILBOX_COLLAPSED_KEY),
  );
  const [mailListCollapsed, setMailListCollapsed] = useState(() =>
    storedBoolean(MAIL_LIST_COLLAPSED_KEY),
  );
  const [removingLinkId, setRemovingLinkId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const requireToken = useCallback((): string | null => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return null;
    }
    return token;
  }, [navigate]);

  const loadLinks = useCallback(async () => {
    const token = requireToken();
    if (!token) return;

    setLinksLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/links/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok || !Array.isArray(data)) {
        const detail =
          typeof data === "object" &&
          data !== null &&
          "detail" in data &&
          typeof (data as { detail: unknown }).detail === "string"
            ? (data as { detail: string }).detail
            : "Could not load linked mailboxes.";
        throw new Error(detail);
      }

      setLinks(data as ApiLink[]);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not load linked mailboxes.");
    } finally {
      setLinksLoading(false);
    }
  }, [navigate, requireToken]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const loadStats = useCallback(async () => {
    const token = requireToken();
    if (!token) return;

    setStatsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (
        !res.ok ||
        typeof data !== "object" ||
        data === null ||
        typeof (data as { total_count?: unknown }).total_count !== "number" ||
        !Array.isArray((data as { by_link?: unknown }).by_link)
      ) {
        throw new Error("Could not load dashboard counters.");
      }

      setStats(data as DashboardStats);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not load dashboard counters.");
    } finally {
      setStatsLoading(false);
    }
  }, [navigate, requireToken]);

  useEffect(() => {
    if (linksLoading) return;
    void loadStats();
  }, [linksLoading, loadStats]);

  useEffect(() => {
    if (linkIdParam && selectedId === null) {
      navigate("/dashboard", { replace: true });
    }
  }, [linkIdParam, selectedId, navigate]);

  useEffect(() => {
    if (selectedId === null || linksLoading) return;

    const linkExists = links.some((link) => link.id === selectedId);
    if (!linkExists) {
      navigate("/dashboard", { replace: true });
    }
  }, [links, linksLoading, navigate, selectedId]);

  useEffect(() => {
    const token = requireToken();
    if (!token || linksLoading) return;

    if (selectedId !== null && !links.some((link) => link.id === selectedId)) {
      return;
    }

    let cancelled = false;
    setMailsLoading(true);
    setErrorMessage("");

    const loadMailboxMessages = async (linkId: number) => {
      const qs = new URLSearchParams({ link_id: String(linkId) });
      const res = await fetch(`${API_BASE}/dashboard/?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as unknown;

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return [];
      }

      if (!res.ok || !Array.isArray(data)) {
        const detail =
          typeof data === "object" &&
          data !== null &&
          "detail" in data &&
          typeof (data as { detail: unknown }).detail === "string"
            ? (data as { detail: string }).detail
            : "Could not load messages.";
        throw new Error(detail);
      }

      return data as DashboardMail[];
    };

    void (async () => {
      try {
        const activeLinks =
          selectedId === null ? links : links.filter((link) => link.id === selectedId);

        if (activeLinks.length === 0) {
          if (!cancelled) {
            setMails([]);
            setSelectedMessageKey(null);
          }
          return;
        }

        const batches = await Promise.all(
          activeLinks.map(async (link) => {
            const rows = await loadMailboxMessages(link.id);
            return rows.map((mail, idx) => ({
              ...mail,
              displayKey:
                mail.provider_message_id ??
                `${link.id}-${mail.received_at ?? "no-date"}-${mail.subject ?? "no-subject"}-${idx}`,
            }));
          }),
        );

        const nextMails = batches
          .flat()
          .sort((a, b) => {
            const aTime = a.received_at ? new Date(a.received_at).getTime() : 0;
            const bTime = b.received_at ? new Date(b.received_at).getTime() : 0;
            return bTime - aTime;
          });

        if (!cancelled) {
          setMails(nextMails);
          setSelectedMessageKey((current) =>
            current && nextMails.some((mail) => mail.displayKey === current)
              ? current
              : nextMails[0]?.displayKey ?? null,
          );
        }
      } catch (e) {
        if (!cancelled) {
          setMails([]);
          setSelectedMessageKey(null);
          setErrorMessage(e instanceof Error ? e.message : "Could not load messages.");
        }
      } finally {
        if (!cancelled) setMailsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [links, linksLoading, navigate, requireToken, selectedId]);

  useEffect(() => {
    window.localStorage.setItem(MAILBOX_WIDTH_KEY, String(mailboxSidebarWidth));
  }, [mailboxSidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem(MAIL_LIST_WIDTH_KEY, String(mailListWidth));
  }, [mailListWidth]);

  useEffect(() => {
    window.localStorage.setItem(MAILBOX_COLLAPSED_KEY, String(mailboxSidebarCollapsed));
  }, [mailboxSidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem(MAIL_LIST_COLLAPSED_KEY, String(mailListCollapsed));
  }, [mailListCollapsed]);

  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!mailboxPanelOpen && !logoutConfirmOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMailboxPanelOpen(false);
        setLogoutConfirmOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [logoutConfirmOpen, mailboxPanelOpen]);

  const selectedMailbox = links.find((link) => link.id === selectedId) ?? null;
  const selectedMessage = mails.find((mail) => mail.displayKey === selectedMessageKey) ?? null;
  const accountInitial = accountEmail.charAt(0).toUpperCase();

  useEffect(() => {
    setMobileMessageOpen(false);
  }, [selectedId]);

  useEffect(() => {
    if (mobileMessageOpen && !selectedMessage) {
      setMobileMessageOpen(false);
    }
  }, [mobileMessageOpen, selectedMessage]);

  const messageCountByLink = useMemo(() => {
    return stats.by_link.reduce<Record<number, number>>((acc, item) => {
      acc[item.link_id] = item.count;
      return acc;
    }, {});
  }, [stats.by_link]);

  const currentMessageCount =
    selectedId === null ? stats.total_count : messageCountByLink[selectedId] ?? 0;
  const displayMessageCount = statsLoading ? mails.length : currentMessageCount;

  const startMailboxResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = mailboxSidebarWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      setMailboxSidebarWidth(clamp(startWidth + moveEvent.clientX - startX, 220, 420));
    };
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.classList.remove("is-column-resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.classList.add("is-column-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const startMailListResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(pointerId);
    const startX = event.clientX;
    const startWidth = mailListWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      setMailListWidth(clamp(startWidth + moveEvent.clientX - startX, 320, 640));
    };
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.classList.remove("is-column-resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.classList.add("is-column-resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const openMessage = (messageKey: string) => {
    setSelectedMessageKey(messageKey);
    setMobileMessageOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteLink = async (linkId: number) => {
    const token = requireToken();
    if (!token) return;

    const link = links.find((item) => item.id === linkId);
    const confirmed = window.confirm(
      `Remove ${link ? mailboxLabel(link) : "this mailbox"} from FlowRank?`,
    );
    if (!confirmed) return;

    setRemovingLinkId(linkId);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/links/${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!res.ok) {
        throw new Error(data.detail ?? "Could not remove mailbox.");
      }

      if (selectedId === linkId) {
        navigate("/dashboard", { replace: true });
      }
      await loadLinks();
      await loadStats();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not remove mailbox.");
    } finally {
      setRemovingLinkId(null);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex min-w-0 items-center gap-3 text-left transition hover:opacity-85"
            aria-label="FlowRank dashboard"
          >
            <FlowRankMark className="h-8 w-auto shrink-0" />
            <span className="bg-gradient-to-r from-red-400 via-yellow-300 to-emerald-400 bg-clip-text text-xl font-bold leading-none text-transparent sm:text-2xl">
              FlowRank
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5 transition hover:border-white/25 hover:bg-white/10 sm:py-1.5 sm:pl-2 sm:pr-4"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-slate-950">
                  {accountInitial}
                </span>
                <span className="hidden max-w-[220px] truncate text-sm font-medium text-slate-100 sm:block">
                  {accountEmail}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-black/40">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    FlowRank account
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-slate-950">
                      {accountInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {accountEmail}
                      </p>
                      <p className="text-xs text-slate-500">
                        {links.length} connected mailbox{links.length === 1 ? "" : "es"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="mt-4 w-full rounded-md border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMailboxPanelOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-100 transition hover:border-white/25 hover:bg-white/10"
              aria-label="Open mailbox settings"
              aria-expanded={mailboxPanelOpen}
            >
              <GearIcon />
            </button>
          </div>
        </div>
      </header>

      {mailboxPanelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6">
          <section className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
              <div>
                <p className="text-sm font-semibold text-emerald-300">Settings</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Mailboxes</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Manage the Gmail mailboxes connected to this FlowRank account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMailboxPanelOpen(false)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[320px_1fr]">
              <aside className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  FlowRank account
                </p>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-base font-bold text-slate-950">
                      {accountInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{accountEmail}</p>
                      <p className="mt-1 text-xs text-slate-500">Signed in account</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-slate-950/70 p-3">
                      <dt className="text-xs text-slate-500">Mailboxes</dt>
                      <dd className="mt-1 text-xl font-bold text-white">{links.length}</dd>
                    </div>
                    <div className="rounded-md bg-slate-950/70 p-3">
                      <dt className="text-xs text-slate-500">Messages</dt>
                      <dd className="mt-1 text-xl font-bold text-white">
                        {statsLoading ? "..." : stats.total_count}
                      </dd>
                    </div>
                  </dl>
                </div>
              </aside>

              <div className="p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Connected mailboxes</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Add another Gmail inbox or remove an existing connection.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/link-account")}
                    className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Add mailbox
                  </button>
                </div>

                <div className="space-y-3">
                  {linksLoading ? (
                    <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
                      Loading mailboxes...
                    </p>
                  ) : links.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-200">
                        No mailbox connected yet.
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Add Gmail to start syncing messages.
                      </p>
                    </div>
                  ) : (
                    links.map((link) => (
                      <div
                        key={link.id}
                        className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold text-white">
                              {mailboxLabel(link)}
                            </p>
                            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-semibold capitalize text-emerald-200">
                              {link.provider}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            {messageCountByLink[link.id] ?? 0} synced message
                            {(messageCountByLink[link.id] ?? 0) === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/${link.id}`)}
                            className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteLink(link.id)}
                            disabled={removingLinkId === link.id}
                            className="rounded-md border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {removingLinkId === link.id ? "Removing" : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50">
            <h2 className="text-xl font-bold text-white">Log out?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              You will leave this FlowRank session and need to sign in again to access
              your mailboxes.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      )}

      <div
        className="grid min-w-0 lg:min-h-[calc(100vh-64px)] lg:[grid-template-columns:var(--dashboard-columns)]"
        style={
          {
            "--dashboard-columns": `${
              mailboxSidebarCollapsed ? 64 : mailboxSidebarWidth
            }px minmax(0,1fr)`,
          } as React.CSSProperties
        }
      >
        <aside className="relative min-w-0 overflow-hidden border-b border-white/10 bg-slate-950 px-3 py-3 lg:overflow-visible lg:border-b-0 lg:border-r lg:px-4 lg:py-4">
          {mailboxSidebarCollapsed && (
            <div className="hidden h-full flex-col items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => setMailboxSidebarCollapsed(false)}
                className="rounded-md border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Open mailbox sidebar"
              >
                <ChevronIcon direction="right" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`rounded-md p-2 transition ${
                  selectedId === null
                    ? "bg-emerald-400 text-slate-950"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                aria-label="All inboxes"
              >
                <InboxIcon />
              </button>
              <button
                type="button"
                onClick={() => setMailboxPanelOpen(true)}
                className="rounded-md p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Manage mailboxes"
              >
                <GearIcon />
              </button>
            </div>
          )}

          <div className={`min-w-0 ${mailboxSidebarCollapsed ? "lg:hidden" : ""}`}>
            <div className="mb-4 hidden items-center justify-between gap-3 lg:flex">
              <span className="text-sm font-semibold text-slate-300">Mailboxes</span>
              <button
                type="button"
                onClick={() => setMailboxSidebarCollapsed(true)}
                className="rounded-md border border-white/10 p-1.5 text-slate-300 transition hover:bg-white/5 hover:text-white"
                aria-label="Close mailbox sidebar"
              >
                <ChevronIcon direction="left" />
              </button>
            </div>

          <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
            <span className="text-sm font-semibold text-slate-300">Mailboxes</span>
            <button
              type="button"
              onClick={() => navigate("/link-account")}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              Add
            </button>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className={`flex min-w-[142px] flex-none items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition lg:w-full lg:min-w-0 ${
                selectedId === null
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <InboxIcon />
                <span className="truncate font-semibold">All inboxes</span>
              </span>
              <span className="text-xs font-semibold">
                {statsLoading ? "..." : stats.total_count}
              </span>
            </button>

            <div className="flex gap-2 lg:block lg:pt-4">
              <p className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 lg:block">
                Connected accounts
              </p>
              {linksLoading ? (
                <p className="px-3 py-3 text-sm text-slate-500">Loading...</p>
              ) : links.length === 0 ? (
                <div className="rounded-md border border-dashed border-white/15 px-3 py-4">
                  <p className="text-sm text-slate-400">No connected mailbox.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/link-account")}
                    className="mt-3 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Link Gmail
                  </button>
                </div>
              ) : (
                links.map((link) => {
                  const active = selectedId === link.id;
                  return (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => navigate(`/dashboard/${link.id}`)}
                      className={`flex min-w-[190px] flex-none items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition lg:mb-1 lg:w-full lg:min-w-0 ${
                        active
                          ? "bg-white text-slate-950"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {mailboxLabel(link)}
                        </span>
                        <span
                          className={`block text-xs capitalize ${
                            active ? "text-slate-600" : "text-slate-500"
                          }`}
                        >
                          {providerLabel(link.provider)}
                        </span>
                      </span>
                      <span className="text-xs font-semibold">
                        {messageCountByLink[link.id] ?? ""}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </nav>
          </div>

          {!mailboxSidebarCollapsed && (
            <button
              type="button"
              onPointerDown={startMailboxResize}
              className="absolute bottom-0 right-[-5px] top-0 hidden w-2 !cursor-col-resize border-r border-transparent transition hover:border-emerald-300/60 lg:block"
              style={{ cursor: "col-resize" }}
              aria-label="Resize mailbox sidebar"
            />
          )}
        </aside>

        <main className="min-w-0 max-w-full bg-slate-900">
          {errorMessage && (
            <div className="border-b border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-100 sm:px-6">
              {errorMessage}
            </div>
          )}

          <section
            className="grid min-w-0 max-w-full lg:min-h-[calc(100vh-64px)] lg:[grid-template-columns:var(--message-columns)]"
            style={
              {
                "--message-columns": `${
                  mailListCollapsed ? 56 : mailListWidth
                }px minmax(0,1fr)`,
              } as React.CSSProperties
            }
          >
            {mailListCollapsed && (
              <div className="hidden border-r border-white/10 bg-slate-900 lg:flex lg:flex-col lg:items-center lg:gap-3 lg:py-4">
                <button
                  type="button"
                  onClick={() => setMailListCollapsed(false)}
                  className="rounded-md border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                  aria-label="Open message list"
                >
                  <ChevronIcon direction="right" />
                </button>
                <span className="mt-2 [writing-mode:vertical-rl] text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Messages
                </span>
              </div>
            )}

            <div
              className={`relative min-w-0 max-w-full border-b border-white/10 lg:border-b-0 lg:border-r ${
                mailListCollapsed ? "lg:hidden" : ""
              } ${mobileMessageOpen ? "hidden lg:block" : ""}`}
            >
              <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-sm font-semibold text-emerald-300">
                  {selectedMailbox ? providerLabel(selectedMailbox.provider) : "FlowRank"}
                </p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                      {selectedMailbox ? mailboxLabel(selectedMailbox) : "All inboxes"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                      {mailsLoading
                        ? "Loading messages..."
                        : `${displayMessageCount} synced message${
                            displayMessageCount === 1 ? "" : "s"
                          }`}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={() => setMailListCollapsed(true)}
                      className="hidden rounded-md border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white lg:block"
                      aria-label="Close message list"
                    >
                      <ChevronIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/link-account")}
                      className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                      Add mailbox
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-y-visible lg:max-h-[calc(100vh-178px)] lg:overflow-y-auto">
                {mailsLoading ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-400">
                    Loading messages...
                  </p>
                ) : mails.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-medium text-slate-200">No messages yet.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Connect a mailbox or wait for the next sync to populate this view.
                    </p>
                  </div>
                ) : (
                  mails.map((mail) => {
                    const active = selectedMessageKey === mail.displayKey;
                    const preview = (mail.body ?? "").trim();
                    return (
                      <button
                        key={mail.displayKey}
                        type="button"
                        onClick={() => openMessage(mail.displayKey)}
                        className={`block w-full overflow-hidden border-b border-white/10 px-4 py-3 text-left transition sm:px-6 sm:py-4 ${
                          active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white [overflow-wrap:anywhere]">
                              {mail.sender_email ?? "Unknown sender"}
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-slate-200 [overflow-wrap:anywhere]">
                              {mail.subject ?? "No subject"}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatDate(mail.received_at)}
                          </span>
                        </div>
                        <p className="mt-2 hidden text-sm leading-6 text-slate-400 [overflow-wrap:anywhere] sm:line-clamp-2">
                          {preview || "No preview available."}
                        </p>
                        {(mail.labels ?? []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3">
                            {(mail.labels ?? []).map((label) => (
                              <span
                                key={label.name}
                                className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-950"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {!mailListCollapsed && (
                <button
                  type="button"
                  onPointerDown={startMailListResize}
                  className="absolute bottom-0 right-[-5px] top-0 hidden w-2 !cursor-col-resize border-r border-transparent transition hover:border-emerald-300/60 lg:block"
                  style={{ cursor: "col-resize" }}
                  aria-label="Resize message list"
                />
              )}
            </div>

            {mobileMessageOpen && selectedMessage && (
              <article className="min-w-0 bg-slate-950 px-4 py-4 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMessageOpen(false)}
                  className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  <ChevronIcon direction="left" />
                  Back
                </button>

                <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                  <div className="border-b border-white/10 px-4 py-4">
                    <p className="text-xs text-slate-500">
                      {formatDate(selectedMessage.received_at)}
                    </p>
                    <h1 className="mt-2 text-xl font-bold leading-7 text-white [overflow-wrap:anywhere]">
                      {selectedMessage.subject ?? "No subject"}
                    </h1>
                    <div className="mt-4 grid gap-2 text-sm text-slate-300">
                      <p className="[overflow-wrap:anywhere]">
                        <span className="text-slate-500">From</span>{" "}
                        {selectedMessage.sender_email ?? "Unknown sender"}
                      </p>
                      <p className="[overflow-wrap:anywhere]">
                        <span className="text-slate-500">Mailbox</span>{" "}
                        {mailboxLabel(
                          links.find((link) => link.id === selectedMessage.link_id) ?? {
                            id: selectedMessage.link_id,
                            provider: "mail",
                          },
                        )}
                      </p>
                    </div>
                    {(selectedMessage.labels ?? []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(selectedMessage.labels ?? []).map((label) => (
                          <span
                            key={label.name}
                            className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-950"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="whitespace-pre-line px-4 py-5 text-sm leading-7 text-slate-300 [overflow-wrap:anywhere]">
                    {(selectedMessage.body ?? "").trim() || "No content available."}
                  </div>
                </section>
              </article>
            )}

            <article className="hidden min-w-0 bg-slate-950/45 lg:block">
              {selectedMessage ? (
                <div className="mx-auto max-w-4xl px-8 py-8">
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-6 shadow-xl shadow-black/20">
                    <div className="border-b border-white/10 pb-5">
                      <p className="text-sm text-slate-400">
                        {formatDate(selectedMessage.received_at)}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-white [overflow-wrap:anywhere]">
                        {selectedMessage.subject ?? "No subject"}
                      </h2>
                      <div className="mt-4 grid gap-2 text-sm text-slate-300">
                        <p>
                          <span className="text-slate-500">From</span>{" "}
                          {selectedMessage.sender_email ?? "Unknown sender"}
                        </p>
                        <p>
                          <span className="text-slate-500">Mailbox</span>{" "}
                          {mailboxLabel(
                            links.find((link) => link.id === selectedMessage.link_id) ?? {
                              id: selectedMessage.link_id,
                              provider: "mail",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="prose prose-invert mt-6 max-w-none whitespace-pre-line text-sm leading-7 text-slate-300 [overflow-wrap:anywhere]">
                      {(selectedMessage.body ?? "").trim() || "No content available."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-8">
                  <div className="max-w-sm text-center">
                    <p className="text-lg font-semibold text-white">Select a message</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Choose a message from the list to preview its contents.
                    </p>
                  </div>
                </div>
              )}
            </article>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
