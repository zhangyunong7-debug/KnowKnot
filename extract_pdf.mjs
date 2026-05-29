/**
 * Run with: node extract_pdf.mjs <path-to-pdf>
 * e.g.:     node extract_pdf.mjs "D:\knowknot\fb.pdf"
 *
 * Mirrors exactly what route.ts does:
 *   content.items.map(item => item.str).join(' ')   per page, then pages.join('\n\n')
 * Then also runs normalizeText + splitQuestions and prints every detected boundary.
 */

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFileSync } from 'fs'

// ── inline copies of the helpers from split-questions.ts ──────────────────────

function normalizeText(raw) {
  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/。/g, '.')
    .replace(/．/g, '.')
    .replace(/，/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/、/g, '.')

  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/(^|\n)\s*(\d{1,3})\.(\D)/gm, '$1$2. $3')
  text = text.replace(/(^|\n)\s*(\d{1,3})\.(\d{4,})/gm, '$1$2. $3')
  text = text.replace(/(^|\n)\s*([A-D])\.(\S)/gm, '$1$2. $3')
  text = text.replace(/([^\n])\n(\d{1,3})\.\s/g, '$1\n\n$2. ')

  text = text
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  return text
}

function splitQuestions(rawText) {
  const text = normalizeText(rawText)
  if (!text) return []

  const QUESTION_NUMBER_RE = /(?:^|\n)\s*(\d{1,3})\.\s+/gm
  const boundaries = []
  let match

  while ((match = QUESTION_NUMBER_RE.exec(text)) !== null) {
    const order = parseInt(match[1], 10)
    if (order >= 1 && order <= 200) {
      boundaries.push({ index: match.index, order, matchStr: JSON.stringify(match[0]) })
    }
  }

  return { text, boundaries }
}

// ─────────────────────────────────────────────────────────────────────────────

const pdfPath = process.argv[2]
if (!pdfPath) {
  console.error('Usage: node extract_pdf.mjs <path-to-pdf>')
  process.exit(1)
}

const buffer = readFileSync(pdfPath)
const data = new Uint8Array(buffer)

const doc = await getDocument({ data }).promise
console.log(`PDF loaded. Pages: ${doc.numPages}`)
console.log('='.repeat(70))

const pages = []
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i)
  const content = await page.getTextContent()

  // ── show every raw item on this page ──────────────────────────────────────
  console.log(`\n--- PAGE ${i} raw items (${content.items.length} total) ---`)
  content.items.forEach((item, idx) => {
    if (item.str !== undefined) {
      const x = item.transform ? item.transform[4].toFixed(1) : '?'
      const y = item.transform ? item.transform[5].toFixed(1) : '?'
      console.log(`  [${String(idx).padStart(3)}] (x=${x}, y=${y}) hasEOL=${item.hasEOL} str=${JSON.stringify(item.str)}`)
    }
  })

  // ── route.ts joins with ' ' ───────────────────────────────────────────────
  const text = content.items.map((item) => item.str).join(' ')
  console.log(`\n--- PAGE ${i} reconstructed (join with space) ---`)
  console.log(text)

  pages.push(text)
}

const fullText = pages.join('\n\n')

console.log('\n' + '='.repeat(70))
console.log('FULL RAW TEXT (as passed to splitQuestions):')
console.log('='.repeat(70))
console.log(fullText)

console.log('\n' + '='.repeat(70))
console.log('AFTER normalizeText:')
console.log('='.repeat(70))
const { text: normalized, boundaries } = splitQuestions(fullText)
console.log(normalized)

console.log('\n' + '='.repeat(70))
console.log(`DETECTED QUESTION BOUNDARIES (${boundaries.length} found):`)
console.log('='.repeat(70))
boundaries.forEach((b, i) => {
  // show 80 chars of context around the match
  const snippet = normalized.substring(b.index, b.index + 80).replace(/\n/g, '↵')
  console.log(`  [${i + 1}] order=${b.order}  match=${b.matchStr}  context: "${snippet}"`)
})
