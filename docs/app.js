/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const SCENES = {
  "nc-book": {
    end: { state: "NC", q: "Clear / clear", door: "Book" },
    steps: [
      { node: "form", log: "form · webhook in" },
      { node: "state", log: "gate · NC — open", fields: { state: "NC" } },
      { node: "q", log: "q1 · clear" },
      { node: "q", log: "q2 · clear", fields: { q: "Clear / clear" } },
      { node: "door", log: "door · book", fields: { door: "Book" }, cls: "ok" },
      { log: "text · 1 of 3 · logged_not_sent", cls: "ok" },
      { log: "text · 2 of 3 · logged_not_sent", cls: "ok" },
      { log: "text · 3 of 3 · logged_not_sent", cls: "ok" },
      { log: "appt · stub · not on a live calendar" },
    ],
  },
  "sc-nurture": {
    end: { state: "SC", q: "—", door: "Nurture" },
    steps: [
      { node: "form", log: "form · webhook in" },
      { node: "state", log: "gate · SC — open", fields: { state: "SC" } },
      { node: "door", log: "door · nurture", fields: { q: "Skipped", door: "Nurture" }, cls: "ok" },
      { log: "path · keep-warm only" },
      { log: "book · no" },
      { log: "text · none" },
    ],
  },
  "tx-reject": {
    end: { state: "TX", q: "—", door: "Reject" },
    stopAt: "state",
    steps: [
      { node: "form", log: "form · webhook in" },
      { node: "state", log: "gate · TX — closed", fields: { state: "TX" }, stop: true },
      { log: "door · reject", fields: { door: "Reject" }, cls: "halt" },
      { log: "stop · hard", cls: "halt" },
      { log: "text · none" },
    ],
  },
  "nc-handoff": {
    end: { state: "NC", q: "Clear / unusable", door: "Handoff" },
    steps: [
      { node: "form", log: "form · webhook in" },
      { node: "state", log: "gate · NC — open", fields: { state: "NC" } },
      { node: "q", log: "q1 · clear" },
      { node: "q", log: "q2 · unusable", fields: { q: "Clear / unusable" } },
      { node: "door", log: "door · handoff", fields: { door: "Handoff" }, cls: "ok" },
      { log: "guess · no" },
      { log: "text · none" },
    ],
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const token = document.getElementById("token");
const logEl = document.getElementById("log");
const nodes = [...document.querySelectorAll(".node")];
const tabs = [...document.querySelectorAll(".doors [data-scene]")];
const fields = {
  state: document.querySelector('[data-field="state"]'),
  q: document.querySelector('[data-field="q"]'),
  door: document.querySelector('[data-field="door"]'),
};

let playId = 0;
let timers = [];

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

function later(fn, ms) {
  const id = window.setTimeout(fn, ms);
  timers.push(id);
}

function moveToken(nodeName) {
  const node = nodes.find((n) => n.dataset.node === nodeName);
  if (!node || !token) return;
  const rail = node.parentElement;
  const mid = node.offsetLeft + node.offsetWidth / 2;
  token.style.left = `${mid}px`;
  if (rail) {
    /* keep token from clipping on the first node */
    void rail.offsetWidth;
  }
}

function resetBoard() {
  nodes.forEach((n) => n.classList.remove("is-on", "is-stop"));
  Object.values(fields).forEach((el) => {
    if (el) el.textContent = "—";
  });
  logEl.replaceChildren();
  if (nodes[0]) moveToken("form");
}

function applyFields(next) {
  if (!next) return;
  Object.entries(next).forEach(([key, value]) => {
    if (fields[key]) fields[key].textContent = value;
  });
}

function addLog(text, cls) {
  const li = document.createElement("li");
  li.textContent = text;
  if (cls) li.className = cls;
  if (reduceMotion) {
    li.style.opacity = "1";
    li.style.transform = "none";
  }
  logEl.appendChild(li);
}

function play(sceneId) {
  const scene = SCENES[sceneId];
  if (!scene) return;
  const ticket = ++playId;
  clearTimers();
  resetBoard();
  document.querySelector(".stage").dataset.scene = sceneId;

  tabs.forEach((tab) => {
    const on = tab.dataset.scene === sceneId;
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });

  if (reduceMotion) {
    scene.steps.forEach((step) => {
      if (step.node) {
        const node = nodes.find((n) => n.dataset.node === step.node);
        if (node) node.classList.add(step.stop ? "is-stop" : "is-on");
        moveToken(step.node);
      }
      applyFields(step.fields);
      addLog(step.log, step.cls);
    });
    return;
  }

  scene.steps.forEach((step, i) => {
    later(() => {
      if (ticket !== playId) return;
      if (step.node) {
        const node = nodes.find((n) => n.dataset.node === step.node);
        if (node) node.classList.add(step.stop ? "is-stop" : "is-on");
        moveToken(step.node);
      }
      applyFields(step.fields);
      addLog(step.log, step.cls);
    }, 80 + i * 380);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => play(tab.dataset.scene));
});

window.addEventListener("resize", () => {
  const active = document.querySelector(".node.is-on, .node.is-stop") || nodes[0];
  if (active) moveToken(active.dataset.node);
});

if (MAILTO) {
  const href = `mailto:${MAILTO}?subject=${encodeURIComponent("20-minute walk")}`;
  document.querySelectorAll("a.cta").forEach((a) => {
    a.setAttribute("href", href);
  });
}

play("nc-book");
