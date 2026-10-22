import { describe, expect, it } from "vitest"

import {
  dayLabel,
  errorMessage,
  formatMinutes,
  isSection,
  parseDay,
  sectionStatus,
  sectionsDueThisWeek,
  weekLabel,
} from "@/lib/activity-log"
import { formatDate, todayLocal } from "@/lib/format"
import { activityLog, sectionLog } from "@/tests/activity-log-fixtures"

describe("formatMinutes", () => {
  it.each([
    [45, "45 min"],
    [60, "1 hour"],
    [90, "1 hr 30 min"],
    [120, "2 hours"],
    [135, "2 hr 15 min"],
  ])("%i is %s", (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text)
  })
})

describe("dates", () => {
  it("reads an API date as that local day, not UTC midnight", () => {
    expect(parseDay("2026-03-29").getDate()).toBe(29) // the clocks go forward that night
    expect(dayLabel("2026-10-14")).toBe("Wed 14 Oct")
    expect(weekLabel("2026-10-12")).toBe("Week of 12 Oct")
  })

  it("today is the local day even just after midnight in summer", () => {
    // 00:30 BST on 1 Jul is still 30 Jun in UTC.
    expect(todayLocal(new Date(2026, 6, 1, 0, 30))).toBe("2026-07-01")
  })
})

describe("sectionStatus", () => {
  const day = (iso: string) => formatDate(iso)

  it("asks a cadet with nothing set up to start", () => {
    expect(sectionStatus(null, day)).toEqual({
      label: "Not set up",
      tone: "idle",
      detail: "Tap to choose your activity",
    })
  })

  it("says nothing's done this week and how many weeks to catch up", () => {
    expect(sectionStatus(sectionLog(), day)).toEqual({
      label: "Not done this week",
      tone: "todo",
      detail: "10 of 12 weeks done. 2 weeks to catch up",
    })
  })

  it("counts down the minutes left once some are logged", () => {
    expect(sectionStatus(sectionLog({ this_week_minutes: 45, missed: [] }), day)).toMatchObject({
      label: "15 min to go",
      detail: "10 of 12 weeks done",
    })
  })

  it("is done for the week at an hour, with one week to catch up in the singular", () => {
    const s = sectionStatus(sectionLog({ this_week_minutes: 60, missed: ["2026-08-17"] }), day)
    expect(s).toMatchObject({
      label: "Done this week",
      tone: "done",
      detail: "10 of 12 weeks done. 1 week to catch up",
    })
  })

  it("is finished, or not started yet, with nothing to do", () => {
    expect(sectionStatus(sectionLog({ complete: true }), day).label).toBe("Finished")
    expect(sectionStatus(sectionLog({ started: false, start_date: "2026-11-02" }), day)).toMatchObject({
      label: "Starts 2 Nov 2026",
      tone: "idle",
    })
  })
})

describe("sectionsDueThisWeek", () => {
  it("lists started, unfinished sections still under an hour", () => {
    const log = activityLog({
      skills: sectionLog(),
      volunteering: sectionLog({ this_week_minutes: 60 }),
      physical: sectionLog({ complete: true }),
    })
    expect(sectionsDueThisWeek(log)).toEqual(["skills"])
  })

  it("is empty when the log isn't on, isn't loaded, or nothing's set up", () => {
    expect(sectionsDueThisWeek(activityLog({}, false))).toEqual([])
    expect(sectionsDueThisWeek(undefined)).toEqual([])
    expect(sectionsDueThisWeek(activityLog())).toEqual([])
    expect(sectionsDueThisWeek(activityLog({ skills: sectionLog({ started: false }) }))).toEqual([])
  })
})

describe("errorMessage", () => {
  it("uses the API's words, flattening a validation list", () => {
    expect(errorMessage({ detail: "Too late" }, "x")).toBe("Too late")
    expect(errorMessage({ detail: [{ msg: "Fill this in" }, { msg: "Too long" }] }, "x")).toBe(
      "Fill this in. Too long"
    )
    expect(errorMessage(null, "Fallback")).toBe("Fallback")
    expect(errorMessage({ detail: [{}] }, "Fallback")).toBe("Fallback")
  })
})

it("knows the three sections and nothing else", () => {
  expect(["skills", "volunteering", "physical"].every(isSection)).toBe(true)
  expect(isSection("swimming")).toBe(false)
  expect(isSection(undefined)).toBe(false)
})
