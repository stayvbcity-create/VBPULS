// ═══════════════════════════════════════════════════════════════
// VBPuls — config.js
// Zajednička konfiguracija za sve HTML stranice
// Uključiti: <script src="./config.js"></script>
// ═══════════════════════════════════════════════════════════════

const VBP_CONFIG = {
  // ── Supabase ──────────────────────────────────────────────
  SUPABASE_URL:  'https://XXXXXXXXXXXX.supabase.co',   // ← Promeniti
  SUPABASE_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXX', // ← Promeniti

  // ── Aplikacija ────────────────────────────────────────────
  APP_URL:       'https://vbpuls.rs',
  APP_NAME:      'VBPuls',
  APP_VERSION:   '1.0.0',
  CITY:          'Vrnjačka Banja',

  // ── Admin ─────────────────────────────────────────────────
  // SHA-256 hash admin lozinke — generisati sa:
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('VasaLozinka'))
  //   .then(h => Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join(''))
  ADMIN_HASH:    'PROMENITI_HASH',

  // ── Kontakti komunalnih servisa ───────────────────────────
  KOMUNALNI: {
    voda:     { naziv: 'JKP Vrnjačka Banja', tel: '036/611-122' },
    struja:   { naziv: 'EPS Distribucija',   tel: '0800/100-021' },
    ciscenje: { naziv: 'Čistoća VB',         tel: '036/612-345' },
    opstina:  { naziv: 'Opština VB',         radno: 'Pon–Pet 07:30–15:30', tel: '036/613-000' },
  },

  // ── EPS ───────────────────────────────────────────────────
  EPS_BASE_URL: 'https://elektrodistribucija.rs/planirana-iskljucenja-srbija',
  EPS_FILES: [
    'Kraljevo_Dan_0_Iskljucenja.htm',
    'Kraljevo_Dan_1_Iskljucenja.htm',
    'Kraljevo_Dan_2_Iskljucenja.htm',
  ],
};

// ── Supabase klijent ──────────────────────────────────────────
let _sb = null;
function getSB() {
  if (_sb) return _sb;
  if (typeof supabase === 'undefined') {
    console.warn('Supabase SDK nije učitan');
    return null;
  }
  _sb = supabase.createClient(VBP_CONFIG.SUPABASE_URL, VBP_CONFIG.SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  return _sb;
}

// ── Lokalno čuvanje korisnika ─────────────────────────────────
const VBP_USER = {
  save(data) {
    try { localStorage.setItem('vbp_user', JSON.stringify(data)); } catch(e) {}
  },
  load() {
    try {
      const raw = localStorage.getItem('vbp_user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      if (!u?.name || !u?.id) return null;
      return u;
    } catch(e) { return null; }
  },
  clear() {
    try { localStorage.removeItem('vbp_user'); } catch(e) {}
  },
  isLoggedIn() {
    return this.load() !== null;
  },
};

// ── Analitika ─────────────────────────────────────────────────
async function vbpTrack(action, entityType = '', entityId = '') {
  const sb = getSB();
  if (!sb) return;
  const user = VBP_USER.load();
  try {
    await sb.from('analytics').insert({
      citizen_code: user?.id || null,
      action,
      entity_type: entityType || null,
      entity_id:   entityId   || null,
      kvart:       user?.kvart || null,
      device_type: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    });
  } catch(e) {}
}

// ── HTML escape ───────────────────────────────────────────────
function vbpEsc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ── Formatiranje datuma ───────────────────────────────────────
function vbpTimeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 2)   return 'Upravo';
  if (min < 60)  return `Pre ${min} min`;
  if (hr < 24)   return `Pre ${hr}h`;
  if (day === 1) return 'Juče';
  return `Pre ${day} dana`;
}

function vbpFormatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const days   = ['Nedeljom','U ponedeljak','U utorak','U sredu','U četvrtak','U petak','U subotu'];
  const months = ['januara','februara','marta','aprila','maja','juna','jula','avgusta','septembra','oktobra','novembra','decembra'];
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

function vbpFormatDateShort(iso) {
  if (!iso) return { day: '?', mon: '?' };
  const d = new Date(iso);
  const months = ['jan','feb','mar','apr','maj','jun','jul','avg','sep','okt','nov','dec'];
  return { day: d.getDate(), mon: months[d.getMonth()] };
}

// ── YouTube embed parser ──────────────────────────────────────
function vbpParseYouTube(text) {
  if (!text) return '';
  const ytRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})([^\s]*)/g;
  return text.replace(ytRegex, (match, _w, _path, videoId) => {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    return `<a href="${watchUrl}" target="_blank" rel="noopener" class="yt-embed-card">
      <div class="yt-thumb-wrap">
        <img src="${thumbUrl}" alt="YouTube video" loading="lazy" onerror="this.style.display='none'">
        <div class="yt-play-overlay">
          <div class="yt-play-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
      </div>
      <div class="yt-embed-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M23 7s-.3-2-1.2-2.7c-1.1-1.2-2.4-1.2-3-1.3C16.5 3 12 3 12 3s-4.5 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.5 12 21.5 12 21.5s4.5 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.7 1.2-2.7 1.2-2.7s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7z"/></svg>
        Gledajte na YouTube
      </div>
    </a>`;
  });
}

