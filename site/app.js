/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stackQuery = window.matchMedia("(max-width: 720px)");
const STEP_MS = 1250;
const SETTLE_MS = 600;

function isStack() {
  return stackQuery.matches;
}

function bindStage(stage) {
  const token = stage.querySelector(".token");
  const rail = stage.querySelector(".rail");
  const nodes = [...stage.querySelectorAll(".nodes > .node")];
  const models = [...stage.querySelectorAll(".model-node")];
  const fill = stage.querySelector(".track-fill");
  const wire = stage.querySelector(".wire");
  const btn = stage.querySelector(".run-btn");
  const consoleEl = stage.querySelector(".console");
  const logEl = stage.querySelector(".log");
  if (!token || !btn || nodes.length < 2) return;

  if (wire) wire.style.setProperty("--node-count", String(nodes.length));

  let playId = 0;
  let timers = [];
  let running = false;
  let currentIndex = -1;

  function syncLayout() {
    stage.classList.toggle("is-stack", isStack());
  }

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function later(fn, ms) {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
  }

  function moveToken(node) {
    if (!node || !token || !rail) return;
    const railBox = rail.getBoundingClientRect();
    const nodeBox = node.getBoundingClientRect();
    if (isStack()) {
      const raw = getComputedStyle(node).getPropertyValue("--dot-center").trim();
      const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const dot = raw.endsWith("rem")
        ? Number.parseFloat(raw) * root
        : Number.parseFloat(raw) || 11;
      token.style.left = "";
      token.style.top = `${nodeBox.top - railBox.top + dot}px`;
      return;
    }
    token.style.top = "";
    token.style.left = `${nodeBox.left - railBox.left + nodeBox.width / 2}px`;
  }

  function setProgress(index) {
    if (!fill) return;
    const max = nodes.length - 1;
    const pct = `${Math.max(0, index) / max * 100}%`;
    if (isStack()) {
      fill.style.width = "100%";
      fill.style.height = pct;
      return;
    }
    fill.style.height = "100%";
    fill.style.width = pct;
  }

  function resetProgress() {
    if (!fill) return;
    if (isStack()) {
      fill.style.width = "100%";
      fill.style.height = "0%";
      return;
    }
    fill.style.height = "100%";
    fill.style.width = "0%";
  }

  function setModelState(node, state) {
    node.querySelectorAll(".model-node").forEach((model) => {
      model.classList.toggle("is-live", state === "live");
      model.classList.toggle("is-done", state === "done");
    });
  }

  function ensureNodeSays() {
    nodes.forEach((node) => {
      if (!node.dataset.say || node.querySelector(".node-say")) return;
      const line = document.createElement("p");
      line.className = "node-say";
      line.textContent = node.dataset.say;
      const label = node.querySelector(".node-label");
      if (label) {
        label.insertAdjacentElement("afterend", line);
        return;
      }
      node.appendChild(line);
    });
  }

  function addLog(text) {
    if (!logEl || !text) return;
    const li = document.createElement("li");
    li.textContent = text;
    li.className = "ok";
    logEl.appendChild(li);
    if (reduceMotion) {
      li.classList.add("is-in");
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        li.classList.add("is-in");
      });
    });
  }

  function resetBoard() {
    nodes.forEach((n) => {
      n.classList.remove("is-live", "is-done");
      setModelState(n, "");
    });
    models.forEach((m) => m.classList.remove("is-live", "is-done"));
    token.classList.remove("is-on");
    stage.classList.remove("is-playing", "is-done");
    currentIndex = -1;
    resetProgress();
    if (logEl) logEl.replaceChildren();
    moveToken(nodes[0]);
  }

  function light(index) {
    nodes.forEach((n, i) => {
      const live = i === index;
      const done = i < index;
      n.classList.toggle("is-done", done);
      n.classList.toggle("is-live", live);
      setModelState(n, live ? "live" : done ? "done" : "");
    });
    token.classList.add("is-on");
    currentIndex = index;
    moveToken(nodes[index]);
    setProgress(index);
    addLog(nodes[index].dataset.say);
  }

  function finish() {
    nodes.forEach((n) => {
      n.classList.remove("is-live");
      n.classList.add("is-done");
      setModelState(n, "done");
    });
    currentIndex = nodes.length - 1;
    setProgress(currentIndex);
    moveToken(nodes[currentIndex]);
    stage.classList.remove("is-playing");
    stage.classList.add("is-done");
    if (consoleEl) consoleEl.removeAttribute("aria-busy");
    running = false;
    btn.disabled = false;
    btn.textContent = "Run it again";
  }

  function play() {
    if (running) return;
    running = true;
    const ticket = ++playId;
    clearTimers();
    resetBoard();
    stage.classList.add("is-playing");
    btn.disabled = true;
    btn.textContent = "Running…";
    if (consoleEl) consoleEl.setAttribute("aria-busy", "true");

    if (reduceMotion) {
      nodes.forEach((n) => addLog(n.dataset.say));
      finish();
      return;
    }

    nodes.forEach((_, i) => {
      later(() => {
        if (ticket !== playId) return;
        light(i);
      }, 80 + i * STEP_MS);
    });

    later(() => {
      if (ticket !== playId) return;
      finish();
    }, 80 + (nodes.length - 1) * STEP_MS + SETTLE_MS);
  }

  btn.addEventListener("click", play);

  function relayout() {
    syncLayout();
    if (currentIndex >= 0) {
      setProgress(currentIndex);
      moveToken(nodes[currentIndex]);
      return;
    }
    resetProgress();
    moveToken(nodes[0]);
  }

  window.addEventListener("resize", relayout);
  if (typeof stackQuery.addEventListener === "function") {
    stackQuery.addEventListener("change", relayout);
  } else {
    stackQuery.addListener(relayout);
  }

  ensureNodeSays();
  syncLayout();
  requestAnimationFrame(() => {
    syncLayout();
    moveToken(nodes[0]);
  });

  if (stage.dataset.autoplay === "true") {
    play();
  }
}

document.querySelectorAll(".stage").forEach(bindStage);

if (MAILTO) {
  const href = `mailto:${MAILTO}?subject=${encodeURIComponent("20-minute walk")}`;
  document.querySelectorAll('a.cta[href*="#book"]').forEach((a) => {
    a.setAttribute("href", href);
  });
}
