/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STEP_MS = 560;
const SETTLE_MS = 420;

function bindStage(stage) {
  const token = stage.querySelector(".token");
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

  function clearTimers() {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  }

  function later(fn, ms) {
    const id = window.setTimeout(fn, ms);
    timers.push(id);
  }

  function moveToken(node) {
    if (!node || !token) return;
    const mid = node.offsetLeft + node.offsetWidth / 2;
    token.style.left = `${mid}px`;
  }

  function setProgress(index) {
    if (!fill) return;
    const max = nodes.length - 1;
    fill.style.width = `${Math.max(0, index) / max * 100}%`;
  }

  function setModelState(node, state) {
    node.querySelectorAll(".model-node").forEach((model) => {
      model.classList.toggle("is-live", state === "live");
      model.classList.toggle("is-done", state === "done");
    });
  }

  function addLog(text) {
    if (!logEl || !text) return;
    const li = document.createElement("li");
    li.textContent = text;
    li.className = "ok";
    if (reduceMotion) {
      li.style.opacity = "1";
      li.style.transform = "none";
    }
    logEl.appendChild(li);
  }

  function resetBoard() {
    nodes.forEach((n) => {
      n.classList.remove("is-live", "is-done");
      setModelState(n, "");
    });
    models.forEach((m) => m.classList.remove("is-live", "is-done"));
    token.classList.remove("is-on");
    stage.classList.remove("is-playing", "is-done");
    if (fill) fill.style.width = "0%";
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
    setProgress(nodes.length - 1);
    moveToken(nodes[nodes.length - 1]);
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

  window.addEventListener("resize", () => {
    const active = stage.querySelector(".nodes > .node.is-live") || [...stage.querySelectorAll(".nodes > .node.is-done")].pop() || nodes[0];
    moveToken(active);
  });

  requestAnimationFrame(() => moveToken(nodes[0]));

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
