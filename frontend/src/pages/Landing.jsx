import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, User, Building2, ShieldCheck } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

const points = [
  { x: 30, y: 104, label: "Mar '25" },
  { x: 117, y: 80, label: "Aug '25" },
  { x: 203, y: 72, label: "Jan '26" },
  { x: 290, y: 49, label: "Jun '26" },
];

const TrendCard = () => (
  <div className="rounded-2xl border border-border-hairline bg-bg-card p-6 shadow-soft">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-heading text-sm font-semibold text-text-heading">Creatinine</p>
        <p className="text-xs text-text-muted">Serum · mg/dL · last 4 reports</p>
      </div>
      <span className="rounded-full bg-warning-light px-3 py-1 text-xs font-medium text-warning">
        Rising within range
      </span>
    </div>

    <div className="mt-4 flex items-baseline gap-2">
      <span className="font-heading text-3xl font-bold text-text-heading">1.28</span>
      <span className="text-sm text-text-muted">of 1.35 upper limit</span>
    </div>

    <svg viewBox="0 0 320 150" className="mt-2 w-full" role="img" aria-labelledby="trend-title trend-desc">
      <title id="trend-title">Creatinine across four lab reports</title>
      <desc id="trend-desc">
        Creatinine rises from 0.94 to 1.28 mg/dL across four reports, flattening briefly before
        climbing toward the 1.35 upper limit while staying inside the normal range.
      </desc>

      <g className="trend-threshold">
        <line
          x1="24"
          y1="38"
          x2="296"
          y2="38"
          stroke="var(--color-warning)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.55"
        />
        <text x="296" y="31" textAnchor="end" fontSize="10" fill="var(--color-text-muted)">
          upper limit 1.35
        </text>
      </g>

      <polyline
        className="trend-line"
        points="30,104 117,80 203,72 290,49"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={p.label}
          className="trend-dot"
          style={{ animationDelay: `${0.5 + i * 0.28}s` }}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill={i === points.length - 1 ? 'var(--color-warning)' : 'var(--color-bg-card)'}
          stroke={i === points.length - 1 ? 'var(--color-warning)' : 'var(--color-primary)'}
          strokeWidth="2.5"
        />
      ))}

      {points.map((p, i) => (
        <text
          key={`${p.label}-x`}
          x={p.x}
          y="140"
          textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          fontSize="10"
          fill="var(--color-text-muted)"
        >
          {p.label}
        </text>
      ))}
    </svg>

    <p className="mt-3 border-t border-border-hairline pt-3 text-sm text-text-secondary">
      Every one of these four reports came back marked normal.
    </p>
  </div>
);

const steps = [
  {
    title: 'Upload your reports',
    body: 'PDF or a photo of the printout, from any lab. Old reports count — the more history, the clearer the direction.',
  },
  {
    title: 'Values get matched across labs',
    body: 'The same marker appears under different names and units at different labs. Parchi reconciles them, and a person confirms the extracted values before anything is stored.',
  },
  {
    title: 'See where each marker is heading',
    body: 'Every marker is plotted across your reports with its distance to the normal limit, so drift shows up as a direction instead of a surprise.',
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1440px] px-6 pt-16 pb-24 md:px-10">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                Within-range drift detection
              </span>

              <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.12] text-text-heading md:text-5xl">
                Every report was normal,{' '}
                <span className="text-primary">The trend wasn't.</span>
              </h1>

              <p className="mt-5 max-w-md text-lg leading-normal text-text-secondary">
                A value can climb for two years and still be stamped normal on every report. Parchi
                reads your past lab reports and tracks each marker over time, so you and your doctor
                see the direction it is moving.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 font-medium text-white shadow-soft transition-colors hover:bg-primary-dark"
                >
                  Upload a report <ArrowRight size={18} />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center justify-center rounded-xl border border-border-hairline bg-bg-card px-7 py-4 font-medium text-text-main transition-colors hover:border-primary hover:text-primary"
                >
                  See how it works
                </a>
              </div>

              <p className="mt-5 text-sm text-text-muted">
                Parchi shows direction from your past reports. It does not diagnose.
              </p>
            </div>

            <TrendCard />
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-16 border-y border-border-hairline bg-bg-card py-24"
        >
          <div className="mx-auto max-w-[1440px] px-6 md:px-10">
            <h2 className="max-w-xl font-heading text-3xl font-bold text-text-heading">
              Three reports in, one direction out
            </h2>
            <p className="mt-3 max-w-xl text-text-secondary">
              Trend detection needs history. Parchi works with the reports you already have sitting
              in a folder or a WhatsApp thread.
            </p>

            <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 lg:gap-16">
              {steps.map((step, i) => (
                <li key={step.title} className="border-t-2 border-primary-light pt-5">
                  <span className="font-mono text-sm font-medium text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-2 font-heading text-lg font-semibold text-text-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Audience split */}
        <section className="py-24">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 md:px-10 lg:grid-cols-2">
            <div
              id="for-clinics"
              className="scroll-mt-20 rounded-2xl border border-border-hairline bg-bg-card p-8 lg:p-10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-light">
                <Building2 size={20} className="text-secondary" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold text-text-heading">For clinics</h3>
              <p className="mt-3 max-w-lg text-text-secondary">
                Keep a patient list, upload their reports, verify the extracted values, and generate
                a one-page brief before the consult. Nothing is flagged until a human signs off on
                the numbers behind it.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-text-secondary">
                <li>Patient list linked by clinic code</li>
                <li>Verification step on every extracted value</li>
                <li>eGFR, HbA1c and ACR computed to KDIGO and ADA criteria</li>
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-all hover:gap-2.5"
              >
                Set up a clinic account <ArrowRight size={15} />
              </Link>
            </div>

            <div
              id="for-you"
              className="scroll-mt-20 rounded-2xl bg-primary p-8 text-white lg:p-10"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <User size={20} className="text-white" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold text-white">For you</h3>
              <p className="mt-3 max-w-lg text-white/85">
                Every report you have collected, in one place, with each marker explained in plain
                language and diet and activity suggestions built around what is actually moving.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                <li>Your full report history, searchable</li>
                <li>Plain-language reading for every marker</li>
                <li>General guidance only — check it against your own conditions and your doctor</li>
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white transition-all hover:gap-2.5"
              >
                Start with your reports <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-border-hairline bg-bg-card py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <ShieldCheck size={28} className="mx-auto text-primary" />
            <h2 className="mt-4 font-heading text-3xl font-bold text-text-heading">
              Bring the reports you already have
            </h2>
            <p className="mt-3 text-text-secondary">
              Three past reports are enough to see a direction. Below that, Parchi tells you it does
              not have enough to say anything yet.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 font-medium text-white shadow-soft transition-colors hover:bg-primary-dark"
            >
              Upload a report <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
