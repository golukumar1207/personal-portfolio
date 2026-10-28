/**
 * Vercel Serverless Function: POST /api/chat
 * Sends a visitor's question to Google Gemini, or falls back to an
 * accurate portfolio response engine so the chatbot always works reliably.
 */

const MAX_QUESTION_LENGTH = 500;

// Gemini Flash models to attempt in order
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-3.8-flash"
];

// Context grounded in Golu Kumar's verified academic and project profile
const PORTFOLIO_CONTEXT = `
You are an intelligent and friendly assistant on Golu Kumar's personal portfolio website.
Answer concisely and politely using only the verified facts below.

About Golu Kumar:
- Name: Golu Kumar
- Program: B.Tech in Computer Science and Engineering (Second Year)
- University: JECRC University, Jaipur
- Expected Graduation: 2029
- Current CGPA: 8.0
- Focus: Web Development & Software Engineering (HTML, CSS, JavaScript, C++, C, Python)
- Email: golugulshan136@gmail.com
- GitHub Profile: https://github.com/golukumar1207

Featured Projects:
1. Python Programs Collection (Python)
   A collection of Python scripts demonstrating foundational algorithms like factorial, Fibonacci sequence, and data structure conversion.
   Repository: https://github.com/golukumar1207/-python-programs-collection

2. Messy Python Code Improvement (Python, AI Assistance)
   Refactoring unorganized Python code using AI workflows to improve readability, modularity, and clean code practices.
   Repository: https://github.com/golukumar1207/messy-python-code-improvement

3. Bug Fixing Using Cursor AI (Python, Debugging)
   Systematic debugging and error resolution workflow on flawed codebases using Cursor AI.
   Repository: https://github.com/golukumar1207/bug-fixing-using-cursor-ai

4. Interactive Quiz Application (HTML, CSS, JavaScript)
   An interactive web-based quiz application developed in Lecture 10 for taking browser quizzes with instant feedback.
   Repository: https://github.com/golukumar1207/interactive-quiz

5. Book Reading List Application (HTML, CSS, JavaScript)
   A dynamic reading tracker application built in Lecture 11 for organizing books read and wishlists.
   Repository: https://github.com/golukumar1207/-book-reading-list

Website Features:
- Responsive navigation, light/dark theme switch, real-time project search, interactive chatbot, and direct contact buttons.
`.trim();

/**
 * Intelligent local answer generator for when Gemini API key is missing or service is unavailable.
 */
function generatePortfolioAnswer(question) {
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

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function parseQuestion(req) {
  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return { error: "Request body must be valid JSON." };
    }
  }

  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object with a question field." };
  }

  if (!Object.prototype.hasOwnProperty.call(body, "question")) {
    return { error: "Missing question field." };
  }

  if (typeof body.question !== "string") {
    return { error: "Question must be a string." };
  }

  const question = body.question.trim();

  if (question.length === 0) {
    return { error: "Question cannot be empty." };
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      error:
        "Question is too long. Please keep it to " +
        MAX_QUESTION_LENGTH +
        " characters or fewer."
    };
  }

  return { question };
}

function extractAnswer(geminiData) {
  const parts =
    geminiData &&
    geminiData.candidates &&
    geminiData.candidates[0] &&
    geminiData.candidates[0].content &&
    geminiData.candidates[0].content.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map(function (part) {
      return typeof part.text === "string" ? part.text : "";
    })
    .join("")
    .trim();
}

async function callGemini(question, apiKey) {
  for (const model of GEMINI_MODELS) {
    try {
      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: PORTFOLIO_CONTEXT }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: question }]
            }
          ]
        })
      });

      if (!res.ok) {
        continue;
      }

      const geminiData = await res.json();
      const answer = extractAnswer(geminiData);
      if (answer) {
        return answer;
      }
    } catch (err) {
      // Continue to next model attempt
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  const parsed = parseQuestion(req);
  if (parsed.error) {
    sendJson(res, 400, { error: parsed.error });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let answer = null;

  if (apiKey) {
    answer = await callGemini(parsed.question, apiKey);
  }

  // Gracefully fallback to accurate local portfolio answer if API key is not configured or calls fail
  if (!answer) {
    answer = generatePortfolioAnswer(parsed.question);
  }

  sendJson(res, 200, { answer: answer });
};
