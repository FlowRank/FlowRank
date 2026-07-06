import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import HeaderAccueil from "../Header/HeaderAccueil";
import { API_BASE } from "../../constants/api";
import type { ApiLink, DashboardMail } from "./dashboard.types";

/** Trailing slashes on route paths: FastAPI otherwise 307s to an absolute host and breaks the Vite proxy + Bearer. */

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { linkId: linkIdParam } = useParams<{ linkId: string }>();

  const selectedId = useMemo(() => {
    if (!linkIdParam) return null;
    const n = Number.parseInt(linkIdParam, 10);
    return Number.isFinite(n) ? n : null;
  }, [linkIdParam]);

  const [links, setLinks] = useState<ApiLink[]>([]);
  const [mails, setMails] = useState<DashboardMail[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [mailsLoading, setMailsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requireToken = useCallback((): string | null => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return null;
    }
    return token;
  }, [navigate]);

  useEffect(() => {
    const token = requireToken();
    if (!token) return;

    let cancelled = false;
    setLinksLoading(true);
    setErrorMessage("");

    void (async () => {
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

        if (!cancelled) {
          setLinks(data as ApiLink[]);
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMessage(e instanceof Error ? e.message : "Could not load linked mailboxes.");
        }
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, requireToken]);

  useEffect(() => {
    if (selectedId === null) {
      setMails([]);
      return;
    }

    const token = requireToken();
    if (!token) return;

    const linkExists = links.some((l) => l.id === selectedId);
    if (!linksLoading && !linkExists) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (linksLoading) return;

    let cancelled = false;
    setMailsLoading(true);
    setErrorMessage("");

    void (async () => {
      try {
        const qs = new URLSearchParams({ link_id: String(selectedId) });
        const res = await fetch(`${API_BASE}/dashboard/?${qs.toString()}`, {
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
              : "Could not load messages.";
          throw new Error(detail);
        }

        if (!cancelled) {
          setMails(data as DashboardMail[]);
        }
      } catch (e) {
        if (!cancelled) {
          setMails([]);
          setErrorMessage(e instanceof Error ? e.message : "Could not load messages.");
        }
      } finally {
        if (!cancelled) setMailsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, links, linksLoading, navigate, requireToken]);

  useEffect(() => {
    if (linkIdParam && selectedId === null) {
      navigate("/dashboard", { replace: true });
    }
  }, [linkIdParam, selectedId, navigate]);

  const handleRowClick = (id: number) => {
    navigate(`/dashboard/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <HeaderAccueil hideConnexionButton />
      <div className="border-b border-white/10 bg-slate-900/80 px-4 py-3 md:px-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-white">Dashboard</span>
            <Link
              to="/link-account"
              className="text-emerald-400 underline-offset-2 hover:text-emerald-300 hover:underline"
            >
              Link another account
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-16">
        {errorMessage && (
          <p className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Linked mailboxes</h2>
          <p className="mb-4 text-sm text-slate-400">
            Mailboxes FlowRank can read from (Gmail today). Choose a row to load its messages below.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Link</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Mailbox address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {linksLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                      Loading mailboxes…
                    </td>
                  </tr>
                ) : links.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                      No linked mailbox yet.{" "}
                      <Link to="/link-account" className="text-emerald-400 hover:underline">
                        Link Gmail
                      </Link>
                      .
                    </td>
                  </tr>
                ) : (
                  links.map((row) => {
                    const active = selectedId === row.id;
                    return (
                      <tr
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(row.id)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            handleRowClick(row.id);
                          }
                        }}
                        className={
                          active
                            ? "cursor-pointer bg-emerald-900/40 ring-1 ring-inset ring-emerald-500/40"
                            : "cursor-pointer hover:bg-white/5"
                        }
                      >
                        <td className="px-4 py-3 font-mono text-emerald-300">{row.id}</td>
                        <td className="px-4 py-3 capitalize">{row.provider}</td>
                        <td className="px-4 py-3">{row.account_email ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-white">Messages</h2>
          {selectedId === null ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-4 py-12 text-center text-sm text-slate-400">
              Pick a mailbox in the table above to see its synced messages.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">Preview</th>
                      <th className="px-4 py-3 font-medium">Labels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {mailsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Loading messages…
                        </td>
                      </tr>
                    ) : mails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No messages for this mailbox yet.
                        </td>
                      </tr>
                    ) : (
                      mails.map((mail, idx) => {
                        const preview = (mail.body ?? "").trim();
                        const key =
                          mail.provider_message_id ??
                          `${mail.subject ?? "no-subject"}-${idx}`;
                        return (
                          <tr key={key} className="hover:bg-white/5">
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                              {formatDate(mail.received_at)}
                            </td>
                            <td className="max-w-[240px] px-4 py-3 font-medium text-white">
                              {mail.subject ?? "—"}
                            </td>
                            <td className="max-w-[180px] truncate px-4 py-3 text-slate-300">
                              {mail.sender_email ?? "—"}
                            </td>
                            <td className="max-w-md truncate px-4 py-3 text-slate-400" title={preview}>
                              {preview || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(mail.labels ?? []).length === 0 ? (
                                  <span className="text-slate-500">—</span>
                                ) : (
                                  (mail.labels ?? []).map((label) => (
                                    <span
                                      key={label.name}
                                      className="rounded-full px-2 py-0.5 text-xs font-medium text-slate-900"
                                      style={{ backgroundColor: label.color }}
                                    >
                                      {label.name}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
