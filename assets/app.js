/* ==========================================================================
   C# Oyun Atölyesi — etkileşimler
   1) C# sözdizimi renklendirme   2) kopyala düğmeleri
   3) görev takibi (localStorage) 4) canlı oyun döngüsü laboratuvarı
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1. Sözdizimi renklendirme                                          */
  /* ------------------------------------------------------------------ */

  var KEYWORDS = [
    "using", "namespace", "class", "struct", "static", "void", "int", "bool",
    "char", "double", "string", "var", "new", "return", "if", "else", "for",
    "while", "do", "break", "continue", "readonly", "const", "public", "private",
    "true", "false", "null", "this", "switch", "case", "default", "foreach",
    "in", "out", "ref", "try", "catch", "finally", "throw", "get", "set",
    "enum", "interface", "override", "virtual", "abstract", "base", "is", "as"
  ];

  var TYPES = [
    "Console", "ConsoleKey", "ConsoleKeyInfo", "StringBuilder", "Stopwatch",
    "Thread", "Environment", "List", "Random", "Encoding", "Math", "Konum",
    "Program", "YilanOyunu"
  ];

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightCSharp(source) {
    var escaped = escapeHtml(source);
    // sıra önemli: önce yorum ve metinler, sonra sayılar, en son kelimeler
    var re = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|('(?:[^'\\\n]|\\.)*')|\b(0x[0-9a-fA-F]+|\d+\.?\d*)\b|\b([A-Za-z_]\w*)\b(\s*\()?/g;
    var out = "";
    var last = 0;
    var m;

    while ((m = re.exec(escaped)) !== null) {
      out += escaped.slice(last, m.index);

      if (m[1]) {
        out += '<span class="tok-com">' + m[1] + "</span>";
      } else if (m[2] || m[3]) {
        out += '<span class="tok-str">' + (m[2] || m[3]) + "</span>";
      } else if (m[4]) {
        out += '<span class="tok-num">' + m[4] + "</span>";
      } else {
        var word = m[5];
        var looksLikeCall = !!m[6];
        if (KEYWORDS.indexOf(word) !== -1) {
          out += '<span class="tok-key">' + word + "</span>" + (m[6] || "");
        } else if (TYPES.indexOf(word) !== -1) {
          out += '<span class="tok-type">' + word + "</span>" + (m[6] || "");
        } else if (looksLikeCall) {
          out += '<span class="tok-fn">' + word + "</span>" + m[6];
        } else {
          out += word + (m[6] || "");
        }
      }

      last = re.lastIndex;
    }

    out += escaped.slice(last);
    return out;
  }

  function highlightBash(source) {
    return escapeHtml(source).replace(/(#[^\n]*)/g, '<span class="tok-com">$1</span>');
  }

  function applyHighlighting() {
    var blocks = document.querySelectorAll("pre code");
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block.dataset.highlighted === "1") continue;

      var lang = "";
      for (var j = 0; j < block.classList.length; j++) {
        if (block.classList[j].indexOf("language-") === 0) {
          lang = block.classList[j].replace("language-", "");
        }
      }

      var text = block.textContent;
      if (lang === "csharp") {
        block.innerHTML = highlightCSharp(text);
      } else if (lang === "bash") {
        block.innerHTML = highlightBash(text);
      }
      block.dataset.highlighted = "1";
    }
  }

  /* ------------------------------------------------------------------ */
  /* 2. Kopyala düğmeleri                                               */
  /* ------------------------------------------------------------------ */

  function addCopyButtons() {
    var panels = document.querySelectorAll(".code-panel");

    for (var i = 0; i < panels.length; i++) {
      (function (panel) {
        var head = panel.querySelector(".code-head");
        var code = panel.querySelector("pre code");
        if (!head || !code || head.querySelector(".copy-btn")) return;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.textContent = "kopyala";

        btn.addEventListener("click", function () {
          var text = code.textContent;

          function done() {
            btn.textContent = "kopyalandı ✓";
            btn.classList.add("copied");
            setTimeout(function () {
              btn.textContent = "kopyala";
              btn.classList.remove("copied");
            }, 1600);
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, fallback);
          } else {
            fallback();
          }

          function fallback() {
            var area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            try { document.execCommand("copy"); done(); } catch (e) { /* yoksay */ }
            document.body.removeChild(area);
          }
        });

        head.appendChild(btn);
      })(panels[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 3. Görev takibi                                                    */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = "csharp-yilan-gorevler-v1";

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveTasks(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* gizli sekme vb. */ }
  }

  function setupTaskTracking() {
    var checks = Array.prototype.slice.call(document.querySelectorAll(".task-check"));
    var state = loadTasks();
    var bar = document.getElementById("progress-bar");
    var label = document.getElementById("task-progress");

    function refresh() {
      var done = 0;

      for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) done++;
      }

      var percent = checks.length ? Math.round((done / checks.length) * 100) : 0;
      if (bar) bar.style.width = percent + "%";
      if (label) label.textContent = done + " / " + checks.length + " görev tamamlandı";

      // Bölüm kartlarını işaretle
      var steps = document.querySelectorAll(".step-card");
      for (var s = 0; s < steps.length; s++) {
        var chapter = steps[s].getAttribute("data-step");
        var chapterChecks = checks.filter(function (c) {
          return c.getAttribute("data-chapter") === chapter;
        });
        var allDone = chapterChecks.length > 0 && chapterChecks.every(function (c) {
          return c.checked;
        });
        steps[s].classList.toggle("done", allDone);
      }
    }

    for (var i = 0; i < checks.length; i++) {
      (function (check) {
        if (state[check.id]) check.checked = true;
        check.addEventListener("change", function () {
          var current = loadTasks();
          current[check.id] = check.checked;
          saveTasks(current);
          refresh();
        });
      })(checks[i]);
    }

    refresh();
  }

  /* ------------------------------------------------------------------ */
  /* 4. Canlı oyun döngüsü laboratuvarı                                 */
  /* ------------------------------------------------------------------ */

  function setupLab() {
    var gridEl = document.getElementById("lab-grid");
    if (!gridEl) return;

    var W = 28;
    var H = 16;

    var els = {
      toggle: document.getElementById("lab-toggle"),
      step: document.getElementById("lab-step"),
      reset: document.getElementById("lab-reset"),
      speed: document.getElementById("lab-speed"),
      speedVal: document.getElementById("lab-speed-val"),
      overlay: document.getElementById("lab-overlay"),
      overlayText: document.getElementById("lab-overlay-text"),
      restart: document.getElementById("lab-restart"),
      log: document.getElementById("lab-log"),
      dir: document.getElementById("st-dir"),
      head: document.getElementById("st-head"),
      len: document.getElementById("st-len"),
      score: document.getElementById("st-score"),
      steps: document.getElementById("st-steps"),
      state: document.getElementById("st-state")
    };

    var cells = [];
    for (var y = 0; y < H; y++) {
      var row = [];
      for (var x = 0; x < W; x++) {
        var cell = document.createElement("div");
        cell.className = "cell";
        gridEl.appendChild(cell);
        row.push(cell);
      }
      cells.push(row);
    }

    var G = {
      snake: [],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 20, y: 8 },
      score: 0,
      steps: 0,
      alive: true,
      running: false,
      acc: 0,
      lastTs: 0,
      sps: 5,
      raf: 0
    };

    var ARROWS = {
      "1,0": "→", "-1,0": "←", "0,1": "↓", "0,-1": "↑"
    };

    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function spawnFood() {
      var guard = 0;
      do {
        G.food = { x: randInt(1, W - 2), y: randInt(1, H - 2) };
        guard++;
      } while (guard < 500 && onSnake(G.food.x, G.food.y));
    }

    function onSnake(x, y) {
      for (var i = 0; i < G.snake.length; i++) {
        if (G.snake[i].x === x && G.snake[i].y === y) return true;
      }
      return false;
    }

    function log(message) {
      var line = document.createElement("div");
      line.textContent = message;
      els.log.insertBefore(line, els.log.firstChild);
      while (els.log.children.length > 4) {
        els.log.removeChild(els.log.lastChild);
      }
    }

    function render() {
      var y, x, i;

      for (y = 0; y < H; y++) {
        for (x = 0; x < W; x++) {
          var el = cells[y][x];
          var cls = "cell";
          if (x === 0 || x === W - 1 || y === 0 || y === H - 1) cls += " wall";
          el.className = cls;
        }
      }

      cells[G.food.y][G.food.x].className = "cell food";

      for (i = G.snake.length - 1; i >= 0; i--) {
        var p = G.snake[i];
        cells[p.y][p.x].className = "cell " + (i === 0 ? "head" : "body");
      }

      updateHud();
    }

    function updateHud() {
      var head = G.snake[0] || { x: 0, y: 0 };
      els.dir.textContent = ARROWS[G.dir.x + "," + G.dir.y] || "?";
      els.head.textContent = "(" + head.x + ", " + head.y + ")";
      els.len.textContent = String(G.snake.length);
      els.score.textContent = String(G.score);
      els.steps.textContent = String(G.steps);
      els.state.textContent = !G.alive ? "bitti" : (G.running ? "oynuyor" : "duraklatıldı");
    }

    function reset(quiet) {
      G.snake = [
        { x: 14, y: 8 },
        { x: 13, y: 8 },
        { x: 12, y: 8 }
      ];
      G.dir = { x: 1, y: 0 };
      G.nextDir = { x: 1, y: 0 };
      G.score = 0;
      G.steps = 0;
      G.alive = true;
      G.running = false;
      G.acc = 0;
      G.lastTs = 0;
      els.overlay.classList.remove("show");
      els.toggle.textContent = "▶ Başlat";
      spawnFood();
      render();
      if (!quiet) log("Yeni oyun kuruldu: uzunluk 3, yön →");
    }

    function die(reason) {
      G.alive = false;
      G.running = false;
      els.toggle.textContent = "▶ Başlat";
      els.overlayText.textContent = reason;
      els.overlay.classList.add("show");
      log("Oyun bitti — " + reason);
      updateHud();
    }

    // C#'taki Adim() fonksiyonunun birebir karşılığı
    function step() {
      if (!G.alive) return false;

      G.dir = G.nextDir;

      var head = G.snake[0];
      var next = { x: head.x + G.dir.x, y: head.y + G.dir.y };

      if (next.x <= 0 || next.x >= W - 1 || next.y <= 0 || next.y >= H - 1) {
        die("Duvara çarptın.");
        return false;
      }

      for (var i = 0; i < G.snake.length - 1; i++) {
        if (G.snake[i].x === next.x && G.snake[i].y === next.y) {
          die("Kendine çarptın.");
          return false;
        }
      }

      G.snake.unshift(next);
      G.steps++;

      if (next.x === G.food.x && next.y === G.food.y) {
        G.score += 10;
        log("Yem yendi → kuyruk silinmedi, uzunluk " + G.snake.length);
        spawnFood();
      } else {
        G.snake.pop();
      }

      render();
      return true;
    }

    function tick(ts) {
      if (!G.running) return;

      if (!G.lastTs) G.lastTs = ts;
      var dt = (ts - G.lastTs) / 1000;
      G.lastTs = ts;
      if (dt > 0.5) dt = 0.5; // sekme arka plandaysa sıçramayı engelle

      G.acc += dt;
      var interval = 1 / G.sps;
      var guard = 0;

      while (G.acc >= interval && guard < 4) {
        G.acc -= interval;
        guard++;
        if (!step()) break;
      }

      if (G.running) G.raf = requestAnimationFrame(tick);
    }

    function start() {
      if (!G.alive) reset(true);
      G.running = true;
      G.lastTs = 0;
      G.acc = 0;
      els.toggle.textContent = "⏸ Duraklat";
      updateHud();
      G.raf = requestAnimationFrame(tick);
    }

    function pause() {
      G.running = false;
      els.toggle.textContent = "▶ Başlat";
      updateHud();
      if (G.raf) cancelAnimationFrame(G.raf);
      G.raf = 0;
    }

    function setDir(dx, dy) {
      // 180° dönüşü C# kodundaki gibi engelle
      if (dx + G.dir.x === 0 && dy + G.dir.y === 0) return false;
      G.nextDir = { x: dx, y: dy };
      return true;
    }

    els.toggle.addEventListener("click", function () {
      if (G.running) pause();
      else start();
    });

    els.step.addEventListener("click", function () {
      if (G.running) pause();
      if (!G.alive) reset(true);
      step();
    });

    els.reset.addEventListener("click", function () {
      pause();
      reset(false);
    });

    els.restart.addEventListener("click", function () {
      reset(true);
      start();
    });

    els.speed.addEventListener("input", function () {
      G.sps = parseInt(els.speed.value, 10) || 5;
      els.speedVal.textContent = String(G.sps);
    });

    gridEl.setAttribute("tabindex", "0");
    gridEl.addEventListener("click", function () {
      gridEl.focus();
    });

    gridEl.addEventListener("keydown", function (event) {
      var handled = true;
      switch (event.key) {
        case "ArrowUp": case "w": case "W": setDir(0, -1); break;
        case "ArrowDown": case "s": case "S": setDir(0, 1); break;
        case "ArrowLeft": case "a": case "A": setDir(-1, 0); break;
        case "ArrowRight": case "d": case "D": setDir(1, 0); break;
        default: handled = false;
      }
      if (handled) event.preventDefault();
    });

    reset(true);
    log("Hazır. Başlat ya da tek adım at.");
  }

  /* ------------------------------------------------------------------ */
  /* 5. Tam kodu sayfaya yükle                                          */
  /* ------------------------------------------------------------------ */

  function loadFullCode() {
    var el = document.getElementById("full-code");
    if (!el) return;

    fetch("downloads/Snake.cs")
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then(function (text) {
        el.textContent = text;
        el.innerHTML = highlightCSharp(text);
        el.dataset.highlighted = "1";
      })
      .catch(function () {
        el.textContent = "Kod sayfaya yüklenemedi. Dosyayı indirip doğrudan inceleyebilirsin.";
      });
  }

  /* ------------------------------------------------------------------ */
  /* 6. Menüde aktif bölüm                                              */
  /* ------------------------------------------------------------------ */

  function setupScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    links.forEach(function (link) { byId[link.getAttribute("href").slice(1)] = link; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove("active"); });
        link.classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    ["nedir", "yol-haritasi", "lab", "bolumler", "indir", "sozluk"].forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Başlat                                                             */
  /* ------------------------------------------------------------------ */

  applyHighlighting();
  addCopyButtons();
  setupTaskTracking();
  setupLab();
  loadFullCode();
  setupScrollSpy();
})();
