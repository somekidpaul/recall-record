import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
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
 * RENDERED SYNCHRONOUSLY, and the nav's page indicator depends on it.
 *
 * index.html ships `<div id="root"></div>` and nothing else, so every pixel
 * here is built by React. `root.render()` on its own schedules that work
 * concurrently, which means it can land after the browser's first rendering
 * opportunity. Measured: at the first animation frame of a fresh navigation the
 * root still had 0 children and `.nav-indicator` did not exist.
 *
 * That is fatal for a cross-document view transition. The browser captures the
 * NEW page's named elements at that first opportunity, so it found no
 * `nav-indicator` to morph the old one into. The transition still "ran", which
 * is why every check of the CSS came back correct, but with no destination the
 * bar simply vanished and reappeared. It looked like nothing was animating,
 * because as far as the indicator was concerned, nothing was.
 *
 * flushSync forces the first render to complete during this script, before that
 * frame. Measured after: 1 child and the indicator present. Now there are two
 * ends to interpolate between.
 */
const root = createRoot(document.getElementById('root')!)
flushSync(() => {
  root.render(
    <StrictMode>
      <Page />
    </StrictMode>,
  )
})
