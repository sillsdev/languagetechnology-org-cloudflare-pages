// Google service-account JWT-bearer flow, implemented with WebCrypto (no npm deps —
// this runs in a Workers isolate, which has no Node "crypto"/"googleapis" package).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

// Best-effort in-isolate cache; not persisted, just avoids re-minting a token on every
// invocation while an isolate stays warm.
let cachedToken = null; // { token, expiresAt }

function base64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem) {
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function signJwt(email, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(signature)}`;
}

export async function getAccessToken(env) {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const jwt = await signJwt(env.GOOGLE_SA_EMAIL, env.GOOGLE_SA_PRIVATE_KEY);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`);
  }

  const { access_token, expires_in } = await res.json();
  cachedToken = { token: access_token, expiresAt: Date.now() + expires_in * 1000 };
  return access_token;
}
