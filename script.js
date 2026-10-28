/* =========================================================
   Personal Portfolio — JavaScript
   This file handles:
   1. Light / dark theme (saved in localStorage)
   2. Mobile navigation menu
   3. Instant project search
   4. Portfolio chatbot (POST /api/chat with resilient fallback)
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

  searchInput.addEventListener("input", filterProjects);

  /* ---------- Portfolio chatbot ---------- */

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatLog = document.getElementById("chat-log");
  const chatStatus = document.getElementById("chat-status");
  const chatChips = document.querySelectorAll(".chat-chip");
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

  function getLocalPortfolioAnswer(question) {
    const q = String(question || "").toLowerCase();

    if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("greetings")) {
      return "Hello! I am Golu Kumar's portfolio assistant. Feel free to ask me about Golu's education at JECRC University, his CGPA, technical skills, or his 5 featured projects!";
    }

    if (q.includes("cgpa") || q.includes("gpa") || q.includes("marks") || q.includes("score") || q.includes("grade")) {
      return "Golu Kumar currently holds a strong CGPA of 8.0 in his B.Tech Computer Science and Engineering program at JECRC University, Jaipur.";
    }

    if (
      q.includes("education") ||
      q.includes("college") ||
      q.includes("university") ||
      q.includes("study") ||
      q.includes("studying") ||
      q.includes("degree") ||
      q.includes("jecrc") ||
      q.includes("course") ||
      q.includes("graduation")
    ) {
      return "Golu is currently a second-year B.Tech student in Computer Science and Engineering at JECRC University, Jaipur (expected graduation: 2029) with a CGPA of 8.0.";
    }

    if (
      q.includes("skill") ||
      q.includes("tech") ||
      q.includes("stack") ||
      q.includes("language") ||
      q.includes("javascript") ||
      q.includes("html") ||
      q.includes("css") ||
      q.includes("c++")
    ) {
      return "Golu's technical skillset includes HTML, CSS, JavaScript, C++, C, and Python, along with Git, GitHub, and modern web development workflows.";
    }

    if (q.includes("quiz")) {
      return "The Interactive Quiz Application was created in Lecture 10 using HTML, CSS, and JavaScript to provide interactive browser-based quizzes. You can check the code here: https://github.com/golukumar1207/interactive-quiz";
    }

    if (q.includes("book") || q.includes("reading")) {
      return "The Book Reading List Application was developed in Lecture 11 with HTML, CSS, and JavaScript for managing books and reading lists. View repository: https://github.com/golukumar1207/-book-reading-list";
    }

    if (q.includes("cursor") || q.includes("bug")) {
      return "The Bug Fixing project demonstrates using Cursor AI to diagnose, debug, and fix software errors in Python code. View repository: https://github.com/golukumar1207/bug-fixing-using-cursor-ai";
    }

    if (q.includes("messy") || q.includes("refactor")) {
      return "The Messy Python Code Improvement project explores refactoring and cleaning complex Python code using AI assistance. View repository: https://github.com/golukumar1207/messy-python-code-improvement";
    }

    if (q.includes("python programs") || q.includes("factorial") || q.includes("fibonacci")) {
      return "The Python Programs Collection contains core Python programs including factorials, Fibonacci, and dictionary transformations. View repository: https://github.com/golukumar1207/-python-programs-collection";
    }

    if (q.includes("project") || q.includes("work") || q.includes("portfolio")) {
      return "Golu has 5 featured projects: 1) Python Programs Collection, 2) Messy Python Code Improvement, 3) Bug Fixing Using Cursor AI, 4) Interactive Quiz Application, and 5) Book Reading List Application. You can view all code repositories in the Projects section above!";
    }

    if (q.includes("email") || q.includes("contact") || q.includes("reach") || q.includes("hire") || q.includes("message")) {
      return "You can get in touch with Golu Kumar via email at golugulshan136@gmail.com, or connect through his GitHub profile at https://github.com/golukumar1207.";
    }

    if (q.includes("github") || q.includes("repo") || q.includes("git")) {
      return "Golu's GitHub profile is https://github.com/golukumar1207 where you can view all his repositories and code contributions.";
    }

    if (q.includes("who is") || q.includes("about") || q.includes("who are you") || q.includes("introduce")) {
      return "Golu Kumar is a second-year B.Tech CSE student at JECRC University, Jaipur (8.0 CGPA) with a keen interest in web development and software engineering.";
    }

    return "Golu Kumar is a second-year B.Tech Computer Science student at JECRC University, Jaipur (CGPA: 8.0) skilled in HTML, CSS, JavaScript, Python, C++, and C. Feel free to explore his projects above or contact him at golugulshan136@gmail.com.";
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

      if (response.ok && data && typeof data.answer === "string" && data.answer.trim()) {
        appendChatMessage("bot", data.answer);
        return;
      }

      // If backend fails or returned an error, fallback immediately
      const fallback = getLocalPortfolioAnswer(question);
      appendChatMessage("bot", fallback);
    } catch (err) {
      // Offline / local file / network error: fallback gracefully
      const fallback = getLocalPortfolioAnswer(question);
      appendChatMessage("bot", fallback);
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

    // Quick suggestion chips
    chatChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (chatBusy) return;
        const text = chip.textContent.trim();
        if (text) {
          sendChatQuestion(text);
        }
      });
    });
  }
})();
