/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const SCENES = {
  ran: {
    steps: [
      { node: "lead", log: "A lead came in." },
      { node: "person", log: "The right person got it." },
      { node: "out", log: "The follow-up went out.", fields: { out: "Done" }, cls: "ok" },
    ],
  },
  stopped: {
    steps: [
      { node: "lead", log: "A lead came in." },
      { node: "person", log: "It could not finish.", stop: true },
      { node: "out", log: "It stopped and said so.", fields: { out: "Stopped" }, cls: "halt" },
    ],
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const token = document.getElementById("token");
const logEl = document.getElementById("log");
const nodes = [...document.querySelectorAll(".node")];
const tabs = [...document.querySelectorAll(".paths [data-scene]")];
const fields = {
  out: document.querySelector('[data-field="out"]'),
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
  const mid = node.offsetLeft + node.offsetWidth / 2;
  token.style.left = `${mid}px`;
}

function resetBoard() {
  nodes.forEach((n) => n.classList.remove("is-on", "is-stop"));
  Object.values(fields).forEach((el) => {
    if (el) el.textContent = "—";
  });
  if (logEl) logEl.replaceChildren();
  if (nodes[0]) moveToken("lead");
}

function applyFields(next) {
  if (!next) return;
  Object.entries(next).forEach(([key, value]) => {
    if (fields[key]) fields[key].textContent = value;
  });
}

function addLog(text, cls) {
  if (!logEl) return;
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
  const stage = document.querySelector(".stage");
  if (stage) stage.dataset.scene = sceneId;

  tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", tab.dataset.scene === sceneId ? "true" : "false");
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
    }, 80 + i * 420);
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

if (token && logEl && tabs.length) {
  play("ran");
}
