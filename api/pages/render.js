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
              <button class="cc-btn" data-video-url="${this.esc(c.youtubeUrl)}"><span class="material-symbols-rounded">play_arrow</span>Start</button>
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
