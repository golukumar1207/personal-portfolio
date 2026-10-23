/* =========================================================
   Personal Portfolio — JavaScript
   This file handles:
   1. Light / dark theme (saved in localStorage)
   2. Mobile navigation menu
   3. Instant project search
   4. Portfolio chatbot (POST /api/chat)
   ========================================================= */

(function () {
  "use strict";

  const THEME_KEY = "portfolio-theme";

  const html = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.getElementById("primary-nav");
  const searchInput = document.getElementById("project-search");
  const projectCards = document.querySelectorAll(".project-card");
  const noResults = document.getElementById("no-results");

  /* ---------- Theme ---------- */

  // Apply a theme and update the button label for screen readers.
  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const isLight = theme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Switch to dark mode" : "Switch to light mode"
    );
    themeToggle.querySelector(".theme-toggle-text").textContent = isLight
      ? "Dark"
      : "Light";
  }

  // Restore the last saved theme, or keep dark as the default.
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    setTheme(savedTheme);
  } else {
    setTheme("dark");
  }

  themeToggle.addEventListener("click", function () {
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    setTheme(next);
  });

  /* ---------- Mobile navigation ---------- */

  function closeMenu() {
    primaryNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  function openMenu() {
    primaryNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
  }

  navToggle.addEventListener("click", function () {
    const isOpen = primaryNav.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the menu after a nav link is used (helpful on phones).
  primaryNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  /* ---------- Project search ---------- */

  function filterProjects() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    projectCards.forEach(function (card) {
      const haystack = [
        card.dataset.title,
        card.dataset.description,
        card.dataset.tech,
        card.textContent
      ]
        .join(" ")
        .toLowerCase();

      const matches = query === "" || haystack.includes(query);
      card.classList.toggle("is-hidden", !matches);
      if (matches) {
        visibleCount += 1;
      }
    });

    const showEmpty = query !== "" && visibleCount === 0;
    noResults.hidden = !showEmpty;
  }

  // "input" runs as soon as the user types, so results update immediately.
  searchInput.addEventListener("input", filterProjects);

  /* ---------- Portfolio chatbot ---------- */

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatLog = document.getElementById("chat-log");
  const chatStatus = document.getElementById("chat-status");
  const CHAT_MAX_LENGTH = 500;
  let chatBusy = false;

  function appendChatMessage(kind, text) {
    const row = document.createElement("div");
    row.className = "chat-message chat-message-" + kind;

    const role = document.createElement("span");
    role.className = "chat-role";
    role.textContent =
      kind === "user" ? "You" : kind === "error" ? "Notice" : "Assistant";

    const bubble = document.createElement("p");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    row.appendChild(role);
    row.appendChild(bubble);
    chatLog.appendChild(row);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setChatBusy(isBusy) {
    chatBusy = isBusy;
    chatInput.disabled = isBusy;
    chatStatus.hidden = !isBusy;
    chatLog.setAttribute("aria-busy", String(isBusy));
    updateChatSendState();
  }

  function updateChatSendState() {
    const hasText = chatInput.value.trim().length > 0;
    chatSend.disabled = chatBusy || !hasText;
  }

  function friendlyChatError(data, response) {
    if (data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (response && response.status === 404) {
      return "The chatbot backend was not found. Open this site through Vercel so /api/chat can run.";
    }
    return "Sorry, I could not get a reply. Please try again in a moment.";
  }

  async function sendChatQuestion(question) {
    setChatBusy(true);
    appendChatMessage("user", question);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        data = null;
      }

      if (!response.ok || !data || typeof data.answer !== "string") {
        appendChatMessage("error", friendlyChatError(data, response));
        return;
      }

      appendChatMessage("bot", data.answer);
    } catch (err) {
      appendChatMessage(
        "error",
        "I could not reach the chatbot. If you opened the HTML file directly, run the site with Vercel so /api/chat works."
      );
    } finally {
      setChatBusy(false);
      chatInput.focus();
    }
  }

  if (chatForm && chatInput && chatSend && chatLog && chatStatus) {
    chatInput.addEventListener("input", updateChatSendState);

    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (chatBusy) {
        return;
      }

      const question = chatInput.value.trim();
      if (question.length === 0) {
        return;
      }
      if (question.length > CHAT_MAX_LENGTH) {
        appendChatMessage(
          "error",
          "Please keep your question to 500 characters or fewer."
        );
        return;
      }

      chatInput.value = "";
      updateChatSendState();
      sendChatQuestion(question);
    });
  }
})();
