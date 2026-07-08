import { Link } from 'react-router-dom'
import HeaderAccueil from '../Header/HeaderAccueil'

const features = [
  {
    title: 'One inbox, all mailboxes',
    description:
      'Connect multiple Gmail accounts and scan them from the same dashboard without losing per-mailbox context.',
  },
  {
    title: 'Labels you can act on',
    description:
      'Every message keeps its category visible, so finance, work, school, games, and alerts are easier to triage.',
  },
  {
    title: 'Designed for daily reading',
    description:
      'Resize or collapse panels on desktop, then open any email in a clean reading view on mobile.',
  },
]

const inboxRows = [
  {
    from: 'Axa Banque',
    subject: 'Votre relevé mensuel est disponible',
    label: 'finance',
    tone: 'bg-emerald-300 text-slate-950',
    time: '15:25',
  },
  {
    from: 'GitHub',
    subject: 'PR checks failed: build / deploy',
    label: 'software engineering',
    tone: 'bg-sky-300 text-slate-950',
    time: '13:51',
  },
  {
    from: 'INP Toulouse',
    subject: 'Re: Projet de groupe — prochaine étape',
    label: 'work/school',
    tone: 'bg-amber-300 text-slate-950',
    time: '08:40',
  },
  {
    from: 'Google',
    subject: 'Alerte de sécurité : nouvelle connexion',
    label: 'security',
    tone: 'bg-rose-300 text-slate-950',
    time: 'Jun 4',
  },
]

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HeaderAccueil showSignupButton />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-4 inline-flex rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-200 shadow-sm">
                Multi-mailbox email dashboard
              </p>
              <h2 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-normal text-white sm:text-5xl lg:text-6xl">
                Keep every mailbox readable from one place.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                FlowRank connects your Gmail mailboxes, syncs their messages, labels what matters,
                and gives you a clean mail app interface for scanning, filtering, and reading.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/create-account"
                  className="rounded-md bg-emerald-400 px-5 py-3 text-center text-base font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-300"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-white/15 bg-white/10 px-5 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:border-white/30 hover:bg-white/15"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
                <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-md bg-linear-to-br from-red-400 via-yellow-300 to-emerald-400" />
                    <span className="text-lg font-bold text-white">FlowRank</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden max-w-[160px] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:inline">
                      alex.martin@gmail.com
                    </span>
                    <span className="h-9 w-9 rounded-full border border-white/10 bg-white/5" />
                  </div>
                </div>

                <div className="grid bg-slate-900 text-slate-100 md:grid-cols-[190px_270px_1fr]">
                  <aside className="hidden border-r border-white/10 bg-slate-950 p-3 md:block">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Mailboxes
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: 'All inboxes', count: '68', active: true },
                        { label: 'alex.martin@gmail.com', count: '51', active: false },
                        { label: 'camille.dupont@outlook.com', count: '17', active: false },
                      ].map((mailbox) => (
                        <div
                          key={mailbox.label}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                            mailbox.active ? 'bg-emerald-400 text-slate-950' : 'text-slate-300'
                          }`}
                        >
                          <span className="truncate font-semibold">{mailbox.label}</span>
                          <span className="ml-2 text-xs font-bold">{mailbox.count}</span>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <section className="border-r border-white/10">
                    <div className="border-b border-white/10 px-4 py-4">
                      <p className="text-xs font-semibold text-emerald-300">FlowRank</p>
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-bold text-white">All inboxes</h3>
                          <p className="text-sm text-slate-400">68 synced messages</p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-white/10">
                      {inboxRows.map((row, index) => (
                        <div
                          key={row.subject}
                          className={`px-4 py-3 ${index === 0 ? 'bg-white/8' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {row.from}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-300">{row.subject}</p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-500">{row.time}</span>
                          </div>
                          <span
                            className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${row.tone}`}
                          >
                            {row.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <article className="hidden bg-slate-950/60 p-5 lg:block">
                    <div className="rounded-lg border border-white/10 bg-slate-950 p-5">
                      <p className="text-xs text-slate-500">July 7, 2026, 15:25</p>
                      <h3 className="mt-2 text-xl font-bold leading-7 text-white">
                        Votre relevé mensuel est disponible
                      </h3>
                      <div className="mt-4 grid gap-2 text-sm text-slate-300">
                        <p>
                          <span className="text-slate-500">From</span> Axa Banque
                        </p>
                        <p>
                          <span className="text-slate-500">Mailbox</span> alex.martin@gmail.com
                        </p>
                      </div>
                      <p className="mt-5 text-sm leading-7 text-slate-300">
                        Messages stay readable with sender, mailbox, labels, and content in one
                        focused view.
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-14 md:py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-300">
                What changes
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                A mail dashboard that matches how you actually triage.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-white/10 bg-white/5 p-6"
                >
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-red-300">
                From mail to action
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Create an account, connect Gmail, start reading.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                'Create your FlowRank account',
                'Connect one or more Gmail boxes',
                'Read from the unified dashboard',
              ].map((step, index) => (
                <div key={step} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <span className="text-sm font-bold text-emerald-300">0{index + 1}</span>
                  <p className="mt-3 text-base font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Landing
