/*
 * Keeps the components this portal shares with the staff SMS site identical.
 *
 * The two apps are separate repos with separate builds, so a shared package
 * would mean a third repo to version and publish for a handful of files.
 * Instead the SMS site's copy is the source and this checks ours against it
 * (`npm run shared:check`, run in CI) or copies it over (`npm run shared:sync`).
 * Formatting differs (the site uses semicolons), so each file is run through
 * this repo's prettier config before comparing; `components/ui` is
 * prettier-ignored here and compared as is.
 *
 * Source: the SMS site's `main` on GitHub (it's public), or a local checkout
 * with `--from ../317_SMS_Site`, for a change that spans both repos and isn't
 * merged yet.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { format, resolveConfig } from "prettier"

/** Shared files. Add one here only once both copies match. */
export const SHARED = [
  "components/order-disclosure.tsx",
  "components/order-disclosure.test.tsx",
  "components/responsive-dialog.tsx",
  "components/responsive-dialog.test.tsx",
  "components/empty-state.tsx",
  "components/error-alert.tsx",
  "components/page-header.tsx",
  "components/section-heading.tsx",
  "lib/utils.ts",
  ...[
    "alert",
    "avatar",
    "badge",
    "button",
    "card",
    "checkbox",
    "dialog",
    "drawer",
    "dropdown-menu",
    "empty",
    "input-group",
    "input",
    "label",
    "select",
    "separator",
    "sheet",
    "sidebar",
    "skeleton",
    "spinner",
    "textarea",
    "tooltip",
  ].map((name) => `components/ui/${name}.tsx`),
]

const RAW = "https://raw.githubusercontent.com/BenMcD23/317_SMS_Site/main/"
const ROOT = new URL("..", import.meta.url).pathname

/** @param {string | null} from @param {string} path */
async function readSource(from, path) {
  if (from) return readFileSync(join(from, path), "utf8")
  // A fetch that fails throws: an unreachable GitHub must never pass as "no drift".
  const res = await fetch(RAW + path)
  if (!res.ok) throw new Error(`${RAW + path} answered ${res.status}`)
  return res.text()
}

/**
 * The site's file as it should look in this repo.
 *
 * @param {string | null} from
 * @param {string} path
 */
export async function expected(from, path) {
  const source = await readSource(from, path)
  if (path.startsWith("components/ui/")) return source
  // Always this repo's prettier config, wherever the file is being written.
  const filepath = join(ROOT, path)
  const options = await resolveConfig(filepath)
  return format(source, { ...options, filepath })
}

/**
 * The shared files whose copy here differs from the source's (`from`, a local
 * checkout, or GitHub when null). With `write`, also overwrites them.
 *
 * @param {{ from?: string | null, write?: boolean, files?: string[], root?: string }} [options]
 * @returns {Promise<string[]>}
 */
export async function findDrift({ from = null, write = false, files = SHARED, root = ROOT } = {}) {
  const drifted = []
  for (const path of files) {
    const want = await expected(from, path)
    let have = null
    try {
      have = readFileSync(join(root, path), "utf8")
    } catch {
      // Missing here: --write creates it; a check reports it.
    }
    if (have === want) continue
    drifted.push(path)
    if (write) writeFileSync(join(root, path), want)
  }
  return drifted
}

async function main() {
  const args = process.argv.slice(2)
  const write = args.includes("--write")
  const fromIndex = args.indexOf("--from")
  const from = fromIndex >= 0 ? args[fromIndex + 1] : null
  const source = from ? `${from} (local checkout)` : "the SMS site's main on GitHub"

  const drifted = await findDrift({ from, write })

  if (!drifted.length) {
    console.log(`${SHARED.length} shared files match ${source}.`)
    return
  }
  if (write) {
    console.log(`Updated from ${source}:\n${drifted.map((p) => `  ${p}`).join("\n")}`)
    return
  }
  console.error(
    `These files differ from ${source}:\n${drifted.map((p) => `  ${p}`).join("\n")}\n\n` +
      "They're shared with the SMS site. Make the change there first, then " +
      "`npm run shared:sync` here. While both pull requests are open, check against " +
      "the site's branch with `npm run shared:check -- --from ../317_SMS_Site`."
  )
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
