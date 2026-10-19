const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

export function looksLikeIp(value) {
  return typeof value === "string" && IPV4_RE.test(value.trim());
}

export function normalizeIspName(rawIsp, org, as) {
  const haystack = `${rawIsp ?? ""} ${org ?? ""} ${as ?? ""}`.toLowerCase();

  if (haystack.includes("jio") || haystack.includes("reliance jio")) return "Jio";
  if (haystack.includes("airtel") || haystack.includes("bharti")) return "Airtel";
  if (
    haystack.includes("vodafone") ||
    haystack.includes("idea") ||
    /\bvi\b/.test(haystack)
  ) {
    return "Vi";
  }
  if (haystack.includes("bsnl")) return "BSNL";

  const fallback = (rawIsp || org || "").trim();
  return fallback || "Unknown";
}

function formatIpLocation(data) {
  return [data.city, data.region, data.country]
    .filter(Boolean)
    .join(", ");
}

async function fetchIpWhoIs(ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);

    if (!response.ok) return null;

    const data = await response.json();
    return data?.success ? data : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function lookupIp(ip) {
  if (!ip || ip === "Unknown" || !looksLikeIp(ip)) {
    return {
      provider: "Unknown",
      isp: null,
      latitude: null,
      longitude: null,
      location: null,
    };
  }

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const data = await fetchIpWhoIs(ip);
  if (!data) {
    return {
      provider: "Unknown",
      isp: null,
      latitude: null,
      longitude: null,
      location: null,
    };
  }

  const rawIsp = data.connection?.isp ?? null;
  const org = data.connection?.org ?? null;
  const value = {
    provider: normalizeIspName(rawIsp, org, data.connection?.asn),
    isp: rawIsp || org || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    location: formatIpLocation(data) || null,
  };

  cache.set(ip, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function resolveIsp(ip) {
  const { provider, isp } = await lookupIp(ip);
  return { provider, isp };
}
