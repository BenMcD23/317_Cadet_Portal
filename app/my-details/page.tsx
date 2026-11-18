"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@317/ui-common/components/ui/card"
import { Button } from "@317/ui-common/components/ui/button"
import { Input } from "@317/ui-common/components/ui/input"
import { Label } from "@317/ui-common/components/ui/label"
import { Skeleton } from "@317/ui-common/components/ui/skeleton"
import { Spinner } from "@317/ui-common/components/ui/spinner"
import { PageHeader } from "@317/ui-common/components/page-header"
import { EmptyState } from "@317/ui-common/components/empty-state"
import { ErrorAlert } from "@317/ui-common/components/error-alert"
import { useCadetMe, useSetCadetMe } from "@/lib/cadet-me"
import { CheckCircle2, MessageSquare, ExternalLink, UserRound } from "lucide-react"

export default function MyDetailsPage() {
  const { data: me, error: loadError, isPending: loading } = useCadetMe()
  const setMe = useSetCadetMe()
  // What's typed in the box; null until the cadet edits it, so it shows the
  // number on file (which can arrive after the first render).
  const [typed, setTyped] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // The number on file, so the Save button knows whether anything changed.
  const stored = me?.phone_number ?? ""
  const phone = typed ?? stored
  const inviteUrl = me?.whatsapp_invite_url ?? ""
  const dirty = phone.trim() !== stored

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/cadet/phone-number", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail ?? "Could not save your number.")
        return
      }
      // Into the shared record, so Home stops asking for a number straight away.
      setMe((prev) =>
        prev
          ? {
              ...prev,
              phone_number: data.phone_number ?? "",
              whatsapp_invite_url: data.whatsapp_invite_url ?? prev.whatsapp_invite_url,
            }
          : prev
      )
      setTyped(null)
      setSaved(true)
    } catch {
      setError("Could not reach the server.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader
        title="My Details"
        description="Keep your mobile number up to date so you get the parade night texts"
      />

      <ErrorAlert message={error ?? loadError?.message ?? null} />

      {loading ? (
        <Skeleton className="h-56" />
      ) : loadError ? null : me === null ? (
        // An adult volunteer signed in: there is no cadet record to hold a number.
        <EmptyState
          icon={UserRound}
          title="No cadet record"
          description="Your sign-in isn't linked to a cadet record, so there's no number to set here."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="text-muted-foreground size-4" />
              Parade night texts
            </CardTitle>
            <CardDescription>
              This is for the weekly texts. Change it whenever your number changes - no need to tell staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="07700 900000"
                  value={phone}
                  onChange={(e) => {
                    setTyped(e.target.value)
                    setSaved(false)
                  }}
                  className="max-w-xs"
                />
                <Button onClick={save} disabled={saving || !dirty}>
                  {saving && <Spinner />}
                  Save
                </Button>
              </div>
              {saved && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="size-3.5" />
                  {stored ? "Saved — you're on the list." : "Saved — you'll no longer get the texts."}
                </p>
              )}
            </div>

            {me && (
              <dl className="grid gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{me.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">CIN</dt>
                  <dd className="font-mono">{me.cin}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate">{me.email ?? "—"}</dd>
                </div>
              </dl>
            )}
            <p className="text-muted-foreground text-xs">
              Name, CIN and email come from the squadron records — speak to staff if any of them are wrong.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Offered once there's a number saved — the texts are the thing that
          reaches everyone, and the community is the extra on top. Hidden when
          staff haven't set a link, so it's never a dead end. */}
      {!loading && stored && inviteUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join the WhatsApp community</CardTitle>
            <CardDescription>Open the link on the phone your WhatsApp is on.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-fit">
              <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                Open invite <ExternalLink className="size-3.5" />
              </a>
            </Button>
            <p className="text-muted-foreground font-mono text-xs break-all">{inviteUrl}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
