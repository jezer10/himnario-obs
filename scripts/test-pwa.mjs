import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { chromium } from '@playwright/test'

// An independent API fixture keeps the offline check reproducible.
const hymn = {
  id: 1,
  number: 1,
  title: 'Himno de prueba',
  mp3Filename: '1.mp3',
  mp3Url: '',
  mp3UrlInstr: '',
  verses: [
    {
      id: 1,
      number: 1,
      contents: [{ id: 1, content: 'Letra disponible sin conexión' }],
    },
  ],
  sequence: [{ id: 1, timestamp: 0, verseId: 1, verseContentId: 1 }],
}
const live = process.argv.includes('--live')
const audio = Buffer.alloc(16044)
audio.write('RIFF')
audio.writeUInt32LE(audio.length - 8, 4)
audio.write('WAVEfmt ', 8)
audio.writeUInt32LE(16, 16)
audio.writeUInt16LE(1, 20)
audio.writeUInt16LE(1, 22)
audio.writeUInt32LE(8000, 24)
audio.writeUInt32LE(16000, 28)
audio.writeUInt16LE(2, 32)
audio.writeUInt16LE(16, 34)
audio.write('data', 36)
audio.writeUInt32LE(16000, 40)
const server = createServer((req, res) => {
  if (!req.url.startsWith('/instrumental/'))
    res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Content-Type',
    req.url.includes('.mp3') ? 'audio/wav' : 'application/json',
  )
  res.end(
    req.url.includes('.mp3')
      ? audio
      : JSON.stringify(req.url === '/hymn' ? [hymn] : hymn),
  )
})
await new Promise((resolve) => server.listen(4174, '127.0.0.1', resolve))
const browser = await chromium.launch(
  process.env.PWA_BROWSER_PATH
    ? { executablePath: process.env.PWA_BROWSER_PATH }
    : { channel: 'chrome' },
)
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  await context.addInitScript((live) => {
    localStorage.setItem(
      'himnario-settings',
      JSON.stringify({
        version: '3.0.2',
        theme: 'dark',
        obsWebsocketUrl: 'localhost:1',
        hymnalApiUrl: live
          ? 'https://himnario-api.qhar.in'
          : 'http://127.0.0.1:4174',
        musicHostUrl: live
          ? 'https://himnario-music.qhar.in'
          : 'http://127.0.0.1:4174',
      }),
    )
  }, live)
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  if (await page.getByRole('dialog').count())
    await page
      .getByRole('button', { name: 'Cerrar', exact: true })
      .last()
      .click()
  const manifest = await page.evaluate(async () =>
    (await fetch(document.querySelector('link[rel="manifest"]').href)).json(),
  )
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.icons.length, 3)
  await page.getByRole('button', { name: 'Configuración', exact: true }).click()
  if (!live) {
    await page
      .getByRole('button', { name: 'Descargar todas las letras', exact: true })
      .click()
    await page
      .getByText('1 himnos guardados para buscar y leer sin conexión.')
      .waitFor()
  }
  await page
    .getByLabel('Himno para guardar con audio', { exact: true })
    .fill('1')
  await page
    .getByRole('button', { name: 'Descargar himno con audio', exact: true })
    .click()
  await page
    .getByText('Himno 1 guardado con letra y audio cantado e instrumental.')
    .waitFor({ timeout: 180_000 })
  mkdirSync('node_modules/.tmp', { recursive: true })
  await page.screenshot({ path: 'node_modules/.tmp/pwa-settings.png' })
  await context.setOffline(true)
  await page.reload()
  if (await page.getByRole('dialog').count())
    await page
      .getByRole('button', { name: 'Cerrar', exact: true })
      .last()
      .click()
  await page
    .getByRole('button', { name: 'Configuración', exact: true })
    .waitFor()
  if (!live) {
    const range = await page.evaluate(async () => {
      const response = await fetch('http://127.0.0.1:4174/vocal/1.mp3', {
        headers: { Range: 'bytes=0-99' },
      })
      return {
        status: response.status,
        bytes: (await response.arrayBuffer()).byteLength,
      }
    })
    assert.deepEqual(range, { status: 206, bytes: 100 })
    const opaquePlayback = await page.evaluate(async () => {
      const player = new Audio('http://127.0.0.1:4174/instrumental/1.mp3')
      await new Promise((resolve, reject) => {
        player.onloadeddata = resolve
        player.onerror = () => reject(new Error('Opaque audio failed offline'))
        player.load()
      })
      return player.duration
    })
    assert.equal(opaquePlayback, 1)
  }
  await page.getByRole('button', { name: /Buscar himno/ }).click()
  await page.getByRole('combobox').fill('1')
  await page.getByRole('combobox').press('Enter')
  if (live) {
    await page.getByRole('heading', { name: /Cantad alegres/i }).waitFor()
    await page
      .getByRole('button', { name: 'Reproducir música', exact: true })
      .click()
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio')
      return audio && audio.currentTime > 0 && !audio.paused
    })
  } else
    await page
      .getByText('Letra disponible sin conexión', { exact: true })
      .waitFor()
  await page.screenshot({ path: 'node_modules/.tmp/pwa-offline.png' })
  console.log(
    live
      ? 'PASS: live servers, both audio downloads, offline reload, hymn search and actual audio playback.'
      : 'PASS: manifest, full catalog download, both audio downloads, offline reload, offline hymn search, audio byte ranges and opaque audio playback.',
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
