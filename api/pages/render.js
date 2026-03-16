// api/pages/render.js
// ─────────────────────────────────────────────────────────
// GET /api/pages/:slug/render
// Returnează HTML complet al paginii (pentru server-side rendering)
// Citește din Supabase, rulează PageRenderer, returnează HTML full.
// ─────────────────────────────────────────────────────────

import { getDB }                  from '../../lib/db.js';
import { setCors, handleOptions } from '../../lib/auth.js';

// Inline renderer (nu putem importa ES modules client-side în Node serverless direct)
// Aceasta e versiunea Node.js a renderer-ului din public/admin/renderer.js

class PageRenderer {
  constructor() { this.editMode = false; }

  renderPage(pageData) {
    const sections = (pageData.sections || []).sort((a, b) => (a.order||0) - (b.order||0));
    return sections.map(s => this.renderSection(s)).join('\n');
  }

  renderSection(section) {
    const { id, type, props = {} } = section;
    if (type === 'galaxy_header' || props.locked) return '';
    return this[`render_${type}`]?.(props) || '';
  }

  esc(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  nl2br(s=''){return String(s).replace(/\n/g,'<br>')}
  gradient(title=''){
    const w=title.trim().split(' ');
    if(w.length<=1)return`<span class="g">${this.esc(title)}</span>`;
    const last=w.pop();
    return`${this.esc(w.join(' '))} <span class="g">${this.esc(last)}</span>`;
  }

  render_spacer({height=48}={}){return`<div style="height:${height}px"></div>`}
  render_divider({style='solid',color='rgba(139,92,246,0.2)',marginY=16}={}){return`<div style="margin:${marginY}px 40px"><hr style="border:none;border-top:1px ${style} ${color}"></div>`}

  render_hero({eyebrow,title,subtitle,ctaText,ctaLink,ctaIcon='rocket_launch',align='center',paddingY=80,showEyebrow=true,showCta=true}={}){
    return`<section class="sec-hero" style="padding:${paddingY}px 40px;text-align:${align}">
      ${showEyebrow&&eyebrow?`<div class="eyebrow"><span class="ey-line"></span>${this.esc(eyebrow)}<span class="ey-line"></span></div>`:''}
      <div class="hero-title">${this.gradient(title)}</div>
      ${subtitle?`<p class="hero-sub">${this.esc(subtitle)}</p>`:''}
      ${showCta&&ctaText?`<a href="${this.esc(ctaLink||'#')}" class="cta-btn"><span class="material-symbols-rounded">${this.esc(ctaIcon)}</span>${this.esc(ctaText)}</a>`:''}
    </section>`;
  }

  render_text({title,content='',align='left',fontSize=15,paddingY=32,paddingX=40,showTitle=false}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px;text-align:${align}">
      ${showTitle&&title?`<h2 class="sec-title">${this.esc(title)}</h2>`:''}
      <div style="font-size:${fontSize}px">${this.nl2br(content)}</div>
    </section>`;
  }

  render_stats({items=[],columns=4,paddingY=40,paddingX=40}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px">
      <div class="stats" style="grid-template-columns:repeat(${columns},1fr)">
        ${items.map(it=>`<div class="st"><div class="st-v">${this.esc(it.value)}</div><div class="st-l">${this.esc(it.label)}</div></div>`).join('')}
      </div>
    </section>`;
  }

  render_cards({title='',showTitle=true,cards=[],columns=3,paddingY=40,paddingX=40}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px">
      ${showTitle&&title?`<h2 class="sec-title">${this.esc(title)}</h2>`:''}
      <div class="feat-grid" style="grid-template-columns:repeat(${columns},1fr)">
        ${cards.map(c=>`<div class="feat-card gl base"><div class="fc-icon"><span class="material-symbols-rounded">${this.esc(c.icon||'star')}</span></div><div class="fc-title">${this.esc(c.title)}</div><div class="fc-desc">${this.esc(c.desc)}</div></div>`).join('')}
      </div>
    </section>`;
  }

  render_faq({title='FAQ',showTitle=true,items=[],paddingY=40,paddingX=40}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px">
      ${showTitle&&title?`<h2 class="sec-title">${this.esc(title)}</h2>`:''}
      <div class="faq-list">
        ${items.map(it=>`<div class="faq-item"><div class="faq-q"><span>${this.esc(it.q)}</span><span class="material-symbols-rounded fi-chev">expand_more</span></div><div class="faq-a">${this.nl2br(it.a)}</div></div>`).join('')}
      </div>
    </section>`;
  }

  render_cta({title='',subtitle='',ctaText='',ctaLink='#',ctaIcon='rocket_launch',secondaryText='',secondaryLink='#',showSecondary=false,paddingY=56,bgStyle='gradient'}={}){
    const bg=bgStyle==='gradient'?'background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(219,39,119,.12))':bgStyle==='solid'?'background:rgba(255,255,255,.04)':'';
    return`<section style="padding:${paddingY}px 40px;text-align:center;${bg};border-radius:20px">
      ${title?`<h2 class="cta-title">${this.esc(title)}</h2>`:''}
      ${subtitle?`<p class="cta-sub">${this.esc(subtitle)}</p>`:''}
      <div class="cta-actions">
        ${ctaText?`<a href="${this.esc(ctaLink)}" class="cta-btn"><span class="material-symbols-rounded">${this.esc(ctaIcon)}</span>${this.esc(ctaText)}</a>`:''}
        ${showSecondary&&secondaryText?`<a href="${this.esc(secondaryLink)}" class="cta-btn-sec">${this.esc(secondaryText)}</a>`:''}
      </div>
    </section>`;
  }

  render_pricing({title='',subtitle='',showTitle=true,plans=[],paddingY=56,paddingX=40}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px">
      ${showTitle&&title?`<h2 class="sec-title">${this.esc(title)}</h2>`:''}
      ${subtitle?`<p class="sec-subtitle">${this.esc(subtitle)}</p>`:''}
      <div class="pricing-grid">
        ${plans.map(p=>`<div class="price-card gl ${p.highlighted?'highlighted':'base'}">
          ${p.badge?`<div class="price-badge">${this.esc(p.badge)}</div>`:''}
          <div class="price-name">${this.esc(p.name)}</div>
          <div class="price-amount"><span class="price-cur">${this.esc(p.currency||'$')}</span><span class="price-val">${this.esc(p.price)}</span><span class="price-per">${this.esc(p.period||'/lună')}</span></div>
          ${p.total?`<div class="price-total">${this.esc(p.total)}</div>`:''}
          <ul class="price-features">${(p.features||[]).map(f=>`<li><span class="material-symbols-rounded">check_circle</span>${this.esc(f)}</li>`).join('')}</ul>
          <a href="${this.esc(p.ctaLink||'#')}" class="cta-btn">${this.esc(p.ctaText||'Alege planul')}</a>
        </div>`).join('')}
      </div>
    </section>`;
  }

  render_testimonials({title='',showTitle=true,items=[],columns=3,paddingY=48,paddingX=40}={}){
    return`<section style="padding:${paddingY}px ${paddingX}px">
      ${showTitle&&title?`<h2 class="sec-title">${this.esc(title)}</h2>`:''}
      <div class="testi-grid" style="grid-template-columns:repeat(${columns},1fr)">
        ${items.map(t=>`<div class="testi-card gl base">
          <div class="testi-stars">${'★'.repeat(t.rating||5)}</div>
          <div class="testi-text">${this.esc(t.text)}</div>
          <div class="testi-author">
            ${t.avatar?`<img src="${this.esc(t.avatar)}" class="testi-avatar">`:`<div class="testi-avatar-ph">${this.esc((t.name||'?')[0])}</div>`}
            <div><div class="testi-name">${this.esc(t.name)}</div><div class="testi-role">${this.esc(t.role)}</div></div>
          </div>
        </div>`).join('')}
      </div>
    </section>`;
  }

  render_columns({ cols = 2, gap = 24, cells = [], paddingY = 32, paddingX = 40 } = {}) {
    const cellHtml = cells.map(c => `<div class="col-cell">${this.nl2br(c.content || '')}</div>`).join('');
    return `<section class="w-cols" style="padding:${paddingY}px ${paddingX}px">
      <div class="cols-layout" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px">
        ${cellHtml}
      </div>
    </section>`;
  }

  render_tutorials_grid({ title = '', showTitle = false, categories = [], courses = [], paddingY = 48, paddingX = 40 } = {}) {
    const catHtml = (categories || []).map((cat, idx) => `
      <button class="cat-btn ${idx === 0 ? 'active' : ''}">
        <span class="material-symbols-rounded">${this.esc(cat.icon || 'apps')}</span>
        <span>${this.esc(cat.label)}</span>
      </button>`).join('');

    const courseHtml = (courses || []).map(c => {
      const levelClass = (c.level || 'Beginner').toLowerCase();
      return `
        <div class="course-card">
          <div class="cc-thumb" style="background-image:url('${this.esc(c.thumbnailUrl)}');background-size:cover;background-position:center;">
            <div class="cc-thumb-icon"><span class="material-symbols-rounded">play_circle</span></div>
            <div class="cc-play-overlay"><div class="cc-play-btn"><span class="material-symbols-rounded">play_arrow</span></div></div>
            <div class="cc-level ${levelClass}">${this.esc(c.level)}</div>
            <div class="cc-duration"><span class="material-symbols-rounded">schedule</span><span>${this.esc(c.duration)}</span></div>
          </div>
          <div class="cc-body">
            <div class="cc-cat">${this.esc(c.category)}</div>
            <div class="cc-title">${this.esc(c.title)}</div>
            <div class="cc-desc">${this.esc(c.desc)}</div>
            <div class="cc-footer">
              <button class="cc-btn" data-video="${this.esc(c.youtubeUrl)}"><span class="material-symbols-rounded">play_arrow</span>Start</button>
            </div>
          </div>
        </div>`;
    }).join('');

    return `
      <section class="w-tutorials-grid" style="padding:${paddingY}px ${paddingX}px">
        ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
        <div class="cats">${catHtml}</div>
        <div class="course-grid">${courseHtml}</div>
      </section>`;
  }

  // ── TUT_HERO ──────────────────────────────────────────
  render_tut_hero({ eyebrowIcon = 'school', eyebrowText = 'ORYNTech Hero', title = 'Academy & Docs', subtitle = '', searchPlaceholder = 'Caută...', stats = [] } = {}) {
    const statsHtml = (stats || []).map(s => `
      <div class="tut-stat">
        <span class="tut-stat-n">${this.esc(s.value)}</span>
        <span class="tut-stat-l">${this.esc(s.label)}</span>
      </div>`).join('');

    return `
      <section class="tut-hero">
        <div class="tut-hero-left">
          <div class="tut-eyebrow">
            <span class="material-symbols-rounded" style="font-size:13px">${this.esc(eyebrowIcon)}</span>
            <span>${this.esc(eyebrowText)}</span>
          </div>
          <h1>${title}</h1>
          <p class="tut-hero-sub">${this.esc(subtitle)}</p>
          <div class="tut-stats">${statsHtml}</div>
        </div>
        <div class="tut-hero-search">
          <div class="search-box">
            <span class="material-symbols-rounded">search</span>
            <input type="text" placeholder="${this.esc(searchPlaceholder)}">
          </div>
        </div>
      </section>`;
  }

  // ── TUT_FEATURED ───────────────────────────────────────
  render_tut_featured({ label = '', badgeIcon = 'star', badgeText = '', title = '', desc = '', metaItems = [], videoUrl = '' } = {}) {
    const metaHtml = (metaItems || []).map(m => `
      <div class="feat-meta-item">
        <span class="material-symbols-rounded">${this.esc(m.icon)}</span>
        <span>${this.esc(m.text)}</span>
      </div>`).join('');

    return `
      <section class="featured-section">
        <div class="section-label">${this.esc(label)}</div>
        <div class="featured-card">
          <div>
            <div class="feat-badge">
              <span class="material-symbols-rounded" style="font-size:12px">${this.esc(badgeIcon)}</span>
              <span>${this.esc(badgeText)}</span>
            </div>
            <h2 class="feat-title">${this.esc(title)}</h2>
            <p class="feat-desc">${this.esc(desc)}</p>
            <div class="feat-meta">${metaHtml}</div>
          </div>
          <div class="feat-play" data-video="${this.esc(videoUrl)}"><span class="material-symbols-rounded">play_arrow</span></div>
        </div>
      </section>`;
  }

  // ── TUT_PATHS ──────────────────────────────────────────
  render_tut_paths({ label = '', paths = [] } = {}) {
    const pathsHtml = (paths || []).map(p => `
      <div class="path-card">
        <div class="path-icon"><span class="material-symbols-rounded">${this.esc(p.icon)}</span></div>
        <div class="path-name">${this.esc(p.name)}</div>
        <div class="path-count">${this.esc(p.count)}</div>
      </div>`).join('');

    return `
      <section class="path-section">
        <div class="section-label">${this.esc(label)}</div>
        <div class="path-cards">${pathsHtml}</div>
      </section>`;
  }

  // ── TRIAL_HERO ─────────────────────────────────────────
  render_trial_hero({ eyebrow = '', title1 = '', title2 = '', subtitle = '', badges = [], ctaText = '', ctaLink = '', ctaNote = '' } = {}) {
    const badgesHtml = (badges || []).map((b, idx) => `
      <div class="bdg">
        ${idx === 0 ? '<span class="pulse-dot"></span> ' : ''}
        <span>${this.esc(typeof b === 'string' ? b : b.text)}</span>
      </div>`).join('');

    return `
      <div class="hero">
        <div class="eyebrow"><span class="ey-line"></span><span>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <span class="hl-1">${this.esc(title1)}</span>
        <span class="hl-2">${this.esc(title2)}</span>
        <p class="hero-sub">${this.nl2br(subtitle)}</p>
        <div class="bdgs">${badgesHtml}</div>
        <a href="${this.esc(ctaLink)}" class="cta-btn">${this.esc(ctaText)}</a>
        <span class="cta-note">${this.esc(ctaNote)}</span>
      </div>`;
  }

  // ── PROBLEMS_GRID ──────────────────────────────────────
  render_problems_grid({ eyebrow = '', title = '', subtitle = '', items = [] } = {}) {
    const itemsHtml = (items || []).map(it => `
      <div class="prob-item">
        <span class="material-symbols-rounded prob-ms">${this.esc(it.icon)}</span>
        <div class="prob-title">${this.esc(it.title)}</div>
        <div class="prob-desc">${this.esc(it.desc)}</div>
      </div>`).join('');

    return `
      <div class="sec">
        <div class="eyebrow-sm"><span class="ey-line"></span><span>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <h2 class="sec-h">${title}</h2>
        <p class="sec-sub">${this.esc(subtitle)}</p>
        <div class="prob-grid">${itemsHtml}</div>
      </div>`;
  }

  // ── BRIDGE_BANNER ──────────────────────────────────────
  render_bridge_banner({ title = '', subtitle = '' } = {}) {
    return `
      <div class="bridge">
        <div class="gl-rim"></div><div class="shine"></div>
        <div class="bcb1"></div><div class="bcb2"></div>
        <div class="bridge-in">
          <h2>${title}</h2>
          <p>${this.nl2br(subtitle)}</p>
        </div>
      </div>`;
  }

  // ── BEFORE_AFTER_TABLE ─────────────────────────────────
  render_before_after_table({ eyebrow = '', title = '', beforeTitle = '', afterTitle = '', rows = [] } = {}) {
    const beforeRows = (rows || []).map(r => `<div class="ba-row"><span class="material-symbols-rounded ba-ms">sms_failed</span><span>${this.esc(r.before)}</span></div>`).join('');
    const afterRows = (rows || []).map(r => `<div class="ba-row"><span class="material-symbols-rounded ba-ms">bolt</span><span>${this.esc(r.after)}</span></div>`).join('');

    return `
      <div class="sec">
        <div class="eyebrow-sm"><span class="ey-line"></span><span>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <h2 class="sec-h">${title}</h2>
        <div class="ba-wrap">
          <div class="ba-col before">
            <div class="ba-header"><span class="material-symbols-rounded" style="font-size:14px">close</span><span>${this.esc(beforeTitle)}</span></div>
            ${beforeRows}
          </div>
          <div class="ba-col after">
            <div class="ba-header"><span class="material-symbols-rounded" style="font-size:14px">check</span><span>${this.esc(afterTitle)}</span></div>
            ${afterRows}
          </div>
        </div>
      </div>`;
  }

  // ── HOME_HERO ──────────────────────────────────────────
  render_home_hero({ eyebrow = '', title1 = '', title2 = '', subtitle = '', badges = [] } = {}) {
    const badgesHtml = (badges || []).map(b => `
      <div class="bdg"><span>${this.esc(b.text)}</span></div>`).join('');

    return `
      <div class="hero">
        <div class="eyebrow"><span class="ey-line"></span><span>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <span class="hl-1">${this.esc(title1)}</span>
        <span class="hl-2">${this.esc(title2)}</span>
        <p class="hero-sub">${subtitle}</p>
        <div class="bdgs">${badgesHtml}</div>
      </div>`;
  }

  // ── INDEX_STATS ────────────────────────────────────────
  render_index_stats({ items = [] } = {}) {
    const itemsHtml = (items || []).map(it => `
      <div class="st">
        <div class="st-v">${this.esc(it.value)}</div>
        <div class="st-l">${this.esc(it.label)}</div>
      </div>`).join('');
    return `<div class="stats">${itemsHtml}</div>`;
  }

  // ── BENTO_PRICING ──────────────────────────────────────
  render_bento_pricing({ starter = {}, scale = {} } = {}) {
    const renderFList = (features = []) => {
      return (features || []).map(f => `
        <li class="fi">
          <div class="fi-row">
            <span class="fi-ms material-symbols-rounded">${this.esc(f.icon)}</span>
            <span class="fi-name">${this.esc(f.name)}</span>
            <span class="fi-chev material-symbols-rounded">expand_more</span>
          </div>
          <div class="drop-body">${this.esc(f.desc)}</div>
        </li>`).join('');
    };

    const starterHtml = renderFList(starter.features);
    const scaleHtml = renderFList(scale.features);
    const bonusHtml = (scale.bonuses || []).map(b => `
      <div class="bi">
        <div class="bi-row">
          <span class="bi-ms material-symbols-rounded">${this.esc(b.icon)}</span>
          <span class="bi-name">${this.esc(b.name)}</span>
          <span class="bi-chev material-symbols-rounded">expand_more</span>
        </div>
        <div class="bi-drop">${this.esc(b.desc)}</div>
      </div>`).join('');

    return `
      <div class="bento pricing-grid">
        <div class="card cl">
          <div class="gl base"></div><div class="gl frost"></div><div class="gl rim"></div><div class="gl shine"></div>
          <div class="cblob c1"></div><div class="cblob c2"></div><div class="cblob c3"></div>
          <div class="cc">
            <div class="plan-name">${this.esc(starter.name)}</div>
            <p class="plan-hook">${this.esc(starter.hook)}</p>
            <div class="price-row">
              <span class="psym">$</span><span class="pnum">${this.esc(starter.price)}</span><span class="pmo">/mo</span>
            </div>
            <div class="ptot">${starter.total}</div>
            <div class="div"></div>
            <ul class="flist">${starterHtml}</ul>
            <a href="#" class="btn btn-l">Start Plan →</a>
          </div>
        </div>
        <div class="card cr">
          <div class="gl base"></div><div class="gl frost"></div><div class="gl rim"></div><div class="gl shine"></div>
          <div class="cblob c1"></div><div class="cblob c2"></div><div class="cblob c3"></div>
          <canvas id="starCanvasPreview" style="position:absolute;inset:0;width:100%;height:100%;z-index:9;pointer-events:none;border-radius:22px;"></canvas>
          <div class="cc">
            <div class="pop-tag">✦ Most Chosen</div>
            <div class="plan-name">${this.esc(scale.name)}</div>
            <p class="plan-hook">${this.esc(scale.hook)}</p>
            <div class="price-row">
              <span class="psym">$</span><span class="pnum">${this.esc(scale.price)}</span><span class="pmo">/mo</span>
            </div>
            <div class="ptot">${scale.total}</div>
            <div class="div"></div>
            <ul class="flist">${scaleHtml}</ul>
            <div class="bonus-wrap"><div class="bonus-inner"><div class="b-label">Exclusives</div>${bonusHtml}</div></div>
            <a href="#" class="btn btn-r">Start Scale Plan ✦</a>
          </div>
        </div>
      </div>`;
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug lipsă' });

  const db = getDB();
  const { data, error } = await db
    .from('pages')
    .select('slug,title,content,meta_title,meta_desc')
    .eq('slug', slug)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Pagina nu există' });

  const renderer  = new PageRenderer();
  const pageData  = { sections: data.content?.sections || [] };
  const bodyHtml  = renderer.renderPage(pageData);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="ro"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.meta_title || data.title}</title>
${data.meta_desc ? `<meta name="description" content="${data.meta_desc}">` : ''}
</head><body>
${bodyHtml}
</body></html>`);
}
