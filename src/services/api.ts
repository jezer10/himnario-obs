const Fetch = async (endpoint: string) => {
  const cache =
    typeof caches !== 'undefined'
      ? await caches.open('hymnal-data-v1').catch(() => undefined)
      : undefined
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(12_000),
    })
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`)
    if (!response.ok) return response
    // Only persist valid JSON, never an error page returned by a proxy.
    await response.clone().json()
    await cache?.put(endpoint, response.clone()).catch(() => undefined)
    return response
  } catch (error) {
    const saved = await cache?.match(endpoint)
    if (saved) return saved
    throw error
  }
}

export default Fetch
