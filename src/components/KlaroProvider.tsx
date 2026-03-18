"use client";

import { useEffect } from "react";

/**
 * Loads Klaro on the client side only.
 *
 * Klaro reads the config from `window.klaroConfig` when it initialises,
 * so we attach it before importing the library.
 */
export default function KlaroProvider() {
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { default: klaroConfig } = await import("@/lib/klaro-config");

      // Attach config to window for Klaro to pick up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).klaroConfig = klaroConfig;

      if (!mounted) return;

      // Dynamically import Klaro (client-only)
      const klaro = await import("klaro/dist/klaro-no-translations");
      klaro.setup(klaroConfig);

      // Expose the klaro API on window so other pages can call klaro.show()
      (window as any).klaro = klaro;
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Klaro injects its own DOM; we just need a mount target (optional).
  return <div id="klaro" />;
}
