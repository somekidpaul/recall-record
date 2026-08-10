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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
