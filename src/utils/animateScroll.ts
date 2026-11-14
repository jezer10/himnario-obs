/** Animate from the current scroll position; cancellation leaves it in place. */
export function animateScroll(viewport: HTMLElement, target: number, duration = 560) {
  const start = viewport.scrollTop
  const started = performance.now()
  let frame = 0
  const tick = (now: number) => {
    const progress = Math.min(1, Math.max(0, (now - started) / duration))
    viewport.scrollTop = start + (target - start) * (1 - Math.pow(1 - progress, 4))
    frame = progress < 1 ? requestAnimationFrame(tick) : 0
  }
  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}
