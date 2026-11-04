// The parts every page shares: header, mobile menu and footer. They are
// rendered here once, so a link or an address only ever changes in one place.

import { $, $$, clamp, fragment, reducedMotion } from "../lib/utils.js";
import { onFrame, scroll } from "../lib/ticker.js";

export const CONTACT = {
  email: "renskoster5@gmail.com",
  socials: [
    { label: "linkedin", href: "https://www.linkedin.com/in/rens-koster-11b3662b2/" },
    { label: "instagram", href: "https://www.instagram.com/rens_k.s/" },
  ],
};

const NAV = [
  { label: "home", href: "./", pages: ["home"] },
  { label: "about", href: "about.html", pages: ["about"] },
  { label: "projects", href: "projects.html", pages: ["projects", "project"] },
  { label: "contact", href: "contact.html", pages: ["contact"] },
];

const ARROW = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;

/** Text that rolls up to a copy of itself on hover (the copy is hidden from screen readers). */
export const roll = (text) =>
  `<span class="roll"><span>${text}</span><span aria-hidden="true">${text}</span></span>`;

const socialLinks = () =>
  CONTACT.socials
    .map(({ label, href }) => `<li><a href="${href}" target="_blank" rel="noopener">${roll(label)} ${ARROW}</a></li>`)
    .join("");

export function initChrome(page) {
  renderHeader(page);
  renderFooter(page);
  initMenu();
  initHeaderOnScroll();
  initCopyButtons();
}

function renderHeader(page) {
  const header = $(".site-header");
  if (!header) return;
  const current = (item) => (item.pages.includes(page) ? ' aria-current="page"' : "");

  header.append(
    fragment(`
      <div class="site-header__inner wrap">
        <a class="brand" href="./" aria-label="Rens Koster, home">${roll("rens koster")}</a>
        <nav class="nav" aria-label="Main">
          <ul class="nav__list">
            ${NAV.map((item) => `<li><a class="nav__link" href="${item.href}"${current(item)}>${roll(item.label)}</a></li>`).join("")}
          </ul>
        </nav>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">
          <span class="menu-toggle__label">menu</span>
          <span class="menu-toggle__icon" aria-hidden="true"></span>
        </button>
      </div>
    `),
  );

  // the menu sits next to the header, not inside it: the header's blur would
  // otherwise trap the full-screen menu inside the header's own box
  header.after(
    fragment(`
      <div class="menu" id="menu">
        <nav aria-label="Mobile">
          <ol class="menu__list">
            ${NAV.map(
              (item, i) =>
                `<li style="--i: ${i}"><a class="menu__link" href="${item.href}"${current(item)}><span class="menu__num">0${i + 1}</span>${item.label}</a></li>`,
            ).join("")}
          </ol>
        </nav>
        <div class="menu__foot">
          <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>
          <ul class="menu__socials">${socialLinks()}</ul>
        </div>
      </div>
    `),
  );
}

function renderFooter(page) {
  const footer = $(".site-footer");
  if (!footer) return;
  // on the contact page the big call to action points to the work instead
  const cta =
    page === "contact"
      ? { href: "projects.html", text: "see my work" }
      : { href: "contact.html", text: "let's work together" };

  footer.append(
    fragment(`
      <div class="footer wrap">
        <p class="eyebrow">what's next?</p>
        <a class="footer__cta" href="${cta.href}" data-magnetic>
          <span data-split data-reveal="words">${cta.text}</span>${ARROW}
        </a>
        <div class="footer__grid">
          <div>
            <p class="label">email</p>
            <p class="footer__email">
              <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>
              <button class="copy" type="button" data-copy="${CONTACT.email}">copy</button>
            </p>
          </div>
          <div>
            <p class="label">elsewhere</p>
            <ul class="footer__links">${socialLinks()}</ul>
          </div>
          <div>
            <p class="label">local time</p>
            <p><time class="footer__clock" data-clock></time> in amsterdam</p>
          </div>
          <div class="footer__top">
            <button class="to-top" type="button">${roll("back to top")} <span aria-hidden="true">↑</span></button>
          </div>
        </div>
        <div class="footer__bottom">
          <p>© ${new Date().getFullYear()} rens koster</p>
          <p>designed &amp; built in amsterdam</p>
        </div>
      </div>
      <p class="footer__wordmark" aria-hidden="true">rens koster</p>
    `),
  );

  $(".to-top", footer).addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }),
  );
  startClock($("[data-clock]", footer));
  initWordmark($(".footer__wordmark", footer));
}

function startClock(el) {
  const format = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
  const update = () => (el.textContent = format.format(new Date()));
  update();
  setInterval(update, 15000);
}

/** The giant name at the bottom fills up with riso halftone dots as it scrolls into view. */
function initWordmark(el) {
  if (reducedMotion) {
    el.style.setProperty("--dots", 1);
    return;
  }
  let visible = false;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(el);
  let last = -1;
  onFrame(() => {
    if (!visible) return;
    const rect = el.getBoundingClientRect();
    const t = clamp((scroll.vh - rect.top) / rect.height);
    if (Math.abs(t - last) < 0.002) return;
    last = t;
    el.style.setProperty("--dots", t.toFixed(3));
  });
}

function initMenu() {
  const root = document.documentElement;
  const toggle = $(".menu-toggle");
  const menu = $("#menu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    $(".menu-toggle__label", toggle).textContent = open ? "close" : "menu";
    // keep keyboard focus inside the menu while it covers the page
    [...document.body.children].forEach((el) => {
      if (!el.matches(".site-header, .menu")) el.inert = open;
    });
    if (open) $(".menu__link", menu).focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => setOpen(!root.classList.contains("menu-open")));
  $$("a", menu).forEach((link) => link.addEventListener("click", () => setOpen(false)));
  // the menu only exists on small screens: close it if the window grows
  matchMedia("(min-width: 821px)").addEventListener("change", (event) => event.matches && setOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("menu-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/** Header turns solid once you scroll, hides while scrolling down and returns when scrolling up. */
function initHeaderOnScroll() {
  const root = document.documentElement;
  let lastY = scroll.y;
  root.classList.toggle("is-scrolled", lastY > 24); // a page reopened halfway down
  onFrame(() => {
    const y = scroll.y;
    const delta = y - lastY;
    if (Math.abs(delta) < 4) return;
    root.classList.toggle("is-scrolled", y > 24);
    const hide = delta > 0 && y > 240 && !root.classList.contains("menu-open");
    root.classList.toggle("header-hidden", hide);
    lastY = y;
  });
}

/** Any [data-copy] button copies its value and briefly says so. */
function initCopyButtons() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.location.href = `mailto:${text}`;
      return;
    }
    const original = button.dataset.label ?? button.textContent;
    button.dataset.label = original;
    button.textContent = "copied ✓";
    button.classList.add("is-copied");
    clearTimeout(button.copyTimer);
    button.copyTimer = setTimeout(() => {
      button.textContent = original;
      button.classList.remove("is-copied");
    }, 1800);
  });
}
