/* Swift Client site: themes, Zip, downloads, small interactions. No dependencies, no build. */
const REPO = 'HeatzyV2/swift-client'
const root = document.documentElement
const $ = (sel, ctx = document) => ctx.querySelector(sel)
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)]
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------------------------------------------------------------- themes
// The same eleven themes as the launcher. c1 = canvas, c2 = accent (only used for the little swatches).
const THEMES = [
  { id: 'swift', name: 'Swift', c1: '#0a0b0d', c2: '#2e7cff' },
  { id: 'oled', name: 'OLED', c1: '#000000', c2: '#2e7cff' },
  { id: 'nether', name: 'Nether', c1: '#2b120e', c2: '#e8590c' },
  { id: 'end', name: "L'End", c1: '#1c1329', c2: '#b983ff' },
  { id: 'warden', name: 'Warden', c1: '#0d1a20', c2: '#4cc9c0' },
  { id: 'plains', name: 'Plaines', c1: '#1a2216', c2: '#7cb342' },
  { id: 'ocean', name: 'Océan', c1: '#0d2a31', c2: '#3ab6b0' },
  { id: 'desert', name: 'Désert', c1: '#2b2213', c2: '#e0a84c' },
  { id: 'cherry', name: 'Cerisier', c1: '#241620', c2: '#f4a6c1' },
  { id: 'lush', name: 'Luxuriant', c1: '#152418', c2: '#5cd68a' },
  { id: 'frozen', name: 'Gelé', c1: '#132229', c2: '#8fd8f0' },
]

function currentTheme() {
  const id = root.dataset.theme
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

function setTheme(id, save = true) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]
  root.dataset.theme = theme.id
  if (save) {
    try { localStorage.setItem('swift.site.theme', theme.id) } catch { /* storage unavailable */ }
  }
  $('[data-theme-swatch]')?.style.setProperty('--c', theme.c2)
  $$('.theme-opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeId === theme.id)))
  const meta = $('meta[name="theme-color"]')
  if (meta) meta.content = theme.c1
  // Zip is drawn in the accent colour: redraw him with the new one
  requestAnimationFrame(() => zip?.redraw())
}

function themeButton(t) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'theme-opt'
  b.dataset.themeId = t.id
  b.setAttribute('aria-pressed', 'false')
  b.style.setProperty('--c1', t.c1)
  b.style.setProperty('--c2', t.c2)
  b.innerHTML = `<span class="chip"></span><span>${t.name}</span>`
  b.addEventListener('click', () => setTheme(t.id))
  return b
}

const pop = $('[data-theme-pop]')
const grid = $('[data-theme-grid]')
THEMES.forEach((t) => {
  pop?.append(themeButton(t))
  grid?.append(themeButton(t))
})

const picker = $('[data-theme-picker]')
const toggle = $('[data-theme-toggle]')
toggle?.addEventListener('click', (e) => {
  e.stopPropagation()
  const open = picker.classList.toggle('open')
  toggle.setAttribute('aria-expanded', String(open))
})
document.addEventListener('click', (e) => {
  if (picker && !picker.contains(e.target)) {
    picker.classList.remove('open')
    toggle?.setAttribute('aria-expanded', 'false')
  }
})

