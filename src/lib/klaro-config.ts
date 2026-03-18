/**
 * Klaro cookie-consent configuration for KeepPlay Engine.
 *
 * Docs: https://klaro.org/docs/getting-started
 *
 * Each "service" represents a cookie / tracking technology the user can
 * accept or decline. The `purposes` array groups them in the consent UI.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const klaroConfig: Record<string, any> = {
  /**
   * Version – bump when the set of services changes so returning users
   * are asked for consent again.
   */
  version: 1,

  /**
   * Element to mount the consent modal into. Defaults to body.
   */
  elementID: "klaro",

  /**
   * Where to store the user's consent choices.
   */
  storageMethod: "localStorage" as const,
  storageName: "keepplay-cookie-consent",

  /**
   * If true, Klaro will render its own stylesheet.
   */
  styling: {
    theme: ["light", "top", "wide"],
  },

  /**
   * Whether the consent notice is shown as a modal that blocks interaction.
   */
  mustConsent: false,

  /**
   * Whether services should be accepted by default.
   */
  default: false,

  /**
   * If true, users must accept all or no optional services (no granular).
   * We want granular control.
   */
  groupByPurpose: true,

  /**
   * Translations used in the consent UI.
   */
  translations: {
    en: {
      consentModal: {
        title: "Cookie Settings",
        description:
          "We use cookies and similar technologies to improve your experience, analyse usage, and deliver personalised content. You can choose which categories to allow below. For more details, view our {privacyPolicy}.",
      },
      consentNotice: {
        title: "Cookie Consent",
        description:
          "We use cookies to enhance your experience. You can customise your preferences or accept all cookies. Read our {privacyPolicy} for details.",
        changeDescription:
          "Our cookie settings have changed since your last visit. Please review and update your preferences.",
        learnMore: "Manage preferences",
      },
      privacyPolicy: {
        text: "Cookie Policy",
        name: "Cookie Policy",
      },
      purposes: {
        necessary: {
          title: "Strictly Necessary",
          description:
            "These cookies are essential for the website and app to function correctly. They cannot be disabled.",
        },
        analytics: {
          title: "Analytics & Performance",
          description:
            "These cookies help us understand how users interact with the App so we can improve the experience.",
        },
        advertising: {
          title: "Advertising",
          description:
            "These cookies are used by ad networks to deliver relevant advertisements and measure campaign performance.",
        },
        functional: {
          title: "Functional",
          description:
            "These cookies enable enhanced functionality and personalisation, such as remembering your preferences.",
        },
      },
      ok: "Accept All",
      decline: "Decline Optional",
      save: "Save Preferences",
      acceptAll: "Accept All",
      acceptSelected: "Save Preferences",
    },
  },

  /**
   * URL of the cookie / privacy policy page.
   */
  privacyPolicy: "/cookie-policy",

  /**
   * ----------------------------------------------------------------
   * SERVICES (cookies / tracking technologies)
   * ----------------------------------------------------------------
   */
  services: [
    {
      name: "session",
      title: "Session & Authentication",
      purposes: ["necessary"],
      description:
        "Essential cookies for login sessions, CSRF protection, and security tokens.",
      required: true, // cannot be declined
    },
    {
      name: "consent",
      title: "Cookie Consent Preferences",
      purposes: ["necessary"],
      description:
        "Stores your cookie-consent choices so we don't ask you every time.",
      required: true,
    },
    {
      name: "analytics",
      title: "Analytics",
      purposes: ["analytics"],
      description:
        "Aggregated usage data to help us understand App performance and user behaviour.",
      cookies: [
        /^_ga/,   // Google Analytics (if used)
        /^_gid/,
      ],
      default: false,
    },
    {
      name: "advertising",
      title: "Advertising Cookies",
      purposes: ["advertising"],
      description:
        "Used by third-party ad networks to deliver relevant ads and track ad performance.",
      default: false,
    },
    {
      name: "functional",
      title: "Functional Cookies",
      purposes: ["functional"],
      description:
        "Remember your preferences such as language, theme, and UI state.",
      default: false,
    },
  ],
};

export default klaroConfig;
