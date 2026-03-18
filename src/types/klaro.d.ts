declare module "klaro/dist/klaro-no-translations";

interface Window {
  klaro?: {
    show: (config?: unknown, modal?: boolean) => void;
    setup: (config: unknown) => void;
  };
  klaroConfig?: unknown;
}
