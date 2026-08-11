let consentedLoaded = false;

/**
 * Dummy consent implementation.
 *
 * By default consent is declined, so consented scripts (analytics, martech, etc.)
 * are not loaded. This stands in for a real CMP (OneTrust, etc.) and can be
 * swapped out later.
 *
 * The default can be overridden with a query parameter for testing:
 *   ?consent=accept   grant consent (loads consented.js)
 *   ?consent=decline  decline consent (default behavior)
 *
 * @returns {boolean} true if the user has consented
 */
function hasConsent() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent !== null) {
    return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
  }
  // default: decline
  return false;
}

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

onConsentUpdate();

// scripts/consent-check.js
// const ONETRUST_SRC = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';
// const ONETRUST_DATA_DOMAIN = 'your-onetrust-domain-id';

// let consentedLoaded = false;

// function loadConsented() {
//   if (consentedLoaded) return;
//   consentedLoaded = true;
//   import('./consented.js');
// }

// // OneTrust calls this whenever the banner initializes or preferences change
// window.OptanonWrapper = () => {
//   const activeGroups = window.OnetrustActiveGroups || '';
//   // adjust to the categories your project actually needs
//   const consented = activeGroups.includes('C0004');
//   window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
//   if (consented) {
//     loadConsented();
//   }
// };

// function loadOneTrust() {
//   const script = document.createElement('script');
//   script.src = ONETRUST_SRC;
//   script.type = 'text/javascript';
//   script.charset = 'UTF-8';
//   script.setAttribute('data-domain-script', ONETRUST_DATA_DOMAIN);
//   document.head.append(script);
// }

// loadOneTrust();
