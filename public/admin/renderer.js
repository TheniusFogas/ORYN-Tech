// admin/renderer.js
// ─────────────────────────────────────────────────────────
// Convertește schema JSON a unei pagini în HTML renderabil.
// Același renderer rulează în:
//   - Editor (preview în canvas)
//   - Server (api/pages/render.js) pentru vizitatori
// ─────────────────────────────────────────────────────────

export class PageRenderer {
  constructor(options = {}) {
    this.editMode = options.editMode || false; // adaugă data-section-id pentru editor
  }

  renderPage(pageData) {
    const sections = pageData.sections || [];
    return sections
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(s => this.renderSection(s))
      .join('\n');
  }

  renderSection(section) {
    const { id, type, props = {} } = section;
    const editAttr = this.editMode ? ` data-section-id="${id}" data-section-type="${type}"` : '';

    // Toolbar pentru Editor
    let toolbar = '';
    if (this.editMode) {
      toolbar = `
        <div class="cs-toolbar">
          <button class="cs-tool" title="Mută sus"><span class="material-symbols-rounded">arrow_upward</span></button>
          <button class="cs-tool" title="Mută jos"><span class="material-symbols-rounded">arrow_downward</span></button>
          <button class="cs-tool" title="Duplică"><span class="material-symbols-rounded">content_copy</span></button>
          <button class="cs-tool" title="Șterge" style="color:#f87171"><span class="material-symbols-rounded">delete</span></button>
        </div>`;
    }

    // Locked sections (animații) — renderează ca placeholder în editor
    if (type === 'galaxy_header' || props.locked) {
      return `<div class="sec sec-locked"${editAttr}>
        ${toolbar}
        <span class="material-symbols-rounded">lock</span>
        Header Animat — componentă sistem
      </div>`;
    }

    let html = this[`render_${type}`]?.(props, editAttr) || this.renderUnknown(type);
    
    // Injectăm toolbar-ul în interiorul secțiunii dacă suntem în editMode
    if (this.editMode && html.includes('data-section-id')) {
      html = html.replace('>', `>${toolbar}`);
    }

    return html;
  }


  // ── SPACER ────────────────────────────────────────────
  render_spacer({ height = 48 }, ea = '') {
    return `<div class="sec w-spacer"${ea} style="height:${height}px"></div>`;
  }

  // ── DIVIDER ───────────────────────────────────────────
  render_divider({ marginY = 16 }, ea = '') {
    return `<div class="sec w-divider"${ea} style="padding:${marginY}px 40px">
      <div class="w-divider-line"></div>
    </div>`;
  }

  // ── HERO ──────────────────────────────────────────────
  render_hero({ eyebrow, title, subtitle, ctaText, ctaLink, ctaIcon = 'rocket_launch',
    align = 'center', paddingY = 80, showEyebrow = true, showCta = true } = {}, ea = '') {
    return `<section class="sec w-hero" style="padding:${paddingY}px 40px;text-align:${align}"${ea}>
      ${showEyebrow && eyebrow ? `<div class="eyebrow">
        <span class="ey-line"></span>${this.esc(eyebrow)}<span class="ey-line"></span>
      </div>` : ''}
      <div class="hero-title">${this.renderGradientTitle(title)}</div>
      ${subtitle ? `<p class="hero-sub">${this.esc(subtitle)}</p>` : ''}
      ${showCta && ctaText ? `<a href="${this.esc(ctaLink || '#')}" class="cta-btn">
        <span class="material-symbols-rounded">${this.esc(ctaIcon)}</span>
        ${this.esc(ctaText)}
      </a>` : ''}
    </section>`;
  }

  // ── TEXT ──────────────────────────────────────────────
  render_text({ title, content = '', align = 'left', fontSize = 15,
    paddingY = 32, paddingX = 40, showTitle = false } = {}, ea = '') {
    return `<section class="sec w-text" style="padding:${paddingY}px ${paddingX}px;text-align:${align}"${ea}>
      ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
      <div class="sec-text-body" style="font-size:${fontSize}px">${this.nl2br(content)}</div>
    </section>`;
  }

  // ── IMAGE ─────────────────────────────────────────────
  render_image({ src, alt = '', caption = '', width = '100%', borderRadius = 12,
    paddingY = 24, paddingX = 40, showCaption = false } = {}, ea = '') {
    if (!src) return `<section class="sec w-image sec-empty"${ea} style="padding:${paddingY}px ${paddingX}px">
      <span class="material-symbols-rounded">image</span> Adaugă o imagine
    </section>`;
    return `<section class="sec w-image" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <img src="${this.esc(src)}" alt="${this.esc(alt)}"
        style="width:${width};border-radius:${borderRadius}px;display:block;margin:auto">
      ${showCaption && caption ? `<p class="img-caption">${this.esc(caption)}</p>` : ''}
    </section>`;
  }

