/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STEP_MS = 560;
const SETTLE_MS = 420;

function bindStage(stage) {
  const token = stage.querySelector(".token");
  const nodes = [...stage.querySelectorAll(".node")];
  const fill = stage.querySelector(".track-fill");
  const btn = stage.querySelector(".run-btn");
  const consoleEl = stage.querySelector(".console");
  if (!token || !btn || nodes.length < 2) return;

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

  function resetBoard() {
    nodes.forEach((n) => n.classList.remove("is-live", "is-done"));
    token.classList.remove("is-on");
    stage.classList.remove("is-playing", "is-done");
    if (fill) fill.style.width = "0%";
    moveToken(nodes[0]);
  }

  function light(index) {
    nodes.forEach((n, i) => {
      n.classList.toggle("is-done", i < index);
      n.classList.toggle("is-live", i === index);
    });
    token.classList.add("is-on");
    moveToken(nodes[index]);
    setProgress(index);
  }

  function finish() {
    nodes.forEach((n) => {
      n.classList.remove("is-live");
      n.classList.add("is-done");
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
    const active = stage.querySelector(".node.is-live") || [...stage.querySelectorAll(".node.is-done")].pop() || nodes[0];
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
