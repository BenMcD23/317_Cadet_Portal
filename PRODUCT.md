# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cadets of 317 (City of Ely) Squadron, RAF Air Cadets, aged 12–18, mostly on
their own phones. Some adults (staff) also sign in to order their own kit.

## Product Purpose

The cadets' self-service portal: order uniform and badges, see what kit has
been issued, check their inspections, keep their contact details current
(needed for parade-night texts), read squadron documents, and check in to a
classification lesson by scanning its QR code. Success: a cadet finishes an
order or a check-in in under a minute without asking an NCO.

## Positioning

The cadet-facing half of 317's management system: it only ever reads and
writes the signed-in cadet's own record (`/cadets/me`, `/users/me`).

## Operating Context

Phones, often on parade night in the drill hall right after a QR code is put
up, or at home when kit no longer fits. Short sessions. Backend is the SMS
Scrapers API, shared with the staff SMS site (`317_SMS_Site`).

## Capabilities and Constraints

Next.js App Router + shadcn/ui + Tailwind v4. A cadet must never be able to
name someone else's record (test-enforced). Sizes and the badge catalogue
come from the API's `/reference`.

## Brand Commitments

Same 317 Sqn palette as the SMS site (RAF navy primary, dark sidebar). Tone is
friendlier and simpler than the staff site but the same system. The visual
change in progress is a hard refinement of this identity, not a replacement.

## Product Principles

1. Phone first; one thumb, one task per screen.
2. Plain words a 12-year-old understands; no admin jargon.
3. Always show what happens next (order submitted → what NCOs do with it).

## Accessibility & Inclusion

Young users, varied reading ages; large touch targets, clear labels, nothing
conveyed by colour alone.
