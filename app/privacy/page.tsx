import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy notice · 317 Cadet Portal",
  description: "What information 317 Squadron holds about cadets, why, and for how long.",
}

/** Bump whenever the wording changes, so readers can tell what they agreed to. */
const LAST_UPDATED = "15 October 2026"

/** How long nightly database backups are kept; matches DB_BACKUP_RETENTION in the API. */
const BACKUP_DAYS = 14

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-muted-foreground flex flex-col gap-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-border flex flex-col divide-y rounded-lg border">
      {rows.map(([term, detail]) => (
        <div key={term} className="flex flex-col gap-1 p-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
          <dt className="text-foreground font-medium">{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  )
}

// Public on purpose: parents read this too, and they don't have accounts.
// auth.config.ts lets it through signed out, and the app shell renders it bare.
export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 pb-16 sm:px-6">
      <header className="flex flex-col gap-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the Cadet Portal
        </Link>
        <div className="flex items-center gap-3">
          <Image src="/317_logo.png" alt="" width={40} height={40} className="object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">317 (Failsworth) Squadron</p>
            <p className="text-muted-foreground text-xs">Royal Air Force Air Cadets</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Privacy notice</h1>
          <p className="text-muted-foreground text-sm">Last updated {LAST_UPDATED}</p>
        </div>
        <p className="text-sm leading-relaxed">
          This explains what information 317 Squadron keeps about cadets in our squadron management system and
          this Cadet Portal, why we keep it, who we share it with and how long we keep it. It is written for
          cadets and their parents or guardians. If anything here doesn&apos;t make sense, ask any member of
          staff.
        </p>
      </header>

      <Section title="Who we are">
        <p>
          317 (Failsworth) Squadron is part of the Royal Air Force Air Cadets (RAFAC). RAFAC keeps your main
          cadet record on its own systems, Bader (SMS) and the Volunteer Portal, and has its own privacy
          notice for them. The squadron keeps a working copy of some of that information, plus a few records
          of its own, so staff can run parade nights, orders and training. This notice covers that copy.
        </p>
        <p>
          To ask a question or use any of your rights below, speak to any member of staff on a parade night or
          contact the Officer Commanding through the squadron.
        </p>
      </Section>

      <Section title="What we hold about you">
        <Rows
          rows={[
            [
              "About you",
              "Your name, cadet number (CIN), date of birth, rank, flight, classification and the dates you passed each one, and the date you joined.",
            ],
            [
              "Contact details",
              "Your squadron (@317atc.co.uk) email address, and your mobile number if you add it on the My Details page.",
            ],
            [
              "Training and activities",
              "Your qualifications and when they expire, your attendance register, absences you book (with the reason given), events you are booked on, theory lessons you have completed, and your flying and simulator history.",
            ],
            [
              "Medical and allergy information",
              "Allergies, how severe they are and whether you carry an auto-injector, and any dietary needs. See the next section.",
            ],
            [
              "Things staff record",
              "Uniform inspection scores and comments, assessment marks and sheets, short notes staff and cadet NCOs write about how you are getting on, whether flying paperwork (TG 21, TG 23, aviation medical form) has been handed in, and a note if you are not allowed on events.",
            ],
            [
              "For cadet NCOs",
              "NCO appraisals written by staff, and the session plans you write with staff feedback on them.",
            ],
            [
              "Uniform and badges",
              "What you have ordered, your sizes, and what kit you have been given and when.",
            ],
            [
              "Squadron statistics",
              "Regular snapshots of every cadet's rank, flight, classification and badges, so we can see how the squadron is progressing over time.",
            ],
          ]}
        />
      </Section>

      <Section title="Medical and allergy information">
        <p>
          We don&apos;t ask you for this. We copy it from your Bader record, where it was given to RAFAC when
          you joined. If it is wrong, it needs correcting on Bader. Ask staff and they will help.
        </p>
        <p>
          We use it for one thing only: so staff can check before an event that the right medical, allergy and
          dietary information is in place for everyone going. Only squadron staff can see it. Cadet NCOs
          cannot, and it is never sent to the AI services listed below.
        </p>
        <p>
          Medical information is &quot;special category&quot; data under UK data protection law, so it gets
          extra protection. We rely on it being needed to safeguard children taking part in activities.
        </p>
      </Section>

      <Section title="Why we hold it">
        <p>
          We use your information to run the squadron: taking attendance, planning parade nights and events,
          tracking training and qualifications, handing out uniform and badges, and sending parade-night text
          messages if you have given us your number.
        </p>
        <p>
          The legal basis is the RAF Air Cadets&apos; public task of running the cadet organisation, and the
          squadron&apos;s legitimate interest in running parade nights and activities safely. Text messages
          rely on your choice to add your number. You can remove it on the My Details page at any time and the
          messages stop.
        </p>
        <p>
          No decisions about you are made automatically by a computer. Where an AI service helps draft
          something, a member of staff reads and edits it first.
        </p>
      </Section>

      <Section title="Where it comes from">
        <p>
          Most of it comes from your RAFAC records on Bader and the Volunteer Portal, which the system reads
          automatically. The rest comes from you (orders, your phone number) or from staff and NCOs at the
          squadron (inspections, assessments, appraisals).
        </p>
      </Section>

      <Section title="Who we share it with">
        <Rows
          rows={[
            [
              "RAF Air Cadets",
              "Completed assessment sheets are uploaded to your Bader record, and uniform orders sent to RAFAC include your name.",
            ],
            [
              "Google",
              `Squadron accounts, email and calendars run on Google Workspace. A backup of the system is stored on Google Drive each night, encrypted so Google cannot read it.`,
            ],
            [
              "GOV.UK Notify",
              "Sends parade-night text messages. It receives your mobile number and the message.",
            ],
            ["Vercel", "Hosts this Cadet Portal, in London."],
            [
              "AI services",
              "When staff write an NCO appraisal, the NCO's name, age, attendance and the staff member's notes are sent to an AI service (NVIDIA, Google Gemini or Groq) to draft the wording. When staff analyse inspection results, names are replaced with codes before anything is sent.",
            ],
          ]}
        />
        <p>
          Google, NVIDIA and Groq are based in the United States, so some information is processed there under
          the safeguards their terms provide. The squadron system itself runs on a server managed by the
          squadron. We never sell your information or use it for advertising.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your information while you are a member of the squadron. When you leave, your record is
          removed from our system the next time it updates from Bader, and from our backups within{" "}
          {BACKUP_DAYS} days. RAFAC&apos;s own records on Bader are kept under RAFAC&apos;s rules, not ours.
        </p>
      </Section>

      <Section title="Your rights">
        <p>You, or your parent or guardian, can ask us to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>give you a copy of the information we hold about you</li>
          <li>correct anything that is wrong</li>
          <li>delete information we don&apos;t need to keep</li>
          <li>stop or limit how we use it, or object to us using it</li>
        </ul>
        <p>
          We will reply within one month. If you are unhappy with how we have handled your information, you
          can complain to the Information Commissioner&apos;s Office (ICO) at{" "}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            className="text-foreground underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            ico.org.uk/make-a-complaint
          </a>{" "}
          or on 0303 123 1113.
        </p>
      </Section>
    </div>
  )
}
