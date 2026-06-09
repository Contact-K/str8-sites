/* ============================================================================
   str(8) · 砂紋 / SAMON — karesansui (枯山水) raked-sand ripple motif
   ----------------------------------------------------------------------------
   A generative ambient background: the straight-line motif made organic.
   Whisper-quiet hairline streamlines that flow and part around "stones",
   with optional radial "blooms" (the aster/flower rake). Theme-aware
   (stroke = currentColor → set it to var(--line)) and resolution-independent
   (regenerates on resize). NO gradient, NO fill — paper stays flat.

   Usage:
     <div class="samon" data-samon
          data-gap="11" data-amp="16" data-wl="560"
          data-stones='[{"x":0.78,"y":0.42,"r":0.16,"s":1}]'
          data-blooms='[{"x":0.8,"y":0.4,"r":0.2,"petals":11,"s":1}]'></div>
     <script src="samon.js"></script>
   Or call manually:  s8Samon(element)
   ----------------------------------------------------------------------------
   data-* options (all optional):
     gap     line spacing px            (default 11)
     amp     base ripple amplitude px   (default 16)
     wl      base wavelength px         (default 560)
     step    x sample step px           (default 11)
     stroke  stroke width px            (default 1)
     stones  JSON [{x,y,r,s}]  x,y,r as fractions of box; s = strength
     blooms  JSON [{x,y,r,petals,s}]    radial aster focal points
   ========================================================================== */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;

  function num(el, key, d) { const v = parseFloat(el.dataset[key]); return isFinite(v) ? v : d; }
  function json(el, key) { try { return el.dataset[key] ? JSON.parse(el.dataset[key]) : []; } catch (e) { return []; } }

  function build(el) {
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;

    const gap = num(el, 'gap', 11);
    const amp = num(el, 'amp', 16);
    const wl = num(el, 'wl', 560);
    const step = num(el, 'step', 11);
    const sw = num(el, 'stroke', 1);
    const stones = json(el, 'stones');
    const blooms = json(el, 'blooms');
    const minD = Math.min(W, H);

    const paths = [];
    for (let y0 = -amp * 2; y0 <= H + amp * 2; y0 += gap) {
      let d = '';
      for (let x = 0; x <= W + step; x += step) {
        let y = y0;
        // primary + secondary ripple — coherent flowing field
        y += amp * Math.sin((x / wl) * TAU + y0 * 0.012);
        y += amp * 0.34 * Math.sin((x / (wl * 0.4)) * TAU + y0 * 0.03 + 1.3);

        // stones — lines part around a rock (gaussian vertical push)
        for (const st of stones) {
          const sx = st.x * W, sy = st.y * H, sr = (st.r || 0.16) * minD, s = st.s == null ? 1 : st.s;
          const dx = x - sx, dy = y0 - sy, dist = Math.hypot(dx, dy);
          const f = Math.exp(-(dist * dist) / (2 * sr * sr));
          y += (dy >= 0 ? 1 : -1) * f * sr * 0.72 * s;
        }
        // blooms — radial aster: bend lines into petals around a center
        for (const bl of blooms) {
          const bx = bl.x * W, by = bl.y * H, br = (bl.r || 0.2) * minD;
          const pet = bl.petals || 11, s = bl.s == null ? 1 : bl.s;
          const dx = x - bx, dy = y0 - by, dist = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
          const f = Math.exp(-(dist * dist) / (2 * br * br));
          y += Math.cos(pet * th) * f * br * 0.5 * s;
        }
        d += (x === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      paths.push('<path d="' + d.trim() + '"/>');
    }

    let svg = el.querySelector(':scope > svg.samon-svg');
    if (svg) svg.remove();
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'samon-svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none';
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="' + sw +
      '" stroke-linecap="round" vector-effect="non-scaling-stroke">' + paths.join('') + '</g>';

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.prepend(svg);
  }

  // debounced resize
  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function init(el) {
    build(el);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(debounce(() => build(el), 150));
      ro.observe(el);
    } else {
      window.addEventListener('resize', debounce(() => build(el), 150));
    }
  }

  window.s8Samon = build;
  window.s8SamonInit = init;

  function boot() { document.querySelectorAll('[data-samon]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
