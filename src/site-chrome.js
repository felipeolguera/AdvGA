import { populateVisitorCount } from "./metrics.js";

export const APP_VERSION = "1.59";
export const SITE_PAGES = [
  { id: "builder", label: "Builder", href: "" },
  { id: "studio", label: "Studio", href: "studio.html" },
  { id: "tryit", label: "Try it!", href: "tryit.html" },
  { id: "analytics", label: "Analytics", href: "analytics.html" },
];

const FEEDBACK_ENDPOINT = "https://formsubmit.co/ajax/felipeolguera%40gmail.com";

export function joinBaseUrl(baseUrl, path = "") {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${base}${String(path).replace(/^\//, "")}`;
}

function createFeedbackPanel() {
  const panel = document.createElement("section");
  panel.className = "feedback-panel panel";
  panel.setAttribute("aria-label", "Suggest a feature or report an issue");
  panel.innerHTML = `
    <div class="feedback-panel-heading">
      <p class="eyebrow">Feedback</p>
      <h2 class="feedback-panel-title">Suggest a feature or report an issue</h2>
      <p class="hint feedback-panel-lead">
        Tell us what you want to see next in AdvGA, or flag something that is broken. Your message goes straight to the maintainer.
      </p>
    </div>
    <form class="feedback-form" id="feedback-form" novalidate>
      <label class="feedback-field">
        <span>Type</span>
        <select name="category" id="feedback-category" required>
          <option value="Feature suggestion">Feature suggestion</option>
          <option value="Bug report">Bug report</option>
          <option value="Other feedback">Other feedback</option>
        </select>
      </label>
      <label class="feedback-field">
        <span>Your message</span>
        <textarea
          name="message"
          id="feedback-message"
          rows="4"
          required
          minlength="8"
          maxlength="4000"
          placeholder="Example: Add export to Omnidex format, or the deck builder scroll jumps on mobile."
        ></textarea>
      </label>
      <label class="feedback-field feedback-field--optional">
        <span>Your email <span class="feedback-optional">(optional, for follow-up)</span></span>
        <input
          type="email"
          name="reply_email"
          id="feedback-reply-email"
          autocomplete="email"
          placeholder="you@example.com"
        />
      </label>
      <input type="text" name="_honey" class="feedback-honey" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <div class="feedback-actions">
        <button class="secondary" type="submit" id="feedback-submit">Send feedback</button>
        <p class="feedback-status hint" id="feedback-status" aria-live="polite"></p>
      </div>
    </form>
  `;
  return panel;
}

function feedbackErrorMessage(payload = {}, fallback = "") {
  const message = String(payload.message || fallback || "").trim();
  if (/activation/i.test(message)) {
    return "The feedback form is waiting on a one-time setup step. Check felipeolguera@gmail.com for an email from FormSubmit with an “Activate Form” link, click it once, then try again.";
  }
  return (
    message ||
    "Could not send right now. Try again in a moment, or email felipeolguera@gmail.com directly."
  );
}

export function bindFeedbackForm(root = document) {
  const form = root.querySelector("#feedback-form");
  if (!form || form.dataset.bound === "true") {
    return;
  }
  form.dataset.bound = "true";
  const status = form.querySelector("#feedback-status");
  const submit = form.querySelector("#feedback-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (form.querySelector(`[name="_honey"]`)?.value?.trim()) {
      return;
    }

    const category = form.querySelector("#feedback-category")?.value?.trim();
    const message = form.querySelector("#feedback-message")?.value?.trim();
    const replyEmail = form.querySelector("#feedback-reply-email")?.value?.trim();
    if (!message || message.length < 8) {
      status.textContent = "Please write at least a short message before sending.";
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    status.textContent = "Sending your feedback…";

    const page =
      `${window.location.pathname}${window.location.search || ""}`.replace(/^\//, "") || "AdvGA";

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          category,
          message,
          reply_email: replyEmail || "Not provided",
          page,
          _subject: `[AdvGA] ${category}`,
          _template: "table",
          _captcha: "false",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== "true") {
        status.textContent = feedbackErrorMessage(payload);
        return;
      }
      form.reset();
      status.textContent = "Thanks — your feedback was sent.";
    } catch (error) {
      console.error("Feedback submit failed:", error);
      status.textContent = feedbackErrorMessage({}, error?.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Send feedback";
    }
  });
}

function setNavOpen(nav, open) {
  const toggle = nav.querySelector(".site-nav-toggle");
  nav.classList.toggle("is-open", open);
  if (toggle) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
}

function bindSiteNav(nav) {
  const toggle = nav.querySelector(".site-nav-toggle");
  if (!toggle || toggle.dataset.bound === "1") {
    return;
  }
  toggle.dataset.bound = "1";
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setNavOpen(nav, !nav.classList.contains("is-open"));
  });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !nav.contains(event.target)) {
      setNavOpen(nav, false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setNavOpen(nav, false);
      toggle.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 721px)").matches) {
      setNavOpen(nav, false);
    }
  });
}

