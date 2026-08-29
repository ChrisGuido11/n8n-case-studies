/* Add your email in MAILTO. Leave "" to use the Netlify form. */
const MAILTO = "";

const PAGE_SCENES = {
  home: {
    write: {
      steps: [
        { node: "trigger", log: "trigger · brief in" },
        { node: "decide", log: "decide · source holds" },
        { node: "out", log: "write · file out", fields: { out: "Write" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "trigger · brief in" },
        { node: "decide", log: "decide · source missing", stop: true },
        { node: "out", log: "stop · no write", fields: { out: "Stop" }, cls: "halt" },
      ],
    },
  },
  moodboard: {
    write: {
      steps: [
        { node: "trigger", log: "style · line in" },
        { node: "decide", log: "board · builds" },
        { node: "out", log: "write · room dressed", fields: { out: "Dressed" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "style · line in" },
        { node: "decide", log: "decide · model gone", stop: true },
        { node: "out", log: "stop · furniture would float", fields: { out: "Stop" }, cls: "halt" },
      ],
    },
  },
  trends: {
    write: {
      steps: [
        { node: "trigger", log: "signals · list in" },
        { node: "decide", log: "call · the week" },
        { node: "out", log: "write · prediction out", fields: { out: "Called" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "signals · waiting" },
        { node: "decide", log: "decide · list never arrived", stop: true },
        { node: "out", log: "stop · no call", fields: { out: "Stop" }, cls: "halt" },
      ],
    },
  },
  competitor: {
    write: {
      steps: [
        { node: "trigger", log: "scrape · page in" },
        { node: "decide", log: "read · the field" },
        { node: "out", log: "write · snapshot — tie, no trophy", fields: { out: "Snap" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "scrape · page in" },
        { node: "decide", log: "decide · page empty", stop: true },
        { node: "out", log: "stop · no snapshot", fields: { out: "Stop" }, cls: "halt" },
      ],
    },
  },
  content: {
    write: {
      steps: [
        { node: "trigger", log: "reports · three in" },
        { node: "decide", log: "brief · writes" },
        { node: "out", log: "write · marketer ready", fields: { out: "Brief" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "reports · check" },
        { node: "decide", log: "decide · source missing", stop: true },
        { node: "out", log: "stop · no brief", fields: { out: "Stop" }, cls: "halt" },
      ],
    },
  },
  dashboard: {
    write: {
      steps: [
        { node: "trigger", log: "week · rows in" },
        { node: "decide", log: "tiles · fill" },
        { node: "out", log: "write · action a manager can take", fields: { out: "Act" }, cls: "ok" },
      ],
    },
    stop: {
      steps: [
        { node: "trigger", log: "week · in" },
        { node: "decide", log: "decide · no rows", stop: true },
        { node: "out", log: "stop · empty stays empty", fields: { out: "Empty" }, cls: "halt" },
      ],
    },
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function bindStage(stage) {
  const flowId = stage.dataset.scenes || "home";
  const scenes = PAGE_SCENES[flowId];
  if (!scenes) return;

  const token = stage.querySelector(".token");
  const logEl = stage.querySelector(".log");
  const nodes = [...stage.querySelectorAll(".node")];
  const tabs = [...stage.querySelectorAll(".paths [data-scene]")];
  const fields = {
    out: stage.querySelector('[data-field="out"]'),
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
    if (nodes[0]) moveToken("trigger");
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
    const scene = scenes[sceneId];
    if (!scene) return;
    const ticket = ++playId;
    clearTimers();
    resetBoard();
    stage.dataset.scene = sceneId;

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
    const active = stage.querySelector(".node.is-on, .node.is-stop") || nodes[0];
    if (active) moveToken(active.dataset.node);
  });

  if (token && logEl && tabs.length) {
    const start = () => play("write");
    if (flowId !== "home" && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || stage.dataset.started) return;
            stage.dataset.started = "1";
            start();
            io.disconnect();
          });
        },
        { threshold: 0.35 }
      );
      io.observe(stage);
    } else {
      start();
    }
  }
}

document.querySelectorAll(".stage").forEach(bindStage);

if (MAILTO) {
  const href = `mailto:${MAILTO}?subject=${encodeURIComponent("20-minute walk")}`;
  document.querySelectorAll('a.cta[href*="#book"]').forEach((a) => {
    a.setAttribute("href", href);
  });
}
