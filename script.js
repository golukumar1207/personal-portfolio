/* =========================================================
   Personal Portfolio — JavaScript
   This file handles three things:
   1. Light / dark theme (saved in localStorage)
   2. Mobile navigation menu
   3. Instant project search
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
})();