function createSiteNav({ baseUrl, activePage = "builder" }) {
  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Site sections");

  const brand = document.createElement("a");
  brand.className = "site-nav-brand";
  brand.href = joinBaseUrl(baseUrl);
  brand.setAttribute("aria-label", "AdvGA home");
  const brandLabel = document.createElement("span");
  brandLabel.className = "site-nav-brand-label";
  brandLabel.textContent = "AdvGA";
  brand.append(brandLabel);

  const toggle = document.createElement("button");
  toggle.className = "site-nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "site-nav-menu");
  toggle.setAttribute("aria-label", "Open menu");
  toggle.innerHTML =
    '<span class="site-nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>';

  const links = document.createElement("div");
  links.className = "site-nav-links";
  links.id = "site-nav-menu";

  for (const page of SITE_PAGES) {
    const link = document.createElement("a");
    link.className = "site-nav-link";
    link.href = joinBaseUrl(baseUrl, page.href);
    link.textContent = page.label;
    if (page.id === activePage) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    links.append(link);
  }

  nav.append(brand, toggle, links);
  return nav;
}

export function mountSiteNav({
  baseUrl,
  activePage = "builder",
  target = document.body,
  before = null,
} = {}) {
  const nav = createSiteNav({ baseUrl, activePage });
  bindSiteNav(nav);
  if (before) {
    target.insertBefore(nav, before);
  } else {
    target.prepend(nav);
  }
  return nav;
}

function createSiteFooter({
  baseUrl,
  label = "Grand Archive Advanced",
  showVisitorCount = false,
  visitorCountId = "visitor-count-value",
} = {}) {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.setAttribute("aria-label", "Site footer");

  const version = document.createElement("span");
  version.className = "app-version site-footer-version";
  version.textContent = `${label} · v${APP_VERSION}`;
  footer.append(version);

  if (showVisitorCount) {
    const visitors = document.createElement("p");
    visitors.className = "visitor-count site-footer-visitor";
    visitors.id = "visitor-count";
    visitors.setAttribute("aria-label", "Site visitor count");
    visitors.innerHTML = `<span class="visitor-count-label">Visitors</span> <strong class="visitor-count-value" id="${visitorCountId}" aria-live="polite">—</strong>`;
    footer.append(visitors);
  }

  for (const page of SITE_PAGES) {
    if (page.id === "builder") {
      continue;
    }
    const link = document.createElement("a");
    link.className = "site-footer-link";
    link.href = joinBaseUrl(baseUrl, page.href);
    link.textContent = page.label;
    footer.append(link);
  }

  return footer;
}

export function mountSiteFooter(options = {}) {
  const { target, replace, feedback = true, populateVisitors = true } = options;
  const footer = createSiteFooter(options);

  if (replace) {
    const stack = document.createElement("div");
    stack.className = "site-footer-stack";
    if (feedback) {
      const panel = createFeedbackPanel();
      stack.append(panel, footer);
      bindFeedbackForm(panel);
    } else {
      stack.append(footer);
    }
    replace.replaceWith(stack);
  } else if (target) {
    if (feedback) {
      const panel = createFeedbackPanel();
      target.append(panel, footer);
      bindFeedbackForm(panel);
    } else {
      target.append(footer);
    }
  }

  if (populateVisitors && options.showVisitorCount) {
    void populateVisitorCount(footer.querySelector(`#${options.visitorCountId || "visitor-count-value"}`));
  }

  return footer;
}
