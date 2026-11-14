import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

// Original vector artwork lives in public/favicon.svg; all PNGs derive from it.
const svg = readFileSync('public/favicon.svg', 'utf8')
mkdirSync('public/icons', { recursive: true })
for (const [name, size] of [
  ['icon-192', 192],
  ['icon-512', 512],
  ['apple-touch-icon', 180],
]) {
  writeFileSync(
    `public/icons/${name}.png`,
    new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng(),
  )
}
const maskable = svg
  .replace('rx="112"', 'rx="0"')
  .replace('<path', '<g transform="translate(51.2 51.2) scale(.8)"><path')
  .replace('</svg>', '</g></svg>')
writeFileSync('public/icons/icon-maskable-512.png', new Resvg(maskable).render().asPng())
