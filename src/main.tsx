import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Check from './Check'
import Method from './Method'

/**
 * Three pages, no router library.
 *
 * None of them need params, nested layouts or client-side transitions, so a
 * dependency would be more machinery than the problem has. Navigation between them is ordinary anchors and full page loads,
 * which also means the search index is dropped when you leave the tool rather
 * than sitting in memory while someone reads the essay.
 *
 * vercel.json rewrites /check and /method to this same document so a cold load or a shared
 * ?q= link lands correctly instead of 404ing.
 */
const path = location.pathname.replace(/\/+$/, '')
const Page = path === '/check' ? Check : path === '/method' ? Method : App

/**
 * An ordinary concurrent render.
 *
 * This was wrapped in `flushSync` for a while, and the reason is worth keeping
 * because it is not an obvious thing to have done. The nav indicator used to
 * slide between pages via a cross-document view transition, and the browser
 * captures the new page's named elements at its first rendering opportunity.
 * React's concurrent render can land after that moment: measured at the first
 * animation frame of a fresh navigation, the root still had 0 children and
 * `.nav-indicator` did not exist, so the transition ran with nothing to morph
 * into and the bar just vanished and reappeared.
 *
 * flushSync fixed that by forcing the first render to finish inside this
 * script. It also meant the whole app rendered synchronously, blocking the main
 * thread, to serve one 2px decoration. The transition is gone now (see
 * index.css), so the constraint goes with it and React can schedule normally.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