// ── Parsiranje teksta vesti (YouTube + linkovi) ───────────────
function vbpParseBody(text) {
  if (!text) return '';
  // Najpre YouTube
  let result = vbpParseYouTube(vbpEsc(text));
  // Zatim obični URL-ovi koji nisu YouTube
  result = result.replace(
    /(?<!href=")(https?:\/\/(?!www\.youtube\.com|youtu\.be)[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="body-link">$1</a>'
  );
  // Novi redovi → <br>
  result = result.replace(/\n/g, '<br>');
  return result;
}

// ── Toast notifikacija ────────────────────────────────────────
function vbpToast(msg, duration = 2800) {
  let toast = document.getElementById('vbp-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vbp-toast';
    toast.style.cssText = `
      position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
      background:#0f1f3a;border:1px solid rgba(255,255,255,0.12);
      padding:10px 20px;border-radius:30px;font-size:13px;font-weight:700;
      white-space:nowrap;z-index:9999;opacity:0;pointer-events:none;
      transition:opacity 0.25s;box-shadow:0 8px 24px rgba(0,0,0,0.4);
      color:#e6efff;font-family:Inter,-apple-system,sans-serif;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, duration);
}

// ── Admin session ─────────────────────────────────────────────
const VBP_ADMIN = {
  SESSION_KEY: 'vbp_admin_session',
  SESSION_DURATION: 4 * 60 * 60 * 1000, // 4h

  async login(password) {
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password)
    );
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== VBP_CONFIG.ADMIN_HASH) return false;

    const session = { hash, loginAt: Date.now() };
    try { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session)); } catch(e) {}
    return true;
  },

  isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s?.hash || !s?.loginAt) return false;
      if (Date.now() - s.loginAt > this.SESSION_DURATION) {
        this.logout();
        return false;
      }
      return s.hash === VBP_CONFIG.ADMIN_HASH;
    } catch(e) { return false; }
  },

  getHash() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s?.hash || null;
    } catch(e) { return null; }
  },

  logout() {
    try { sessionStorage.removeItem(this.SESSION_KEY); } catch(e) {}
  },
};

// ── PWA Instalacija ───────────────────────────────────────────
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
});

function vbpCanInstall() { return _deferredInstallPrompt !== null; }

async function vbpInstall() {
  if (!_deferredInstallPrompt) return false;
  _deferredInstallPrompt.prompt();
  const result = await _deferredInstallPrompt.userChoice;
  _deferredInstallPrompt = null;
  return result.outcome === 'accepted';
}

// ── Service Worker registracija ───────────────────────────────
function vbpRegisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('VBPuls SW registered:', reg.scope))
      .catch(err => console.warn('VBPuls SW error:', err));
  }
}

// ── Deljenje ──────────────────────────────────────────────────
function vbpShare(type, url, title = 'VBPuls', text = 'Vrnjačka Banja') {
  const msg = encodeURIComponent(`${text}\n${url}`);
  if (type === 'viber')    window.open(`viber://forward?text=${msg}`, '_blank');
  if (type === 'whatsapp') window.open(`https://wa.me/?text=${msg}`, '_blank');
  if (type === 'copy') {
    navigator.clipboard?.writeText(url)
      .then(() => vbpToast('✅ Link kopiran!'))
      .catch(() => vbpToast('🔗 ' + url));
    return;
  }
  if (type === 'native' && navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
    return;
  }
}

// CSS za YouTube embed — ubaciti u svaku stranicu koja prikazuje body vesti
const VBP_YOUTUBE_CSS = `
.yt-embed-card{
  display:block;border-radius:14px;overflow:hidden;
  background:#0f0f0f;border:1px solid rgba(255,255,255,0.08);
  margin:14px 0;text-decoration:none;
  transition:transform 0.15s;
}
.yt-embed-card:active{transform:scale(0.98)}
.yt-thumb-wrap{
  width:100%;aspect-ratio:16/9;
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#1c0808,#2d1515);
}
.yt-thumb-wrap img{
  width:100%;height:100%;object-fit:cover;display:block;
}
.yt-play-overlay{
  position:absolute;inset:0;
  display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.25);
}
.yt-play-btn{
  width:52px;height:52px;border-radius:50%;
  background:#ff0000;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(255,0,0,0.5);
}
.yt-play-btn svg{margin-left:3px}
.yt-embed-label{
  padding:10px 14px;
  font-size:11px;font-weight:700;
  color:rgba(255,255,255,0.6);
  display:flex;align-items:center;gap:6px;
  background:#111;
}
.body-link{
  color:#3b82f6;text-decoration:underline;word-break:break-all;
}
`;
