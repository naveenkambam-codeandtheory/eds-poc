function getInstagramEmbedUrl(inputUrl) {
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.toLowerCase();
    const isInstagramHost = host === 'instagram.com'
      || host === 'www.instagram.com'
      || host === 'instagr.am';

    if (!isInstagramHost) return null;

    const pathMatch = url.pathname.match(/^\/(p|reel|tv)\/[^/]+/i);
    if (!pathMatch) return null;

    return url.toString().replace(/\/$/, '');
  } catch (error) {
    return null;
  }
}

function loadInstagramEmbedScript() {
  const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
  if (existingScript) {
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.instagram.com/embed.js';
  script.onload = () => {
    if (window.instgrm?.Embeds?.process) {
      window.instgrm.Embeds.process();
    }
  };
  document.head.append(script);
}

function buildFallbackLink(url) {
  const link = document.createElement('a');
  link.href = url;
  link.textContent = 'Open Instagram post';
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  link.className = 'embed-link';
  return link;
}

export default function decorate(block) {
  const sourceLink = block.querySelector('a[href]');
  const embedUrl = sourceLink ? getInstagramEmbedUrl(sourceLink.href) : null;

  block.classList.add('embed-instagram');

  const frameWrapper = document.createElement('div');
  frameWrapper.className = 'embed-frame';

  if (embedUrl) {
    const quote = document.createElement('blockquote');
    quote.className = 'instagram-media';
    quote.setAttribute('data-instgrm-permalink', embedUrl);
    quote.setAttribute('data-instgrm-version', '14');
    quote.setAttribute('data-instgrm-captioned', 'true');
    frameWrapper.append(quote);
    loadInstagramEmbedScript();
  } else {
    const fallback = buildFallbackLink(sourceLink?.href || '#');
    frameWrapper.append(fallback);
  }

  block.replaceChildren(frameWrapper);
}