  // ── VIDEO ─────────────────────────────────────────────
  render_video({ url = '', provider = 'youtube', aspectRatio = '16/9',
    borderRadius = 12, paddingY = 24, paddingX = 40 } = {}, ea = '') {
    if (!url) return `<section class="sec w-video sec-empty"${ea}>
      <span class="material-symbols-rounded">play_circle</span> Adaugă URL video
    </section>`;
    const embedUrl = provider === 'youtube'
      ? url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
      : url.replace('vimeo.com/', 'player.vimeo.com/video/');
    return `<section class="sec w-video" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div style="position:relative;padding-bottom:56.25%;border-radius:${borderRadius}px;overflow:hidden">
        <iframe src="${this.esc(embedUrl)}" frameborder="0" allowfullscreen
          style="position:absolute;inset:0;width:100%;height:100%"></iframe>
      </div>
    </section>`;
  }

  // ── STATS ─────────────────────────────────────────────
  render_stats({ items = [], columns = 4, paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const cells = items.map(it => `<div class="st">
      <div class="st-v">${this.esc(it.value)}</div>
      <div class="st-l">${this.esc(it.label)}</div>
    </div>`).join('');
    return `<section class="sec w-stats" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="stats" style="grid-template-columns:repeat(${columns},1fr)">${cells}</div>
    </section>`;
  }

  // ── CARDS ─────────────────────────────────────────────
  render_cards({ title = '', showTitle = true, cards = [], columns = 3,
    paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const cells = cards.map(c => `<div class="feat-card gl base">
      <div class="fc-icon"><span class="material-symbols-rounded">${this.esc(c.icon || 'star')}</span></div>
      <div class="fc-title">${this.esc(c.title)}</div>
      <div class="fc-desc">${this.esc(c.desc)}</div>
    </div>`).join('');
    return `<section class="sec w-cards" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
      <div class="feat-grid" style="grid-template-columns:repeat(${columns},1fr)">${cells}</div>
    </section>`;
  }

  // ── FAQ ───────────────────────────────────────────────
  render_faq({ title = 'FAQ', showTitle = true, items = [],
    paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const rows = items.map(it => `<div class="faq-item">
      <div class="faq-q">
        <span>${this.esc(it.q)}</span>
        <span class="material-symbols-rounded fi-chev">expand_more</span>
      </div>
      <div class="faq-a">${this.nl2br(it.a)}</div>
    </div>`).join('');
    return `<section class="sec w-faq" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
      <div class="faq-list">${rows}</div>
    </section>`;
  }

  // ── CTA ───────────────────────────────────────────────
  render_cta({ title = '', subtitle = '', ctaText = '', ctaLink = '#',
    ctaIcon = 'rocket_launch', secondaryText = '', secondaryLink = '#',
    showSecondary = false, paddingY = 56, bgStyle = 'gradient' } = {}, ea = '') {
    const bg = bgStyle === 'gradient'
      ? 'background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(219,39,119,.1))'
      : bgStyle === 'solid' ? 'background:rgba(255,255,255,.04)' : '';
    return `<section class="sec w-cta" style="padding:${paddingY}px 40px;text-align:center;${bg}"${ea}>
      ${title ? `<h2 class="cta-title">${this.esc(title)}</h2>` : ''}
      ${subtitle ? `<p class="cta-sub">${this.esc(subtitle)}</p>` : ''}
      <div class="cta-actions">
        ${ctaText ? `<a href="${this.esc(ctaLink)}" class="cta-btn">
          <span class="material-symbols-rounded">${this.esc(ctaIcon)}</span>${this.esc(ctaText)}
        </a>` : ''}
        ${showSecondary && secondaryText ? `<a href="${this.esc(secondaryLink)}" class="cta-btn-sec">
          ${this.esc(secondaryText)}
        </a>` : ''}
      </div>
    </section>`;
  }

  // ── PRICING ───────────────────────────────────────────
  render_pricing({ title = '', subtitle = '', showTitle = true, plans = [],
    paddingY = 56, paddingX = 40 } = {}, ea = '') {
    const cards = plans.map(p => `<div class="price-card gl ${p.highlighted ? 'highlighted' : 'base'}">
      ${p.badge ? `<div class="price-badge">${this.esc(p.badge)}</div>` : ''}
      <div class="price-name">${this.esc(p.name)}</div>
      <div class="price-amount">
        <span class="price-cur">${this.esc(p.currency || '$')}</span>
        <span class="price-val">${this.esc(p.price)}</span>
        <span class="price-per">${this.esc(p.period || '/lună')}</span>
      </div>
      ${p.total ? `<div class="price-total">${this.esc(p.total)}</div>` : ''}
      <ul class="price-features">
        ${(p.features || []).map(f => `<li><span class="material-symbols-rounded">check_circle</span>${this.esc(f)}</li>`).join('')}
      </ul>
      <a href="${this.esc(p.ctaLink || '#')}" class="cta-btn">${this.esc(p.ctaText || 'Alege planul')}</a>
    </div>`).join('');
    return `<section class="sec w-pricing" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
      ${subtitle ? `<p class="sec-subtitle">${this.esc(subtitle)}</p>` : ''}
      <div class="pricing-grid">${cards}</div>
    </section>`;
  }

  // ── TESTIMONIALS ──────────────────────────────────────
  render_testimonials({ title = '', showTitle = true, items = [], columns = 3,
    paddingY = 48, paddingX = 40 } = {}, ea = '') {
    const cards = items.map(t => `<div class="testi-card gl base">
      <div class="testi-stars">${'★'.repeat(t.rating || 5)}</div>
      <div class="testi-text">${this.esc(t.text)}</div>
      <div class="testi-author">
        ${t.avatar ? `<img src="${this.esc(t.avatar)}" class="testi-avatar">` : `<div class="testi-avatar-ph">${this.esc((t.name||'?')[0])}</div>`}
        <div>
          <div class="testi-name">${this.esc(t.name)}</div>
          <div class="testi-role">${this.esc(t.role)}</div>
        </div>
      </div>
    </div>`).join('');
    return `<section class="sec w-testimonials" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title">${this.esc(title)}</h2>` : ''}
      <div class="testi-grid" style="grid-template-columns:repeat(${columns},1fr)">${cards}</div>
    </section>`;
  }

  // ── FORM ──────────────────────────────────────────────
  render_form({ title = '', subtitle = '', showTitle = true, fields = [],
    submitText = 'Trimite', submitIcon = 'send', successMessage = 'Mulțumim!',
    paddingY = 48, paddingX = 40 } = {}, ea = '') {
    const inputs = fields.map(f => {
      const cls = f.half ? 'form-field half' : 'form-field';
      const req = f.required ? 'required' : '';
      if (f.type === 'textarea') {
        return `<div class="${cls}">
          <label class="fl">${this.esc(f.label)}${f.required ? ' *' : ''}</label>
          <textarea name="${this.esc(f.name)}" class="fi" rows="4" ${req}></textarea>
        </div>`;
      }
      return `<div class="${cls}">
        <label class="fl">${this.esc(f.label)}${f.required ? ' *' : ''}</label>
        <input type="${this.esc(f.type || 'text')}" name="${this.esc(f.name)}" class="fi" ${req}>
      </div>`;
    }).join('');
    return `<section class="sec w-form" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="form-card gl base">
        ${showTitle && title ? `<h2 class="form-title">${this.esc(title)}</h2>` : ''}
        ${subtitle ? `<p class="form-sub">${this.esc(subtitle)}</p>` : ''}
        <form class="dyn-form" data-success="${this.esc(successMessage)}">
          <div class="form-fields-grid">${inputs}</div>
          <button type="submit" class="btn-submit">
            <span class="material-symbols-rounded">${this.esc(submitIcon)}</span>
            ${this.esc(submitText)}
          </button>
          <div class="form-success" style="display:none">${this.esc(successMessage)}</div>
        </form>
      </div>
    </section>`;
  }

  // ── COLUMNS ───────────────────────────────────────────
  render_columns({ cols = 2, gap = 24, cells = [], paddingY = 32, paddingX = 40 } = {}, ea = '') {
    const cellHtml = cells.map(c => `<div class="col-cell">${this.nl2br(c.content || '')}</div>`).join('');
    return `<section class="sec w-cols" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="cols-layout" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px">
        ${cellHtml}
      </div>
    </section>`;
  }

  // ── HTML CUSTOM ───────────────────────────────────────
  render_html({ code = '', paddingY = 24, paddingX = 40 } = {}, ea = '') {
    return `<section class="sec w-html" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${code}
    </section>`;
  }

  // ── UNKNOWN ───────────────────────────────────────────
  renderUnknown(type) {
    return `<div class="sec sec-unknown">Widget necunoscut: <code>${type}</code></div>`;
  }

  // ── HELPERS ───────────────────────────────────────────
  esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  nl2br(str = '') {
    return String(str).replace(/\n/g, '<br>');
  }

  renderGradientTitle(title = '') {
    // Ultimul cuvânt primește gradient
    const words = title.trim().split(' ');
    if (words.length <= 1) return `<span class="g">${this.esc(title)}</span>`;
    const last = words.pop();
    return `${this.esc(words.join(' '))} <span class="g">${this.esc(last)}</span>`;
  }
}

export default PageRenderer;
