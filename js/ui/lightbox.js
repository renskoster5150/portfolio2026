// Click any image inside a [data-zoom] block to see it full screen.
// Arrow keys or swiping move through all the zoomable images on the page.

import { $, $$, reducedMotion } from "../lib/utils.js";

export function initLightbox() {
  const images = $$("[data-zoom] img");
  if (!images.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Image viewer");
  dialog.innerHTML = `
    <figure class="lightbox__figure">
      <img class="lightbox__image" alt="">
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <p class="lightbox__count"></p>
    <button class="lightbox__close" type="button">close <span aria-hidden="true">✕</span></button>
    <button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">←</button>
    <button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">→</button>`;
  document.body.append(dialog);

  const view = $(".lightbox__image", dialog);
  const caption = $(".lightbox__caption", dialog);
  const count = $(".lightbox__count", dialog);
  let current = 0;

  const captionOf = (img) => img.closest("figure")?.querySelector("figcaption")?.textContent.trim() || img.alt;

  function show(index) {
    current = (index + images.length) % images.length;
    const img = images[current];
    view.src = img.currentSrc || img.src;
    view.alt = img.alt;
    caption.textContent = captionOf(img);
    count.textContent = `${current + 1} / ${images.length}`;
    if (!reducedMotion) {
      view.animate([{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "none" }], {
        duration: 420,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    }
  }

  function open(index) {
    show(index);
    dialog.showModal();
    document.documentElement.classList.add("lightbox-open");
  }

  dialog.addEventListener("close", () => document.documentElement.classList.remove("lightbox-open"));
  $(".lightbox__close", dialog).addEventListener("click", () => dialog.close());
  $(".lightbox__nav--prev", dialog).addEventListener("click", () => show(current - 1));
  $(".lightbox__nav--next", dialog).addEventListener("click", () => show(current + 1));
  dialog.classList.toggle("is-single", images.length === 1);

  // clicking the dark backdrop (not the image or a button) closes it
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.classList.contains("lightbox__figure")) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  dialog.addEventListener("pointerdown", (event) => (startX = event.clientX));
  dialog.addEventListener("pointerup", (event) => {
    const dx = startX === null ? 0 : event.clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });

  images.forEach((img, index) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `Enlarge image: ${captionOf(img)}`);
    img.dataset.cursor = "zoom";
    img.addEventListener("click", () => open(index));
    img.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open(index);
    });
  });
}
