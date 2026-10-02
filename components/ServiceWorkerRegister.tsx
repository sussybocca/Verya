"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    const retireLegacyWorker = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations
              .filter((registration) => new URL(registration.scope).origin === window.location.origin)
              .map((registration) => registration.unregister())
          );
        }

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith("verya-")).map((key) => caches.delete(key)));
        }
      } catch (error) {
        console.warn("Verya could not retire an old offline cache.", error);
      }
    };

    void retireLegacyWorker();
  }, []);

  return null;
}
