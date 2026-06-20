const config = window.STUDIGO_CONFIG || {};

const SUPABASE_URL = config.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || "";
const AUTH_URL = config.AUTH_URL || "https://diphie.github.io/studigo-auth/";

const SESSION_KEY = "studigo_session";

let sessionState = $state(null);
let readyState = $state(false);

export function getSession() {
  return sessionState;
}

export function isReady() {
  return readyState;
}

export function getAuthUrl(returnTo) {
  const url = new URL(AUTH_URL);
  url.searchParams.set("returnTo", returnTo || window.location.href);
  return url.toString();
}

export function goToLogin() {
  window.location.href = getAuthUrl(window.location.href);
}

export function goToSignup() {
  const url = new URL(AUTH_URL);
  url.searchParams.set("returnTo", window.location.href);
  url.hash = "#signup";
  window.location.href = url.toString();
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionState = null;

  // Also sign out from Supabase via the auth page
  const logoutUrl = new URL(AUTH_URL);
  logoutUrl.hash = "#logout";
  window.location.href = logoutUrl.toString();
}

// Initialize on module load
initialize();

async function initialize() {
  // 1. Check URL hash for incoming auth tokens (redirect from auth)
  const hashParams = parseHash();
  if (hashParams.access_token) {
    const session = {
      access_token: hashParams.access_token,
      refresh_token: hashParams.refresh_token,
      expires_at: hashParams.expires_at,
      token_type: hashParams.token_type || "bearer",
      auth: "success",
    };
    await fetchAndStoreUser(session);
    // Clean URL — remove hash
    history.replaceState(null, "", window.location.pathname + window.location.search);
    readyState = true;
    return;
  }

  // 2. Check localStorage for existing session
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.expires_at && Date.now() / 1000 < parsed.expires_at) {
        sessionState = parsed;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  readyState = true;
}

async function fetchAndStoreUser(session) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionState = session;
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apiKey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (res.ok) {
      const user = await res.json();
      session.user = user;
      session.email = user.email;
      session.name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User";
    }
  } catch {
    // User fetch failed — store session without user data
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  sessionState = session;
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return {};
  const params = new URLSearchParams(hash);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    expires_at: params.get("expires_at"),
    token_type: params.get("token_type"),
  };
}