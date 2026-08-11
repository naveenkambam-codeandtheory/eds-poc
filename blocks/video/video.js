/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Determines the video source type from a link
 * @param {string} link - The video link URL
 * @returns {string} - 'youtube', 'vimeo', or 'video'
 */
function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  if (link.includes('vimeo')) return 'vimeo';
  return 'video';
}

/**
 * Gets a human-readable video type label
 * @param {string} source - The video source type ('youtube', 'vimeo', or 'video')
 * @returns {string} - Human-readable label
 */
function getVideoTypeLabel(source) {
  const labels = {
    youtube: 'YouTube video',
    vimeo: 'Vimeo video',
    video: 'MP4 video',
  };
  return labels[source] || 'video';
}

/**
 * Extracts the YouTube video id from any of the supported url shapes
 * @param {URL} url
 * @returns {string} - the video id, or '' when it cannot be determined
 */
function getYoutubeId(url) {
  const usp = new URLSearchParams(url.search);
  if (usp.get('v')) return usp.get('v');
  // youtu.be/ID, /embed/ID, /shorts/ID, /live/ID
  const [, first, second] = url.pathname.split('/');
  if (url.hostname.includes('youtu.be')) return first || '';
  if (['embed', 'shorts', 'live', 'v'].includes(first)) return second || '';
  return '';
}

function createIframe(src, title) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('src', src);
  iframe.setAttribute('title', title);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope');
  iframe.setAttribute('loading', 'lazy');
  return iframe;
}

function embedYoutube(url, autoplay, background) {
  const vid = encodeURIComponent(getYoutubeId(url));
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });

  if (autoplay || background) params.set('autoplay', '1');
  if (background) {
    // a background video must be muted, chrome-free and self-looping.
    // `loop` only works on the embed player when `playlist` repeats the id.
    params.set('mute', '1');
    params.set('controls', '0');
    params.set('disablekb', '1');
    params.set('loop', '1');
    params.set('modestbranding', '1');
    params.set('iv_load_policy', '3');
    if (vid) params.set('playlist', vid);
  }

  const src = vid
    ? `https://www.youtube.com/embed/${vid}?${params.toString()}`
    : `https://www.youtube.com${url.pathname}?${params.toString()}`;

  const iframe = createIframe(src, 'Content from YouTube');
  // a background embed should start immediately rather than lazily
  if (background) iframe.setAttribute('loading', 'eager');
  return iframe;
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  const params = new URLSearchParams();
  if (autoplay || background) params.set('autoplay', '1');
  if (background) {
    // vimeo's `background` param mutes, loops and hides all controls
    params.set('background', '1');
    params.set('muted', '1');
    params.set('loop', '1');
  }

  const query = params.toString();
  const iframe = createIframe(
    `https://player.vimeo.com/video/${video}${query ? `?${query}` : ''}`,
    'Content from Vimeo',
  );
  if (background) iframe.setAttribute('loading', 'eager');
  return iframe;
}

function getVideoElement(source, autoplay, background, poster) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('playsinline', '');
  if (poster) video.setAttribute('poster', poster);

  if (background) {
    video.setAttribute('loop', '');
    // `muted` must be set as a property, not just an attribute, or chrome
    // will still refuse to autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.removeAttribute('controls');
    video.setAttribute('preload', 'auto');
    video.setAttribute('disablepictureinpicture', '');
  }
  if (autoplay) video.setAttribute('autoplay', '');

  // set src directly: deriving a MIME type from the url extension breaks on
  // query strings and on extensionless delivery/DAM urls, and a <source> with
  // the wrong type is silently skipped, leaving an empty video element
  video.setAttribute('src', source);

  if (autoplay) {
    const tryPlay = () => {
      const played = video.play();
      if (played && typeof played.catch === 'function') {
        played.catch(() => {
          // blocked by the browser: expose controls so it stays usable
          if (!background) video.setAttribute('controls', '');
        });
      }
    };
    video.addEventListener('loadeddata', tryPlay, { once: true });
    tryPlay();
  }

  return video;
}

function loadVideoEmbed(block, link, autoplay, background, poster) {
  if (block.dataset.embedLoaded === 'true') return;

  const url = new URL(link);
  const source = getVideoSource(link);

  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed';

  let media;
  if (source === 'youtube') {
    media = embedYoutube(url, autoplay, background);
  } else if (source === 'vimeo') {
    media = embedVimeo(url, autoplay, background);
  } else {
    media = getVideoElement(link, autoplay, background, poster);
  }

  wrapper.append(media);
  block.append(wrapper);

  const markLoaded = () => {
    block.dataset.embedLoaded = true;
  };
  const readyEvent = media.tagName === 'IFRAME' ? 'load' : 'loadeddata';
  media.addEventListener(readyEvent, markLoaded, { once: true });
  // fall back so a failed/blocked media never leaves the block in its
  // reserved-space state forever
  media.addEventListener('error', markLoaded, { once: true });
}

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const linkElement = block.querySelector('a[href]');
  const link = linkElement?.href;
  // `autoplay` authors a muted, looping background video with the remaining
  // cell content laid over it
  const background = block.classList.contains('autoplay');

  if (!link) return;

  const poster = placeholder?.querySelector('img')?.src;

  const content = document.createElement('div');
  content.className = 'video-content';
  if (background) {
    block.querySelectorAll(':scope > div > div').forEach((cell) => {
      // strip the video link and the poster image, keep the rest as overlay
      cell.querySelectorAll('picture, a[href]').forEach((el) => {
        const para = el.closest('p');
        const paraIsOnlyMedia = para && !para.textContent.replace(el.textContent, '').trim();
        if (paraIsOnlyMedia) {
          para.remove();
        } else {
          el.remove();
        }
      });
      if (cell.textContent.trim()) content.append(...cell.childNodes);
    });
  }

  block.textContent = '';
  block.dataset.embedLoaded = false;

  const hasContent = content.childNodes.length > 0;
  if (background && hasContent) {
    block.append(content);
    // only dim the video when there is text that needs the contrast
    block.classList.add('has-content');
  }

  if (background) {
    // a background video is its own poster: render it straight away rather
    // than gating it behind a click
    loadVideoEmbed(block, link, !prefersReducedMotion.matches, true, poster);
    return;
  }

  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    const source = getVideoSource(link);
    const ariaLabel = `Play ${getVideoTypeLabel(source)}`;

    wrapper.insertAdjacentHTML(
      'beforeend',
      `<div class="video-placeholder-play"><button type="button" title="${ariaLabel}" aria-label="${ariaLabel}"></button></div>`,
    );
    wrapper.addEventListener('click', () => {
      wrapper.remove();
      loadVideoEmbed(block, link, true, false, poster);
    });
    block.append(wrapper);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadVideoEmbed(block, link, false, false, poster);
    }
  });
  observer.observe(block);
}
