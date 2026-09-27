// Metadata helpers for ambient captures: location, device info, and
// serialization for cloud storage / AI moment retrieval.

// Best-effort geolocation (opt-in). Resolves null if unavailable or denied.
export function captureLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

// Reverse-geocode via BigDataCloud's free, keyless client endpoint.
export async function reverseGeocode(lat, long) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const d = await res.json();
    const place = d.locality || d.city || d.principalSubdivision || d.countryName || 'Unknown';
    const parts = [d.locality || d.city, d.principalSubdivision, d.countryName].filter(Boolean);
    return { place, locality: parts.join(', ') || place };
  } catch {
    return null;
  }
}

export function deviceInfo() {
  if (typeof navigator === 'undefined') return { platform: 'unknown' };
  return {
    platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
    ua: navigator.userAgent,
  };
}

// Build a structured metadata object attached to every capture.
export function buildMetadata({ timestamp, triggerType, peakDb, durationMs, location, transcript, tags }) {
  return {
    capturedAt: new Date(timestamp).toISOString(),
    triggerType,
    peakDb: peakDb != null ? Number(peakDb.toFixed(1)) : null,
    durationMs,
    location: location || null,
    transcript: transcript || null,
    tags: tags || [],
    device: deviceInfo(),
  };
}

// Serialize metadata into a plain-text description for the Drive file.
export function metadataToDescription(meta) {
  if (!meta) return '';
  const lines = [`Captured: ${meta.capturedAt}`];
  lines.push(`Trigger: ${meta.triggerType}`);
  lines.push(`Duration: ${(meta.durationMs / 1000).toFixed(1)}s`);
  if (meta.peakDb != null) lines.push(`Peak: ${meta.peakDb.toFixed(0)} dB`);
  if (meta.location?.locality) lines.push(`Location: ${meta.location.locality}`);
  if (meta.location) lines.push(`Coords: ${meta.location.lat?.toFixed(5)}, ${meta.location.long?.toFixed(5)}`);
  if (meta.transcript) lines.push(`Heard: "${meta.transcript}"`);
  if (meta.tags?.length) lines.push(`Tags: ${meta.tags.join(', ')}`);
  return lines.join('\n');
}