// Media blocks on the project pages:
//   [data-youtube="id"]  a poster with a play button; the YouTube player only loads on click
//   [data-browser]       a browser window with page tabs, each page scrolls inside the window
//   [data-drag]          a sideways strip you can also drag with the mouse

import { $, $$, escapeHtml } from "../lib/utils.js";

export function initMedia() {
  $$("[data-youtube]").forEach(initVideo);
  $$("[data-browser]").forEach(initBrowser);
  $$("[data-drag]").forEach(initDragScroll);
}

function initVideo(box) {
  const id = box.dataset.youtube;
  const title = escapeHtml(box.dataset.title || "video");
  const poster = (size) => `https://i.ytimg.com/vi/${id}/${size}.jpg`;

  box.innerHTML = `
    <button class="video__play" type="button" data-cursor="play" aria-label="Play video: ${title}">
      <img class="video__poster" src="${poster("maxresdefault")}" alt="" loading="lazy" decoding="async">
      <span class="video__icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
    </button>`;

  // not every video has a full-size poster (YouTube then sends a tiny
  // placeholder): step down to the smaller one, and hide it if that fails too
  const img = $(".video__poster", box);
  const fallback = () => {
    if (img.src.includes("maxres")) img.src = poster("hqdefault");
    else img.hidden = true;
  };
  img.addEventListener("error", fallback);
  img.addEventListener("load", () => img.naturalWidth < 200 && fallback());

  $(".video__play", box).addEventListener(
    "click",
    () => {
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="${title}"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    },
    { once: true },
  );
}

function initBrowser(browser) {
  const tabs = $$("[role='tab']", browser);
  const panels = $$("[role='tabpanel']", browser);
  const address = $(".browser__address", browser);

  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    panels[index].scrollTop = 0;
    if (address) address.textContent = tabs[index].dataset.address || tabs[index].textContent;
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select((i + step + tabs.length) % tabs.length, true);
    });
  });
  if (tabs.length) select(0);
}

function initDragScroll(strip) {
  let startX = 0;
  let startScroll = 0;
  let pointerId = null;
  let dragged = false;

  strip.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = strip.scrollLeft;
    dragged = false;
  });
  strip.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    if (!dragged && Math.abs(dx) > 5) {
      dragged = true;
      strip.setPointerCapture(pointerId);
      strip.classList.add("is-dragging");
    }
    if (dragged) strip.scrollLeft = startScroll - dx;
  });
  const end = () => {
    pointerId = null;
    strip.classList.remove("is-dragging");
  };
  strip.addEventListener("pointerup", end);
  strip.addEventListener("pointercancel", end);
  strip.addEventListener("dragstart", (event) => event.preventDefault());
  // a drag shouldn't also count as a click on the image under the pointer
  strip.addEventListener(
    "click",
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    },
    true,
  );
}
