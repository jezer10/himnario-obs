import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { createPartialResponse } from 'workbox-range-requests'
import { NavigationRoute, registerRoute } from 'workbox-routing'

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

registerRoute(
  ({ url }) => /\/(vocal|instrumental)\/[^/]+$/.test(url.pathname),
  async ({ request }) => {
    const cache = await caches.open('hymnal-audio-v1')
    const saved = await cache.match(request.url)
    if (!saved) return fetch(request)
    // Opaque media can be replayed by <audio>, but its bytes cannot be sliced.
    if (saved.type !== 'opaque' && request.headers.has('range')) {
      return createPartialResponse(request, saved)
    }
    return saved
  },
)
// Updates activate after all existing windows close, avoiding playback interruption.
