/*
 * Deployment switch: GitHub Pages works with BASE_PATH = "" for a custom
 * domain or a user site. For a project site, set it to "/Buddy" (or the repo
 * name). Moving to a custom Buddy domain later only requires changing this
 * value and the public links below.
 */
const SITE_CONFIG = {
  BASE_PATH: "",
  GITHUB_URL: "https://github.com/shreyanshoffline/Buddy",
  FUTURE_DOMAIN: "https://buddy.hackclub.com",
};

const replies = [
  "That sounds like a good place to start. Keep it small enough that you can finish a first version in one sitting, then give yourself room to make it weird.",
  "I’d break that into three tiny steps: decide what ‘done’ means, make the simplest version, and test it with one real example. Want to sketch those together?",
  "Here’s a simple way to think about it: the goal is the destination, the next action is the first visible step, and the constraint is what keeps the idea light enough to move.",
  "I like that direction. A little structure could help without taking the fun out of it — what part feels most exciting right now?",
  "Try this: write the idea in one sentence, remove half the features, and make the remaining part feel delightful. That’s usually a strong first pass.",
];

let usedMessages = 0;
let toastTimer;
let recognition;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function setActivePage() {
  const page = (window.location.hash || "#home").slice(1).split("?")[0];
  const known = ["home", "try", "pricing", "releases", "about", "privacy", "terms"];
  const target = known.includes(page) ? page : "home";
  document.body.dataset.page = target;
  $$(`[data-page]`).forEach((section) => { section.hidden = section.dataset.page !== target; });
  $$(`[data-nav]`).forEach((link) => link.classList.toggle("active", link.dataset.nav === target));
  const titles = {
    home: "Buddy — Your AI companion",
    try: "Try · Buddy",
    pricing: "Pricing · Buddy",
    releases: "Releases · Buddy",
    about: "About · Buddy",
    privacy: "Privacy Policy · Buddy",
    terms: "Terms of Service · Buddy",
  };
  document.title = titles[target] || "Buddy";
  if (target === "try") updateChatUI();
  // Hash navigation can otherwise jump straight past the shared header to
  // the section anchor. Scroll after the browser finishes its anchor jump.
  setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 0);
}

function closeMobileNav() {
  const menu = $("[data-mobile-nav]");
  const button = $("[data-menu-toggle]");
  menu.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
}

function initNavigation() {
  window.addEventListener("hashchange", setActivePage);
  $$('a[href^="#"]').forEach((link) => link.addEventListener("click", closeMobileNav));
  $("[data-menu-toggle]").addEventListener("click", () => {
    const menu = $("[data-mobile-nav]");
    const button = $("[data-menu-toggle]");
    const isOpen = menu.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
  setActivePage();
}

function addMessage(text, role) {
  const wrapper = $("[data-messages]");
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  if (role === "buddy") {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = '<button type="button" aria-label="Read reply aloud" data-speak>◖</button><button type="button" aria-label="Copy reply" data-copy>⌘</button>';
    message.appendChild(tools);
  }
  wrapper.appendChild(message);
  wrapper.parentElement.scrollTo({ top: wrapper.parentElement.scrollHeight, behavior: "smooth" });
}

function updateChatUI() {
  const count = $("[data-count]");
  const bar = $("[data-limit-bar]");
  const hint = $("[data-compose-hint]");
  const input = $("[data-chat-input]");
  const submit = $(".send-button");
  const left = Math.max(0, 10 - usedMessages);
  count.textContent = usedMessages;
  bar.style.width = `${usedMessages * 10}%`;
  hint.textContent = usedMessages >= 10 ? "Preview limit reached — reset to try again" : `${left} message${left === 1 ? "" : "s"} left in this preview`;
  input.disabled = usedMessages >= 10;
  submit.disabled = usedMessages >= 10 || !input.value.trim();
  if (usedMessages >= 10) input.placeholder = "Preview limit reached — reset to start over";
}

function sendMessage(text) {
  const clean = text.trim();
  if (!clean || usedMessages >= 10) return;
  const input = $("[data-chat-input]");
  const welcome = $("[data-welcome]");
  const thinking = $("[data-thinking]");
  input.value = "";
  usedMessages += 1;
  if (welcome) welcome.hidden = true;
  addMessage(clean, "user");
  updateChatUI();
  thinking.hidden = false;
  setTimeout(() => {
    thinking.hidden = true;
    addMessage(replies[(usedMessages - 1) % replies.length], "buddy");
    if (usedMessages >= 10) showToast("You’ve used all 10 preview messages. Reset whenever you want another try.");
  }, 600 + Math.min(clean.length * 8, 500));
}

function resetChat() {
  usedMessages = 0;
  const welcome = $("[data-welcome]");
  const thinking = $("[data-thinking]");
  const input = $("[data-chat-input]");
  $("[data-messages]").replaceChildren();
  welcome.hidden = false;
  thinking.hidden = true;
  input.placeholder = "Message Buddy";
  input.value = "";
  updateChatUI();
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    showToast("Speech playback is not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Voice input is not available here yet. Try Chat instead.");
    return;
  }
  if (recognition) {
    recognition.stop();
    recognition = null;
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => showToast("Listening — say something to Buddy.");
  recognition.onerror = (event) => { showToast(event.error === "not-allowed" ? "Microphone permission is needed for voice mode." : "I couldn’t hear that. Try again."); recognition = null; };
  recognition.onend = () => { recognition = null; };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    sendMessage(transcript);
    setTimeout(() => {
      const lastReply = $("[data-messages] .message.buddy:last-child");
      if (lastReply) speak(lastReply.firstChild.textContent);
    }, 1300);
  };
  recognition.start();
}

function initChat() {
  $("[data-chat-form]").addEventListener("submit", (event) => { event.preventDefault(); sendMessage($("[data-chat-input]").value); });
  $("[data-chat-input]").addEventListener("input", updateChatUI);
  $("[data-chat-input]").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event.currentTarget.value); }
  });
  $$('[data-starter]').forEach((button) => button.addEventListener("click", () => sendMessage(button.dataset.starter)));
  $$('[data-reset-chat]').forEach((button) => button.addEventListener("click", resetChat));
  $$('[data-voice-trigger]').forEach((button) => button.addEventListener("click", startVoice));
  $("[data-messages]").addEventListener("click", (event) => {
    const speakButton = event.target.closest("[data-speak]");
    const copyButton = event.target.closest("[data-copy]");
    const message = event.target.closest(".message");
    if (!message) return;
    const text = message.firstChild.textContent;
    if (speakButton) speak(text);
    if (copyButton) navigator.clipboard?.writeText(text).then(() => showToast("Reply copied."));
  });
  $$('[data-scroll="pricing"]').forEach((button) => button.addEventListener("click", () => { window.location.hash = "pricing"; }));
  updateChatUI();
}

document.addEventListener("DOMContentLoaded", () => {
  $("[data-year]").textContent = new Date().getFullYear();
  initNavigation();
  initChat();
});
