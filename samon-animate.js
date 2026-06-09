/**
 * samon-animate.js — animated, randomised 砂紋 background for str(8)
 * Cycles through 5 pattern types with cross-fade.
 * Requires samon.js (window.s8Samon) to be loaded first.
 *
 * Usage:
 *   <div class="samon-animated"></div>
 *   <script src="samon.js"></script>
 *   <script src="samon-animate.js"></script>
 */
(function () {
  const INTERVAL = 10000;  // ms between transitions
  const FADE     = 4000;   // ms cross-fade duration

  /* ── helpers ── */
  function rand(min, max)    { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr)         { return arr[randInt(0, arr.length - 1)]; }

  /* ── 5 pattern generators ── */
  const PATTERNS = [

    // 0 · 流 — field only, pure sine waves
    function fieldOnly() {
      return {
        gap: rand(11, 18), amp: rand(5, 13), wl: rand(540, 860), step: rand(11, 18),
      };
    },

    // 1 · 石 — single stone, lines part around it, no bloom
    function singleStone() {
      return {
        gap: rand(10, 15), amp: rand(9, 18), wl: rand(480, 740), step: rand(10, 15),
        stones: [{ x: rand(0.12, 0.88), y: rand(0.12, 0.88), r: rand(0.10, 0.22), s: rand(0.8, 1.4) }],
      };
    },

    // 2 · 花 — radial bloom only, varied petal count
    //   3 = triangle / 4 = quad / 5 = star / 6 = hex / 8 = asterisk / 10-13 = flower
    function bloomOnly() {
      return {
        gap: rand(9, 14), amp: rand(7, 15), wl: rand(460, 710), step: rand(9, 14),
        blooms: [{
          x: rand(0.15, 0.85), y: rand(0.15, 0.85),
          r: rand(0.20, 0.42),
          petals: pick([3, 4, 5, 6, 8, 10, 11, 12, 13]),
          s: rand(0.7, 1.1),
        }],
      };
    },

    // 3 · 石+花 — stone with matching bloom (classic samon look)
    function stoneBloom() {
      const x = rand(0.15, 0.85), y = rand(0.15, 0.85);
      return {
        gap: rand(10, 14), amp: rand(9, 16), wl: rand(500, 720), step: rand(10, 14),
        stones: [{ x, y, r: rand(0.10, 0.18), s: rand(0.9, 1.2) }],
        blooms: [{ x, y, r: rand(0.22, 0.36), petals: pick([6, 8, 10, 11, 12, 13]), s: rand(0.7, 1.0) }],
      };
    },

    // 4 · 群石 — two stones, no bloom
    function twoStones() {
      return {
        gap: rand(12, 17), amp: rand(7, 13), wl: rand(520, 780), step: rand(12, 17),
        stones: [
          { x: rand(0.10, 0.42), y: rand(0.15, 0.85), r: rand(0.08, 0.17), s: rand(0.8, 1.2) },
          { x: rand(0.58, 0.90), y: rand(0.15, 0.85), r: rand(0.07, 0.15), s: rand(0.7, 1.1) },
        ],
      };
    },

  ];

  /* ── apply config to a layer element and render ── */
  function applyConfig(el, cfg) {
    el.dataset.gap  = cfg.gap.toFixed(1);
    el.dataset.amp  = cfg.amp.toFixed(1);
    el.dataset.wl   = Math.round(cfg.wl);
    el.dataset.step = cfg.step.toFixed(1);

    if (cfg.stones) {
      el.dataset.stones = JSON.stringify(cfg.stones.map(function (s) {
        return { x: +s.x.toFixed(3), y: +s.y.toFixed(3), r: +s.r.toFixed(3), s: +s.s.toFixed(2) };
      }));
    } else {
      delete el.dataset.stones;
    }

    if (cfg.blooms) {
      el.dataset.blooms = JSON.stringify(cfg.blooms.map(function (b) {
        return { x: +b.x.toFixed(3), y: +b.y.toFixed(3), r: +b.r.toFixed(3), petals: b.petals, s: +b.s.toFixed(2) };
      }));
    } else {
      delete el.dataset.blooms;
    }

    if (window.s8Samon) s8Samon(el);
  }

  function randomCfg() { return PATTERNS[randInt(0, PATTERNS.length - 1)](); }

  /* ── set up animated container ── */
  function initAnimated(container) {
    // two layers for cross-fading
    var baseStyle = 'position:absolute;inset:0;transition:opacity ' + FADE + 'ms ease;';
    var layerA = document.createElement('div');
    var layerB = document.createElement('div');
    layerA.style.cssText = baseStyle + 'opacity:1;';
    layerB.style.cssText = baseStyle + 'opacity:0;';
    container.appendChild(layerA);
    container.appendChild(layerB);

    // seed first frame
    applyConfig(layerA, randomCfg());

    var front = layerA, back = layerB;

    setInterval(function () {
      applyConfig(back, randomCfg());
      back.style.opacity  = '1';
      front.style.opacity = '0';
      // swap
      var tmp = front; front = back; back = tmp;
    }, INTERVAL);

    // redraw on resize (both layers)
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (window.s8Samon) { s8Samon(front); s8Samon(back); }
      });
      ro.observe(container);
    }
  }

  /* ── auto-boot ── */
  function boot() {
    document.querySelectorAll('.samon-animated').forEach(initAnimated);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.s8SamonAnimate = initAnimated;
})();
