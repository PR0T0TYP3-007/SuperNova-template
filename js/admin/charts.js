// Admin charts: small, dependency-free SVG/HTML charts following the
// data-viz method: thin marks, 2px surface gaps, 4px rounded data ends,
// recessive grid, hover tooltips, legend + direct labels, and a table view
// for every chart (the series colours sit below 3:1 on white, so the table
// and labels are the required relief).
(() => {
  const { h } = SN.ui;
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs = {}, ...kids) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => v != null && el.setAttribute(k, v));
    kids.flat(Infinity).forEach(c => c != null && el.append(c instanceof Node ? c : document.createTextNode(String(c))));
    return el;
  };
  // Sequential blue ramp (reference palette), light → dark.
  const SEQ = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];

  // ---- Tooltip (one for the page) -----------------------------------------------
  let tipEl;
  const tip = {
    show(x, y, rows) {
      if (!tipEl) { tipEl = h('div', { class: 'viz-tip', role: 'status' }); document.body.append(tipEl); }
      tipEl.replaceChildren(...rows.map(([label, val, color]) => h('div', { class: 'viz-tip__row' },
        color ? h('span', { class: 'viz-tip__sw', style: `background:${color}` }) : null,
        h('span', { class: 'viz-tip__k', text: label }), val != null ? h('b', { text: val }) : null)));
      tipEl.hidden = false;
      const r = tipEl.getBoundingClientRect();
      const left = Math.min(innerWidth - r.width - 8, Math.max(8, x + 14));
      const top = y - r.height - 12 < 8 ? y + 16 : y - r.height - 12;
      tipEl.style.transform = `translate(${left}px, ${top}px)`;
    },
    hide() { if (tipEl) tipEl.hidden = true; }
  };

  // ---- Frame: title, legend, chart/table toggle ---------------------------------------
  function frame({ title, sub, legend, body, table, height }) {
    const plot = h('div', { class: 'viz-plot', style: height ? `height:${height}px` : null });
    const tableEl = h('div', { class: 'viz-table', hidden: true });
    if (table) tableEl.append(h('table', null,
      h('thead', null, h('tr', null, table.head.map(c => h('th', { scope: 'col', text: c })))),
      h('tbody', null, table.rows.map(r => h('tr', null, r.map((c, i) => h(i ? 'td' : 'th', { scope: i ? null : 'row', text: c })))))));
    const toggle = table ? h('button', { class: 'viz-toggle', type: 'button', 'aria-pressed': 'false', onclick: e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(on));
      e.currentTarget.textContent = on ? 'Chart' : 'Table';
      plot.hidden = on; tableEl.hidden = !on; if (legendEl) legendEl.hidden = on;
    } }, 'Table') : null;
    const legendEl = legend && legend.length > 1 ? h('ul', { class: 'viz-legend' }, legend.map(l => h('li', null, h('span', { class: 'viz-legend__sw', style: `background:${l.color}` }), l.name))) : null;
    const fig = h('figure', { class: 'viz' },
      h('div', { class: 'viz-head' }, h('div', null, title ? h('figcaption', { class: 'viz-title', text: title }) : null, sub ? h('p', { class: 'viz-sub', text: sub }) : null), toggle),
      legendEl, plot, tableEl);
    body(plot);
    return fig;
  }

  // Draw now and on resize so text stays crisp at any width.
  function responsive(plot, draw) {
    let w = 0;
    const ro = new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (nw && nw !== w) { w = nw; plot.replaceChildren(draw(w, plot.clientHeight || 220)); } });
    ro.observe(plot);
  }
  const niceMax = v => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };

  // ---- Area/line: one series over time -----------------------------------------------------
  function area({ title, sub, points, color = '#2a78d6', format = String, xLabel, height = 220, name = 'Value' }) {
    return frame({
      title, sub, height,
      table: { head: ['Date', name], rows: points.map(p => [xLabel(p.t), format(p.v)]) },
      body: plot => responsive(plot, (W, H) => {
        const pad = { l: 52, r: 12, t: 12, b: 26 };
        const max = niceMax(Math.max(...points.map(p => p.v)));
        const x = i => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r);
        const y = v => pad.t + (1 - v / max) * (H - pad.t - pad.b);
        const svg = s('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': title });
        [0, 0.5, 1].forEach(f => {
          svg.append(s('line', { x1: pad.l, x2: W - pad.r, y1: y(max * f), y2: y(max * f), class: 'viz-grid' }));
          svg.append(s('text', { x: pad.l - 8, y: y(max * f) + 4, class: 'viz-axis', 'text-anchor': 'end' }, format(max * f)));
        });
        const step = Math.ceil(points.length / Math.max(2, Math.floor((W - 80) / 70)));
        points.forEach((p, i) => { if (i % step === 0 || i === points.length - 1) svg.append(s('text', { x: x(i), y: H - 6, class: 'viz-axis', 'text-anchor': i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle' }, xLabel(p.t))); });
        const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
        svg.append(s('path', { d: `${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`, fill: color, opacity: 0.14 }));
        svg.append(s('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
        // Direct label on the last point.
        const last = points[points.length - 1];
        svg.append(s('circle', { cx: x(points.length - 1), cy: y(last.v), r: 4, fill: color, stroke: '#fff', 'stroke-width': 2 }));
        // Crosshair + tooltip.
        const cross = s('line', { y1: pad.t, y2: H - pad.b, class: 'viz-cross', visibility: 'hidden' });
        const dot = s('circle', { r: 5, fill: color, stroke: '#fff', 'stroke-width': 2, visibility: 'hidden' });
        const hit = s('rect', { x: pad.l, y: pad.t, width: W - pad.l - pad.r, height: H - pad.t - pad.b, fill: 'transparent' });
        hit.addEventListener('pointermove', e => {
          const bx = svg.getBoundingClientRect();
          const i = Math.round(((e.clientX - bx.left - pad.l) / (W - pad.l - pad.r)) * (points.length - 1));
          const p = points[Math.max(0, Math.min(points.length - 1, i))];
          const ix = x(points.indexOf(p));
          cross.setAttribute('x1', ix); cross.setAttribute('x2', ix); cross.setAttribute('visibility', 'visible');
          dot.setAttribute('cx', ix); dot.setAttribute('cy', y(p.v)); dot.setAttribute('visibility', 'visible');
          tip.show(e.clientX, e.clientY, [[xLabel(p.t)], [name, format(p.v), color]]);
        });
        hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hide(); });
        svg.append(cross, dot, hit);
        return svg;
      })
    });
  }

  // ---- Stacked columns: categories over time ------------------------------------------------
  function stacked({ title, sub, cats, series, format = String, catLabel, height = 240 }) {
    const totals = cats.map((_, i) => series.reduce((sum, se) => sum + se.values[i], 0));
    return frame({
      title, sub, height, legend: series.map(se => ({ name: se.name, color: se.color })),
      table: { head: ['Date', ...series.map(se => se.name), 'Total'], rows: cats.map((c, i) => [catLabel(c), ...series.map(se => format(se.values[i])), format(totals[i])]) },
      body: plot => responsive(plot, (W, H) => {
        const pad = { l: 52, r: 12, t: 18, b: 26 };
        const max = niceMax(Math.max(...totals));
        const bw = (W - pad.l - pad.r) / cats.length;
        const barW = Math.max(3, Math.min(28, bw - 2));
        const y = v => pad.t + (1 - v / max) * (H - pad.t - pad.b);
        const svg = s('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'viz-svg', role: 'img', 'aria-label': title });
        [0, 0.5, 1].forEach(f => {
          svg.append(s('line', { x1: pad.l, x2: W - pad.r, y1: y(max * f), y2: y(max * f), class: 'viz-grid' }));
          svg.append(s('text', { x: pad.l - 8, y: y(max * f) + 4, class: 'viz-axis', 'text-anchor': 'end' }, format(max * f)));
        });
        const step = Math.ceil(cats.length / Math.max(2, Math.floor((W - 80) / 64)));
        cats.forEach((c, i) => {
          const cx = pad.l + i * bw + bw / 2;
          if (i % step === 0 || i === cats.length - 1) svg.append(s('text', { x: cx, y: H - 6, class: 'viz-axis', 'text-anchor': 'middle' }, catLabel(c)));
          let acc = 0;
          const g = s('g', { class: 'viz-col' });
          series.forEach((se, si) => {
            const v = se.values[i];
            if (!v) return;
            const top = y(acc + v), bottom = y(acc);
            const isTop = series.slice(si + 1).every(x => !x.values[i]);
            const hgt = Math.max(0, bottom - top - (acc ? 2 : 0));   // 2px surface gap between segments
            const r = isTop ? Math.min(4, barW / 2, hgt) : 0;
            const x0 = cx - barW / 2, y0 = top;
            g.append(s('path', { fill: se.color, d: r
              ? `M${x0},${y0 + hgt}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + barW - r}Q${x0 + barW},${y0} ${x0 + barW},${y0 + r}V${y0 + hgt}Z`
              : `M${x0},${y0}h${barW}v${hgt}h${-barW}Z` }));
            acc += v;
          });
          const hit = s('rect', { x: pad.l + i * bw, y: pad.t, width: bw, height: H - pad.t - pad.b, fill: 'transparent' });
          hit.addEventListener('pointermove', e => { g.classList.add('is-on'); tip.show(e.clientX, e.clientY, [[catLabel(c)], ...series.map(se => [se.name, format(se.values[i]), se.color]), ['Total', format(totals[i])]]); });
          hit.addEventListener('pointerleave', () => { g.classList.remove('is-on'); tip.hide(); });
          svg.append(g, hit);
        });
        return svg;
      })
    });
  }

  // ---- Horizontal bars (HTML): ranked magnitudes ---------------------------------------------
  function bars({ title, sub, rows, format = String, color = '#2a78d6', name = 'Value' }) {
    const max = Math.max(1, ...rows.map(r => r.value));
    return frame({
      title, sub,
      table: { head: ['', name], rows: rows.map(r => [r.label, format(r.value)]) },
      body: plot => plot.append(h('ol', { class: 'viz-bars' }, rows.map(r => h('li', {
        onpointermove: e => tip.show(e.clientX, e.clientY, [[r.label], [name, format(r.value), color], ...(r.extra || [])]),
        onpointerleave: () => tip.hide()
      },
        h('span', { class: 'viz-bars__label' }, r.label, r.sub ? h('small', { text: r.sub }) : null),
        h('span', { class: 'viz-bars__track' }, h('span', { class: 'viz-bars__fill', style: `width:${(r.value / max) * 100}%;background:${color}` })),
        h('span', { class: 'viz-bars__val', text: format(r.value) })))))
    });
  }

  // ---- Heatmap (HTML grid): weekday × hour ------------------------------------------------------
  function heatmap({ title, sub, rows, cols, values, format = String }) {
    const max = Math.max(1, ...values.flat());
    const shade = v => (v ? SEQ[Math.min(SEQ.length - 1, Math.round((v / max) * (SEQ.length - 1)))] : '#f3efe6');
    return frame({
      title, sub,
      table: { head: ['', ...cols], rows: rows.map((r, i) => [r, ...values[i].map(format)]) },
      body: plot => plot.append(h('div', { class: 'viz-heat', style: `grid-template-columns: 34px repeat(${cols.length}, 1fr)` },
        h('span'), cols.map((c, i) => h('span', { class: 'viz-heat__col', text: i % 3 === 0 ? c : '' })),
        rows.map((r, ri) => [h('span', { class: 'viz-heat__row', text: r }), values[ri].map((v, ci) => h('span', {
          class: 'viz-heat__cell', style: `background:${shade(v)}`,
          onpointermove: e => tip.show(e.clientX, e.clientY, [[`${r} ${cols[ci]}`], ['Orders', format(v), shade(v)]]),
          onpointerleave: () => tip.hide()
        }))]).flat()),
        h('div', { class: 'viz-scale' }, h('span', { text: 'Fewer' }), h('span', { class: 'viz-scale__bar', style: `background:linear-gradient(90deg, ${SEQ[0]}, ${SEQ[6]}, ${SEQ[12]})` }), h('span', { text: 'More orders' })))
    });
  }

  // ---- Sparkline for stat tiles ---------------------------------------------------------------------
  function spark(values, color = '#2a78d6') {
    const W = 120, H = 30, max = Math.max(1, ...values), min = Math.min(...values);
    const x = i => (i / Math.max(1, values.length - 1)) * W;
    const y = v => H - 3 - ((v - min) / Math.max(1, max - min)) * (H - 6);
    return s('svg', { class: 'adm-spark', width: W, height: H, viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true' },
      s('path', { d: values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(''), fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }

  SN.viz = { area, stacked, bars, heatmap, spark, tip, COLORS: { crunchies: '#eda100', roots: '#1baf7a', primary: '#2a78d6' } };
})();
