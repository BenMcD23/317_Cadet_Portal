"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader } from "@/components/page-header"
import { ErrorAlert } from "@/components/error-alert"
import { CheckCircle2, MessageSquare, ExternalLink } from "lucide-react"

type Me = {
  cin: number
  name: string
  email: string | null
  phone_number: string
  // Empty until staff have set one — the join card only appears when there is
  // somewhere to send people.
  whatsapp_invite_url: string
}

export default function MyDetailsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [inviteUrl, setInviteUrl] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cadet/me")
        const data = await res.json()
        if (!res.ok) {
          setError(data.detail ?? "Could not load your details.")
          return
        }
        setMe(data)
        setPhone(data.phone_number ?? "")
        setInviteUrl(data.whatsapp_invite_url ?? "")
      } catch {
        setError("Could not reach the server.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // The number on file, so the Save button knows whether anything changed.
  const stored = me?.phone_number ?? ""
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
      setPhone(data.phone_number ?? "")
      setMe((prev) => (prev ? { ...prev, phone_number: data.phone_number ?? "" } : prev))
      setInviteUrl(data.whatsapp_invite_url ?? "")
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

      <ErrorAlert message={error} />

      {loading ? (
        <Skeleton className="h-56" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-muted-foreground" />
              Parade night texts
            </CardTitle>
            <CardDescription>
              This is where the weekly texts about uniform, timings and C Flight go.
              Change it whenever your number changes — no need to tell staff. Leave it
              empty to stop receiving them.
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
                    setPhone(e.target.value)
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
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-3.5" />
                  {phone ? "Saved — you're on the list." : "Saved — you'll no longer get the texts."}
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
            <p className="text-xs text-muted-foreground">
              Name, CIN and email come from the squadron records — speak to staff if any
              of them are wrong.
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
            <CardDescription>
              Optional, and separate from the texts — you&apos;ll still get those either
              way. Open the link on the phone your WhatsApp is on.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-fit">
              <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                Open invite <ExternalLink className="size-3.5" />
              </a>
            </Button>
            <p className="break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
