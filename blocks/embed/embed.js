function getInstagramEmbedUrl(inputUrl) {
  try {
    const url = new URL(inputUrl);
    const host = url.hostname.toLowerCase();
    const isInstagramHost = host === 'instagram.com' || host === 'www.instagram.com' || host === 'instagr.am';

    if (!isInstagramHost) return null;

    const pathMatch = url.pathname.match(/^\/(p|reel|tv)\/[^/]+/i);
    if (!pathMatch) return null;

    return `https://www.instagram.com${url.pathname}/embed/captioned/`;
  } catch (error) {
    return null;
  }
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
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.title = 'Instagram embed';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('allowfullscreen', 'true');
    frameWrapper.append(iframe);
  } else {
    const fallback = buildFallbackLink(sourceLink?.href || '#');
    frameWrapper.append(fallback);
  }

  block.replaceChildren(frameWrapper);
}
