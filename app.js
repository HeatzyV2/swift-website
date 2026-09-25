// Download links point at the latest GitHub release; without the API (offline, rate limit) they
// fall back to the releases page already set in the HTML.
const REPO = 'HeatzyV2/swift-client'

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
  document.querySelector(`.dl[data-os="${os}"]`)?.classList.add('current')
  const label = document.querySelector('[data-download-label]')
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

  document.querySelectorAll('[data-asset]').forEach((a) => {
    const url = urls[a.dataset.asset]
    if (url) a.href = url
  })
  const primary = document.querySelector('[data-download="primary"]')
  if (primary && os && urls[PRIMARY[os].key]) primary.href = urls[PRIMARY[os].key]

  if (version) {
    const date = release.published_at ? new Date(release.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
    document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = `Version ${version} disponible` })
    const line = document.querySelector('[data-release-line]')
    if (line) line.textContent = `Version ${version}${date ? `, publiée le ${date}` : ''}.`
  }
}
loadRelease().catch(() => {})

// Copy a server address
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const label = btn.querySelector('[data-copy-label]')
    try {
      await navigator.clipboard.writeText(btn.dataset.copy)
      if (label) label.textContent = 'Copié'
    } catch {
      if (label) label.textContent = btn.dataset.copy
    }
    setTimeout(() => { if (label) label.textContent = 'Copier' }, 1800)
  })
})
