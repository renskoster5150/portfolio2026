// Contact: the form sends in the background (Formspree) and answers right on
// the page instead of jumping to another site.

import { $ } from "../lib/utils.js";
import { dimShapes } from "../ui/shapes.js";

export function init() {
  dimShapes({ min: 0.45 });
  const form = $("[data-form]");
  if (!form) return;
  const status = $(".form-status", form);
  const button = $("button[type='submit']", form);

  const say = (message, kind = "") => {
    status.textContent = message;
    status.className = `form-status ${kind && `is-${kind}`}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.setAttribute("aria-busy", "true");
    button.disabled = true;
    say("sending…");
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(response.statusText);
      form.reset();
      say("thank you! your message is on its way, i'll get back to you within 48 hours.", "success");
    } catch {
      say("that didn't go through. please try again, or email me at renskoster5@gmail.com", "error");
    } finally {
      form.removeAttribute("aria-busy");
      button.disabled = false;
    }
  });
}