// ---------------------------------------------------------------- colours
function hexToRgb(hex) {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a, b, t) {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`
}
function accentRgb() {
  const v = getComputedStyle(root).getPropertyValue('--accent')
  return v ? hexToRgb(v) : [46, 124, 255]
}

// ---------------------------------------------------------------- Zip
class Zip {
  constructor(wrap) {
    this.wrap = wrap
    this.canvas = $('[data-zip-canvas]', wrap)
    this.bubble = $('[data-zip-bubble]', wrap)
    this.ctx = this.canvas.getContext('2d')
    this.pose = 'idle'
    this.frame = 'idle'
    this.asleep = false
    this.running = false
    this.tipIndex = 0
    this.lastActivity = Date.now()
    this.tips = [
      'Salut ! Moi, c’est Zip.',
      'Dans le launcher, Ctrl+K fait tout très vite.',
      'Les touches 1 à 8 changent de page.',
      'Essaie le mode Boost sur une instance.',
      'Choisis un thème en haut : tout le site change.',
      'Clique encore, je cours !',
    ]
    wrap.addEventListener('click', () => this.onClick())
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.onClick()
      }
    })
    for (const ev of ['mousemove', 'keydown', 'scroll', 'touchstart']) {
      window.addEventListener(ev, () => this.wake(), { passive: true })
    }
    this.redraw()
    this.say(this.tips[0], 4200)
    setInterval(() => this.tick(), 1000)
    this.scheduleBlink()
  }

  colours() {
    const a = accentRgb()
    return {
      K: '#000000',
      B: `rgb(${a.join(',')})`,
      D: mix(a, [0, 0, 0], 0.38),
      L: mix(a, [255, 255, 255], 0.55),
      S: '#ffd6b0',
      W: '#ffffff',
      Y: '#ffd23f',
      P: '#ff7896',
      O: '#ff9a1f',
    }
  }

  redraw() {
    const { w, h, frames } = window.ZIP
    const rows = frames[this.frame] ?? frames.idle
    const col = this.colours()
    this.ctx.clearRect(0, 0, w, h)
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = col[row[x]]
        if (c) {
          this.ctx.fillStyle = c
          this.ctx.fillRect(x, y, 1, 1)
        }
      }
    })
  }

  setFrame(name) {
    if (this.frame !== name) {
      this.frame = name
      this.redraw()
    }
  }

  say(text, ms = 5200) {
    this.bubble.textContent = text
    this.bubble.hidden = false
    clearTimeout(this.bubbleTimer)
    this.bubbleTimer = setTimeout(() => { this.bubble.hidden = true }, ms)
  }

  scheduleBlink() {
    setTimeout(() => {
      if (!this.asleep && !this.running) {
        this.setFrame('sleep')
        setTimeout(() => { if (!this.asleep && !this.running) this.setFrame('idle') }, 140)
      }
      this.scheduleBlink()
    }, 2600 + Math.random() * 3200)
  }

  tick() {
    if (!this.asleep && !this.running && Date.now() - this.lastActivity > 25000) {
      this.asleep = true
      this.wrap.classList.remove('bob')
      this.setFrame('sleep')
      this.say('z z z', 60000)
    }
  }

  wake() {
    this.lastActivity = Date.now()
    if (this.asleep) {
      this.asleep = false
      this.wrap.classList.add('bob')
      this.setFrame('idle')
      this.say('Hé, te revoilà !', 2600)
    }
  }

  onClick() {
    if (this.running) return
    this.wake()
    const tip = this.tips[this.tipIndex % this.tips.length]
    const last = this.tipIndex % this.tips.length === this.tips.length - 1
    this.tipIndex++
    this.say(tip)
    if (last) setTimeout(() => this.dash(), 700)
  }

  /** Runs across the mockup with speed lines, then pops back in his corner. */
  dash() {
    if (this.running || reduceMotion) return
    this.running = true
    this.wrap.classList.remove('bob')
    this.wrap.classList.add('running')
    this.bubble.hidden = true
    const host = this.wrap.parentElement
    const distance = host.getBoundingClientRect().width + 80
    let phase = 0
    const stride = setInterval(() => {
      phase ^= 1
      this.setFrame(phase ? 'runB' : 'runA')
    }, 140)
    const anim = this.wrap.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${distance}px)` }],
      { duration: 1100, easing: 'steps(22, end)' },
    )
    anim.onfinish = () => {
      clearInterval(stride)
      this.wrap.classList.remove('running')
      this.wrap.classList.add('bob')
      this.setFrame('idle')
      this.running = false
      this.wrap.animate(
        [{ opacity: 0, transform: 'translateY(8px) scale(0.9)' }, { opacity: 1, transform: 'translateY(-3px) scale(1.04)' }, { opacity: 1, transform: 'none' }],
        { duration: 280, easing: 'steps(6, end)' },
      )
      this.say('C’était rapide, non ?', 3600)
    }
  }
}

const zipEl = $('[data-zip]')
const zip = zipEl && window.ZIP ? new Zip(zipEl) : null

