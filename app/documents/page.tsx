import type { Metadata } from "next"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Download } from "lucide-react"

export const metadata: Metadata = {
  title: "Documents — 317 Cadet Portal",
  description: "Forms, publications and exam resources for cadets and parents.",
}

type Doc = { name: string; link: string }

const forms: Doc[] = [
  { name: "TG 21 - Consent Form", link: "/documents/forms/TG Form 021.docx" },
  { name: "TG 23 - Medical Form", link: "/documents/forms/TG Form 023.docx" },
  { name: "Aviation Medical Form", link: "/documents/forms/ACO Av Med Form 1.xlsx" },
]

const publications: Doc[] = [
  { name: "ACP 1 - Ethos and Core Values", link: "/documents/publications/ACP 001.docx" },
  { name: "ACP 1358 - Uniform and Dress", link: "/documents/publications/ACP 1358.pdf" },
  { name: "ACP 18 - Shooting", link: "/documents/publications/ACP 018 Vol 3.pdf" },
  { name: "ACP 2 - Cultural and Religious Diversity", link: "/documents/publications/ACP 002.docx" },
  { name: "ACP 3 - Honours and Awards", link: "/documents/publications/ACP 003.docx" },
  { name: "ACP 4 - Child Protection", link: "/documents/publications/ACP 004.docx" },
  { name: "ACP 48 - Junior NCO", link: "/documents/publications/ACP 048.docx" },
  { name: "ACP 49 - Senior NCO", link: "/documents/publications/ACP 049.docx" },
  { name: "AP 818 - RAF Drill and Ceremonial", link: "/documents/publications/AP818.pdf" },
]

const examResources: { title: string; badge: string; items: Doc[] }[] = [
  {
    title: "First Class",
    badge: "/documents/first_class/first_class_badge.png",
    items: [
      { name: "ACP 31-2 - The RAF", link: "/documents/first_class/ACP 31-2.pdf" },
      { name: "ACP 31-4 - Initial Expedition Training (IET)", link: "/documents/first_class/ACP 31-4.pdf" },
      { name: "ACP 32-1 - Map Reading", link: "/documents/first_class/ACP 32-1.pdf" },
      { name: "ACP 33-1 - History of Flight", link: "/documents/first_class/ACP 33-1.pdf" },
      { name: "ACP 34-1 - Airmanship 1", link: "/documents/first_class/ACP 34-1.pdf" },
      { name: "The History of the ATC", link: "/documents/first_class/History of the ATC.pptx" },
    ],
  },
  {
    title: "Leading",
    badge: "/documents/leading/leading_badge.png",
    items: [
      { name: "ACP 32-2 - Basic Navigation", link: "/documents/leading/ACP 32-2.pdf" },
      { name: "ACP 33-2 - Principles of Flight (POF)", link: "/documents/leading/ACP 33-2.pdf" },
      { name: "ACP 34-2 - Airmanship 2", link: "/documents/leading/ACP 34-2.pdf" },
    ],
  },
  {
    title: "Senior/Master",
    badge: "/documents/senior-master/senior_master_badge.png",
    items: [
      { name: "ACP 32-3 - Air Navigation", link: "/documents/senior-master/ACP 32-3.pdf" },
      { name: "ACP 32-4 - Pilot Navigation", link: "/documents/senior-master/ACP 32-4.pdf" },
      { name: "ACP 33-3 - Propulsion", link: "/documents/senior-master/ACP 33-3.pdf" },
      { name: "ACP 33-4 - Airframes", link: "/documents/senior-master/ACP 33-4.pdf" },
      { name: "ACP 34-3 - Aircraft Handling", link: "/documents/senior-master/ACP 34-3.pdf" },
      { name: "ACP 34-4 - Operation Flying", link: "/documents/senior-master/ACP 34-4.pdf" },
      { name: "ACP 35-3 - Advanced Radio and Radar", link: "/documents/senior-master/ACP 35-3.pdf" },
      { name: "ACP 35-4 - Satellite Communication", link: "/documents/senior-master/ACP 35-4.pdf" },
    ],
  },
]

function fileType(link: string): string {
  const ext = link.split(".").pop()?.toLowerCase() ?? ""
  return ["pdf", "docx", "xlsx", "pptx"].includes(ext) ? ext.toUpperCase() : "FILE"
}

function DocList({ items }: { items: Doc[] }) {
  return (
    <Card className="divide-y p-0">
      {items.map((item) => (
        <a
          key={item.name}
          href={encodeURI(item.link)}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5"
        >
          <span className="flex w-12 shrink-0 items-center justify-center self-stretch rounded bg-primary text-center text-xs font-bold text-primary-foreground sm:w-14">
            {fileType(item.link)}
          </span>
          <span className="grow text-sm font-medium">{item.name}</span>
          <Download className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </a>
      ))}
    </Card>
  )
}

export default function DocumentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <PageHeader
        title="Documents"
        description="Forms, publications and exam resources for cadets and parents."
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-xl font-semibold">Forms</h2>
        <DocList items={forms} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-center text-xl font-semibold">Publications</h2>
        <DocList items={publications} />
      </section>

      <h2 className="text-center text-2xl font-bold">Exam Resources</h2>
      {examResources.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <h3 className="text-center text-xl font-semibold">{group.title}</h3>
          <div className="flex justify-center">
            <Image src={group.badge} alt={`${group.title} badge`} width={128} height={128} className="h-24 w-auto md:h-32" />
          </div>
          <DocList items={group.items} />
        </section>
      ))}
    </div>
  )
}
