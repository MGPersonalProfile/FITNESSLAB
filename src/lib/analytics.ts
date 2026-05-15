import posthog from "posthog-js";

let initialized = false;

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key && !initialized) {
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      capture_pageview: false, // we handle pageviews manually for App Router
      capture_pageleave: true,
      persistence: "localStorage",
    });
    initialized = true;
  }
}

const enabled = () => initialized;

export function track(event: string, props?: Record<string, unknown>) {
  if (!enabled()) return;
  try {
    posthog.capture(event, props);
  } catch (e) {
    console.debug("[analytics] capture failed", e);
  }
}

export function identify(id: string, props?: Record<string, unknown>) {
  if (!enabled()) return;
  try {
    posthog.identify(id, props);
  } catch {}
}

export function reset() {
  if (!enabled()) return;
  try {
    posthog.reset();
  } catch {}
}

// Re-export for places that need access to the raw client
export { posthog };