// ---------------------------------------------------------------- the mock's avatar head (a generic 8x8 face)
const FACE = [
  '33333333',
  '33333333',
  '31111113',
  '1ssssss1',
  'sbssssbs',
  'sssnnsss',
  'sssmmsss',
  'ssssssss',
]
const FACE_COLOURS = { 1: '#6b4a2b', 3: '#4a321c', s: '#f0c39a', b: '#3a6df0', n: '#d49a74', m: '#a8634a' }
const faceCanvas = $('[data-face]')
if (faceCanvas) {
  const g = faceCanvas.getContext('2d')
  FACE.forEach((row, y) => [...row].forEach((k, x) => {
    g.fillStyle = FACE_COLOURS[k] ?? '#f0c39a'
    g.fillRect(x, y, 1, 1)
  }))
}

// ---------------------------------------------------------------- downloads
// Links point at the latest GitHub release; without the API (offline, rate limit) they fall back to the
// releases page already set in the HTML.
const ASSETS = {
  'win-exe': (n) => /_x64-setup\.exe$/i.test(n),
  'win-msi': (n) => /\.msi$/i.test(n),
  'mac-arm': (n) => /_aarch64\.dmg$/i.test(n),
  'mac-x64': (n) => /_x64\.dmg$/i.test(n),
  'linux-appimage': (n) => /\.AppImage$/i.test(n),
  'linux-deb': (n) => /\.deb$/i.test(n),
  'linux-rpm': (n) => /\.rpm$/i.test(n),
}

function detectOs() {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'mac'
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux'
  return null
}

const PRIMARY = {
  windows: { key: 'win-exe', label: 'Télécharger pour Windows' },
  mac: { key: 'mac-arm', label: 'Télécharger pour macOS' },
  linux: { key: 'linux-appimage', label: 'Télécharger pour Linux' },
}

const os = detectOs()
if (os) {
  $(`.dl[data-os="${os}"]`)?.classList.add('current')
  const label = $('[data-download-label]')
  if (label) label.textContent = PRIMARY[os].label
}

async function loadRelease() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
  if (!res.ok) return
  const release = await res.json()
  const version = String(release.tag_name || '').replace(/^v/, '')
  const urls = {}
  for (const [key, match] of Object.entries(ASSETS)) {
    const asset = (release.assets || []).find((a) => match(a.name))
    if (asset) urls[key] = asset.browser_download_url
  }
  $$('[data-asset]').forEach((a) => {
    const url = urls[a.dataset.asset]
    if (url) a.href = url
  })
  const primary = $('[data-download="primary"]')
  if (primary && os && urls[PRIMARY[os].key]) primary.href = urls[PRIMARY[os].key]
  if (version) {
    const date = release.published_at ? new Date(release.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
    $$('[data-version]').forEach((el) => { el.textContent = `Version ${version} disponible` })
    const line = $('[data-release-line]')
    if (line) line.textContent = `Version ${version}${date ? `, publiée le ${date}` : ''}.`
  }
}
loadRelease().catch(() => {})

// ---------------------------------------------------------------- small things
$$('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const label = $('[data-copy-label]', btn)
    try {
      await navigator.clipboard.writeText(btn.dataset.copy)
      if (label) label.textContent = 'Copié'
    } catch {
      if (label) label.textContent = btn.dataset.copy
    }
    setTimeout(() => { if (label) label.textContent = 'Copier' }, 1800)
  })
})

// Blocks pop in as they scroll into view (stepped, like the launcher)
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    }
  }, { threshold: 0.15 })
  $$('.reveal').forEach((el, i) => {
    el.style.animationDelay = `${(i % 4) * 60}ms`
    io.observe(el)
  })
} else {
  $$('.reveal').forEach((el) => el.classList.add('in'))
}

// The bottom hotbar highlights the section in view; keys 1 to 7 jump to a section
const dock = $$('[data-dock] a')
const targets = dock.map((a) => $(a.getAttribute('href')))
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const i = targets.indexOf(e.target)
        dock.forEach((a, j) => a.classList.toggle('active', j === i))
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' })
  targets.forEach((t) => t && spy.observe(t))
}
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return
  const n = Number(e.key)
  const target = Number.isInteger(n) ? targets[n - 1] : null
  if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  if (e.key === 'Escape') {
    picker?.classList.remove('open')
    toggle?.setAttribute('aria-expanded', 'false')
  }
})

setTheme(currentTheme().id, false)
