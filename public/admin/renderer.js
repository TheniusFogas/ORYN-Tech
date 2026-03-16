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
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    
    return `<section class="sec w-hero" style="padding:${paddingY}px 40px;text-align:${align}"${ea}>
      ${showEyebrow && eyebrow ? `<div class="eyebrow"${edit('eyebrow')}>
        <span class="ey-line"></span>${this.esc(eyebrow)}<span class="ey-line"></span>
      </div>` : ''}
      <div class="hero-title"${edit('title')}>${this.renderGradientTitle(title)}</div>
      ${subtitle ? `<p class="hero-sub"${edit('subtitle')}>${this.esc(subtitle)}</p>` : ''}
      ${showCta && ctaText ? `<a href="${this.esc(ctaLink || '#')}" class="cta-btn">
        <span class="material-symbols-rounded"${edit('ctaIcon')}>${this.esc(ctaIcon)}</span>
        <span${edit('ctaText')}>${this.esc(ctaText)}</span>
      </a>` : ''}
    </section>`;
  }

  // ── TEXT ──────────────────────────────────────────────
  render_text({ title, content = '', align = 'left', fontSize = 15,
    paddingY = 32, paddingX = 40, showTitle = false } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    
    return `<section class="sec w-text" style="padding:${paddingY}px ${paddingX}px;text-align:${align}"${ea}>
      ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      <div class="sec-text-body" style="font-size:${fontSize}px"${edit('content')}>${this.nl2br(content)}</div>
    </section>`;
  }

  // ── IMAGE ─────────────────────────────────────────────
  render_image({ src, alt = '', caption = '', width = '100%', borderRadius = 12,
    paddingY = 24, paddingX = 40, showCaption = false } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    
    if (!src) return `<section class="sec w-image sec-empty"${ea} style="padding:${paddingY}px ${paddingX}px">
      <span class="material-symbols-rounded">image</span> Adaugă o imagine
    </section>`;
    return `<section class="sec w-image" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <img src="${this.esc(src)}" alt="${this.esc(alt)}"${edit('src')}
        style="width:${width};border-radius:${borderRadius}px;display:block;margin:auto">
      ${showCaption && caption ? `<p class="img-caption"${edit('caption')}>${this.esc(caption)}</p>` : ''}
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
          style="position:absolute;inset:0;width:100%;height:100%" data-editable="true" data-prop="url"></iframe>
      </div>
    </section>`;
  }

  // ── STATS ─────────────────────────────────────────────
  render_stats({ items = [], columns = 4, paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const cells = items.map((it, idx) => `<div class="st">
      <div class="st-v"${edit(`items[${idx}].value`)}>${this.esc(it.value)}</div>
      <div class="st-l"${edit(`items[${idx}].label`)}>${this.esc(it.label)}</div>
    </div>`).join('');
    return `<section class="sec w-stats" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="stats" style="grid-template-columns:repeat(${columns},1fr)">${cells}</div>
    </section>`;
  }

  // ── CARDS ─────────────────────────────────────────────
  render_cards({ title = '', showTitle = true, cards = [], columns = 3,
    paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const cells = cards.map((c, idx) => `<div class="feat-card gl base">
      <div class="fc-icon"><span class="material-symbols-rounded"${edit(`cards[${idx}].icon`)}>${this.esc(c.icon || 'star')}</span></div>
      <div class="fc-title"${edit(`cards[${idx}].title`)}>${this.esc(c.title)}</div>
      <div class="fc-desc"${edit(`cards[${idx}].desc`)}>${this.esc(c.desc)}</div>
    </div>`).join('');
    return `<section class="sec w-cards" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      <div class="feat-grid" style="grid-template-columns:repeat(${columns},1fr)">${cells}</div>
    </section>`;
  }

  // ── FAQ ───────────────────────────────────────────────
  render_faq({ title = 'FAQ', showTitle = true, items = [],
    paddingY = 40, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const rows = items.map((it, idx) => `<div class="faq-item">
      <div class="faq-q">
        <span${edit(`items[${idx}].q`)}>${this.esc(it.q)}</span>
        <span class="material-symbols-rounded fi-chev">expand_more</span>
      </div>
      <div class="faq-a"${edit(`items[${idx}].a`)}>${this.nl2br(it.a)}</div>
    </div>`).join('');
    return `<section class="sec w-faq" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      <div class="faq-list">${rows}</div>
    </section>`;
  }

  // ── CTA ───────────────────────────────────────────────
  render_cta({ title = '', subtitle = '', ctaText = '', ctaLink = '#',
    ctaIcon = 'rocket_launch', secondaryText = '', secondaryLink = '#',
    showSecondary = false, paddingY = 56, bgStyle = 'gradient' } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const bg = bgStyle === 'gradient'
      ? 'background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(219,39,119,.1))'
      : bgStyle === 'solid' ? 'background:rgba(255,255,255,.04)' : '';
    return `<section class="sec w-cta" style="padding:${paddingY}px 40px;text-align:center;${bg}"${ea}>
      ${title ? `<h2 class="cta-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      ${subtitle ? `<p class="cta-sub"${edit('subtitle')}>${this.esc(subtitle)}</p>` : ''}
      <div class="cta-actions">
        ${ctaText ? `<a href="${this.esc(ctaLink)}" class="cta-btn">
          <span class="material-symbols-rounded"${edit('ctaIcon')}>${this.esc(ctaIcon)}</span>
          <span${edit('ctaText')}>${this.esc(ctaText)}</span>
        </a>` : ''}
        ${showSecondary && secondaryText ? `<a href="${this.esc(secondaryLink)}" class="cta-btn-sec"${edit('secondaryText')}>
          ${this.esc(secondaryText)}
        </a>` : ''}
      </div>
    </section>`;
  }

  // ── PRICING ───────────────────────────────────────────
  render_pricing({ title = '', subtitle = '', showTitle = true, plans = [],
    paddingY = 56, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const cards = plans.map((p, idx) => `<div class="price-card gl ${p.highlighted ? 'highlighted' : 'base'}">
      ${p.badge ? `<div class="price-badge"${edit(`plans[${idx}].badge`)}>${this.esc(p.badge)}</div>` : ''}
      <div class="price-name"${edit(`plans[${idx}].name`)}>${this.esc(p.name)}</div>
      <div class="price-amount"${edit(`plans[${idx}].price`)}>
        <span class="price-cur">${this.esc(p.currency || '$')}</span>
        <span class="price-val">${this.esc(p.price)}</span>
        <span class="price-per">${this.esc(p.period || '/lună')}</span>
      </div>
      ${p.total ? `<div class="price-total"${edit(`plans[${idx}].total`)}>${this.esc(p.total)}</div>` : ''}
      <ul class="price-features">
        ${(p.features || []).map((f, fidx) => `<li${edit(`plans[${idx}].features[${fidx}]`)}><span class="material-symbols-rounded">check_circle</span>${this.esc(f)}</li>`).join('')}
      </ul>
      <a href="${this.esc(p.ctaLink || '#')}" class="cta-btn"${edit(`plans[${idx}].ctaText`)}>${this.esc(p.ctaText || 'Alege planul')}</a>
    </div>`).join('');
    return `<section class="sec w-pricing" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      ${subtitle ? `<p class="sec-subtitle"${edit('subtitle')}>${this.esc(subtitle)}</p>` : ''}
      <div class="pricing-grid">${cards}</div>
    </section>`;
  }

  // ── TESTIMONIALS ──────────────────────────────────────
  render_testimonials({ title = '', showTitle = true, items = [], columns = 3,
    paddingY = 48, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const cards = items.map((t, idx) => `<div class="testi-card gl base">
      <div class="testi-stars">${'★'.repeat(t.rating || 5)}</div>
      <div class="testi-text"${edit(`items[${idx}].text`)}>${this.esc(t.text)}</div>
      <div class="testi-author">
        ${t.avatar ? `<img src="${this.esc(t.avatar)}" class="testi-avatar"${edit(`items[${idx}].avatar`)}>` : `<div class="testi-avatar-ph"${edit(`items[${idx}].name`)}>${this.esc((t.name||'?')[0])}</div>`}
        <div>
          <div class="testi-name"${edit(`items[${idx}].name`)}>${this.esc(t.name)}</div>
          <div class="testi-role"${edit(`items[${idx}].role`)}>${this.esc(t.role)}</div>
        </div>
      </div>
    </div>`).join('');
    return `<section class="sec w-testimonials" style="padding:${paddingY}px ${paddingX}px"${ea}>
      ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
      <div class="testi-grid" style="grid-template-columns:repeat(${columns},1fr)">${cards}</div>
    </section>`;
  }

  // ── FORM ──────────────────────────────────────────────
  render_form({ title = '', subtitle = '', showTitle = true, fields = [],
    submitText = 'Trimite', submitIcon = 'send', successMessage = 'Mulțumim!',
    paddingY = 48, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const inputs = fields.map((f, idx) => {
      const cls = f.half ? 'form-field half' : 'form-field';
      const req = f.required ? 'required' : '';
      if (f.type === 'textarea') {
        return `<div class="${cls}">
          <label class="fl"${edit(`fields[${idx}].label`)}>${this.esc(f.label)}${f.required ? ' *' : ''}</label>
          <textarea name="${this.esc(f.name)}" class="fi" rows="4" ${req}></textarea>
        </div>`;
      }
      return `<div class="${cls}">
        <label class="fl"${edit(`fields[${idx}].label`)}>${this.esc(f.label)}${f.required ? ' *' : ''}</label>
        <input type="${this.esc(f.type || 'text')}" name="${this.esc(f.name)}" class="fi" ${req}>
      </div>`;
    }).join('');
    return `<section class="sec w-form" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="form-card gl base">
        ${showTitle && title ? `<h2 class="form-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
        ${subtitle ? `<p class="form-sub"${edit('subtitle')}>${this.esc(subtitle)}</p>` : ''}
        <form class="dyn-form" data-success="${this.esc(successMessage)}">
          <div class="form-fields-grid">${inputs}</div>
          <button type="button" class="btn-submit">
            <span class="material-symbols-rounded"${edit('submitIcon')}>${this.esc(submitIcon)}</span>
            <span${edit('submitText')}>${this.esc(submitText)}</span>
          </button>
          <div class="form-success" style="display:none"${edit('successMessage')}>${this.esc(successMessage)}</div>
        </form>
      </div>
    </section>`;
  }

  // ── HOME_HERO ──────────────────────────────────────────
  render_home_hero({ eyebrow = '', title1 = '', title2 = '', subtitle = '', badges = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const badgesHtml = (badges || []).map((b, idx) => `
      <div class="bdg"><span${edit(`badges[${idx}].text`)}>${this.esc(b.text)}</span></div>`).join('');

    return `
      <div class="hero"${ea}>
        <div class="eyebrow"><span class="ey-line"></span><span${edit('eyebrow')}>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <span class="hl-1"${edit('title1')}>${this.esc(title1)}</span>
        <span class="hl-2"${edit('title2')}>${this.esc(title2)}</span>
        <p class="hero-sub"${edit('subtitle')}>${subtitle}</p>
        <div class="bdgs">${badgesHtml}</div>
      </div>`;
  }

  // ── INDEX_STATS ────────────────────────────────────────
  render_index_stats({ items = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const itemsHtml = (items || []).map((it, idx) => `
      <div class="st">
        <div class="st-v"${edit(`items[${idx}].value`)}>${this.esc(it.value)}</div>
        <div class="st-l"${edit(`items[${idx}].label`)}>${this.esc(it.label)}</div>
      </div>`).join('');
    return `<div class="stats"${ea}>${itemsHtml}</div>`;
  }

  // ── BENTO_PRICING ──────────────────────────────────────
  render_bento_pricing({ starter = {}, scale = {} } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    
    const renderFList = (features = [], pathPrefix = '') => {
      return (features || []).map((f, idx) => `
        <li class="fi">
          <div class="fi-row">
            <span class="fi-ms material-symbols-rounded">${this.esc(f.icon)}</span>
            <span class="fi-name"${edit(`${pathPrefix}.features[${idx}].name`)}>${this.esc(f.name)}</span>
            <span class="fi-chev material-symbols-rounded">expand_more</span>
          </div>
          <div class="drop-body"${edit(`${pathPrefix}.features[${idx}].desc`)}>${this.esc(f.desc)}</div>
        </li>`).join('');
    };

    const starterHtml = renderFList(starter.features, 'starter');
    const scaleHtml = renderFList(scale.features, 'scale');
    const bonusHtml = (scale.bonuses || []).map((b, idx) => `
      <div class="bi">
        <div class="bi-row">
          <span class="bi-ms material-symbols-rounded">${this.esc(b.icon)}</span>
          <span class="bi-name"${edit(`scale.bonuses[${idx}].name`)}>${this.esc(b.name)}</span>
          <span class="bi-chev material-symbols-rounded">expand_more</span>
        </div>
        <div class="bi-drop"${edit(`scale.bonuses[${idx}].desc`)}>${this.esc(b.desc)}</div>
      </div>`).join('');

    return `
      <div class="bento pricing-grid"${ea}>
        <!-- STARTER -->
        <div class="card cl">
          <div class="gl base"></div><div class="gl frost"></div><div class="gl rim"></div><div class="gl shine"></div>
          <div class="cblob c1"></div><div class="cblob c2"></div><div class="cblob c3"></div>
          <div class="cc">
            <div class="plan-name"${edit('starter.name')}>${this.esc(starter.name)}</div>
            <p class="plan-hook"${edit('starter.hook')}>${this.esc(starter.hook)}</p>
            <div class="price-row">
              <span class="psym">$</span><span class="pnum"${edit('starter.price')}>${this.esc(starter.price)}</span><span class="pmo">/mo</span>
            </div>
            <div class="ptot"${edit('starter.total')}>${starter.total}</div>
            <div class="div"></div>
            <ul class="flist">${starterHtml}</ul>
            <a href="#" class="btn btn-l">Start Plan →</a>
          </div>
        </div>

        <!-- SCALE -->
        <div class="card cr">
          <div class="gl base"></div><div class="gl frost"></div><div class="gl rim"></div><div class="gl shine"></div>
          <div class="cblob c1"></div><div class="cblob c2"></div><div class="cblob c3"></div>
          <canvas id="starCanvasPreview" style="position:absolute;inset:0;width:100%;height:100%;z-index:9;pointer-events:none;border-radius:22px;"></canvas>
          <div class="cc">
            <div class="pop-tag">✦ Most Chosen</div>
            <div class="plan-name"${edit('scale.name')}>${this.esc(scale.name)}</div>
            <p class="plan-hook"${edit('scale.hook')}>${this.esc(scale.hook)}</p>
            <div class="price-row">
              <span class="psym">$</span><span class="pnum"${edit('scale.price')}>${this.esc(scale.price)}</span><span class="pmo">/mo</span>
            </div>
            <div class="ptot"${edit('scale.total')}>${scale.total}</div>
            <div class="div"></div>
            <ul class="flist">${scaleHtml}</ul>
            <div class="bonus-wrap">
              <div class="bonus-inner">
                <div class="b-label">Exclusives</div>
                ${bonusHtml}
              </div>
            </div>
            <a href="#" class="btn btn-r">Start Scale Plan ✦</a>
          </div>
        </div>
      </div>`;
  }

  // ── COLUMNS ───────────────────────────────────────────
  render_columns({ cols = 2, gap = 24, cells = [], paddingY = 32, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const cellHtml = cells.map((c, idx) => `<div class="col-cell"${edit(`cells[${idx}].content`)}>${this.nl2br(c.content || '')}</div>`).join('');
    return `<section class="sec w-cols" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div class="cols-layout" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px">
        ${cellHtml}
      </div>
    </section>`;
  }

  // ── TUT_HERO ──────────────────────────────────────────
  render_tut_hero({ eyebrowIcon = 'school', eyebrowText = 'ORYNTech Hero', title = 'Academy & Docs', subtitle = '', searchPlaceholder = 'Caută...', stats = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const statsHtml = (stats || []).map((s, idx) => `
      <div class="tut-stat">
        <span class="tut-stat-n"${edit(`stats[${idx}].value`)}>${this.esc(s.value)}</span>
        <span class="tut-stat-l"${edit(`stats[${idx}].label`)}>${this.esc(s.label)}</span>
      </div>`).join('');

    return `
      <section class="tut-hero"${ea}>
        <div class="tut-hero-left">
          <div class="tut-eyebrow">
            <span class="material-symbols-rounded" style="font-size:13px"${edit('eyebrowIcon')}>${this.esc(eyebrowIcon)}</span>
            <span${edit('eyebrowText')}>${this.esc(eyebrowText)}</span>
          </div>
          <h1${edit('title')}>${title}</h1>
          <p class="tut-hero-sub"${edit('subtitle')}>${this.esc(subtitle)}</p>
          <div class="tut-stats">${statsHtml}</div>
        </div>
        <div class="tut-hero-search">
          <div class="search-box">
            <span class="material-symbols-rounded">search</span>
            <input type="text"${edit('searchPlaceholder')} placeholder="${this.esc(searchPlaceholder)}">
          </div>
        </div>
      </section>`;
  }

  // ── TUT_FEATURED ───────────────────────────────────────
  render_tut_featured({ label = '', badgeIcon = 'star', badgeText = '', title = '', desc = '', metaItems = [], videoUrl = '' } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const metaHtml = (metaItems || []).map((m, idx) => `
      <div class="feat-meta-item">
        <span class="material-symbols-rounded">${this.esc(m.icon)}</span>
        <span${edit(`metaItems[${idx}].text`)}>${this.esc(m.text)}</span>
      </div>`).join('');

    return `
      <section class="featured-section"${ea}>
        <div class="section-label"${edit('label')}>${this.esc(label)}</div>
        <div class="featured-card">
          <div>
            <div class="feat-badge">
              <span class="material-symbols-rounded" style="font-size:12px">${this.esc(badgeIcon)}</span>
              <span${edit('badgeText')}>${this.esc(badgeText)}</span>
            </div>
            <h2 class="feat-title"${edit('title')}>${this.esc(title)}</h2>
            <p class="feat-desc"${edit('desc')}>${this.esc(desc)}</p>
            <div class="feat-meta">${metaHtml}</div>
          </div>
          <div class="feat-play" data-video="${this.esc(videoUrl)}"><span class="material-symbols-rounded">play_arrow</span></div>
        </div>
      </section>`;
  }

  // ── TUT_PATHS ──────────────────────────────────────────
  render_tut_paths({ label = '', paths = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const pathsHtml = (paths || []).map((p, idx) => `
      <div class="path-card">
        <div class="path-icon"><span class="material-symbols-rounded">${this.esc(p.icon)}</span></div>
        <div class="path-name"${edit(`paths[${idx}].name`)}>${this.esc(p.name)}</div>
        <div class="path-count"${edit(`paths[${idx}].count`)}>${this.esc(p.count)}</div>
      </div>`).join('');

    return `
      <section class="path-section"${ea}>
        <div class="section-label"${edit('label')}>${this.esc(label)}</div>
        <div class="path-cards">${pathsHtml}</div>
      </section>`;
  }

  // ── TRIAL_HERO ─────────────────────────────────────────
  render_trial_hero({ eyebrow = '', title1 = '', title2 = '', subtitle = '', badges = [], ctaText = '', ctaLink = '', ctaNote = '' } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const badgesHtml = (badges || []).map((b, idx) => `
      <div class="bdg">
        ${idx === 0 ? '<span class="pulse-dot"></span> ' : ''}
        <span${edit(`badges[${idx}]`)}>${this.esc(typeof b === 'string' ? b : b.text)}</span>
      </div>`).join('');

    return `
      <div class="hero"${ea}>
        <div class="eyebrow"><span class="ey-line"></span><span${edit('eyebrow')}>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <span class="hl-1"${edit('title1')}>${this.esc(title1)}</span>
        <span class="hl-2"${edit('title2')}>${this.esc(title2)}</span>
        <p class="hero-sub"${edit('subtitle')}>${this.nl2br(subtitle)}</p>
        <div class="bdgs">${badgesHtml}</div>
        <a href="${this.esc(ctaLink)}" class="cta-btn"${edit('ctaText')}>${this.esc(ctaText)}</a>
        <span class="cta-note"${edit('ctaNote')}>${this.esc(ctaNote)}</span>
      </div>`;
  }

  // ── PROBLEMS_GRID ──────────────────────────────────────
  render_problems_grid({ eyebrow = '', title = '', subtitle = '', items = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const itemsHtml = (items || []).map((it, idx) => `
      <div class="prob-item">
        <span class="material-symbols-rounded prob-ms">${this.esc(it.icon)}</span>
        <div class="prob-title"${edit(`items[${idx}].title`)}>${this.esc(it.title)}</div>
        <div class="prob-desc"${edit(`items[${idx}].desc`)}>${this.esc(it.desc)}</div>
      </div>`).join('');

    return `
      <div class="sec"${ea}>
        <div class="eyebrow-sm"><span class="ey-line"></span><span${edit('eyebrow')}>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <h2 class="sec-h"${edit('title')}>${title}</h2>
        <p class="sec-sub"${edit('subtitle')}>${this.esc(subtitle)}</p>
        <div class="prob-grid">${itemsHtml}</div>
      </div>`;
  }

  // ── BRIDGE_BANNER ──────────────────────────────────────
  render_bridge_banner({ title = '', subtitle = '' } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    return `
      <div class="bridge"${ea}>
        <div class="gl-rim"></div><div class="shine"></div>
        <div class="bcb1"></div><div class="bcb2"></div>
        <div class="bridge-in">
          <h2${edit('title')}>${title}</h2>
          <p${edit('subtitle')}>${this.nl2br(subtitle)}</p>
        </div>
      </div>`;
  }

  // ── BEFORE_AFTER_TABLE ─────────────────────────────────
  render_before_after_table({ eyebrow = '', title = '', beforeTitle = '', afterTitle = '', rows = [] } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    const rowsHtml = (rows || []).map((r, idx) => `
      <div class="ba-row-wrap" style="display:contents">
        <div class="ba-row"><span class="material-symbols-rounded ba-ms">sms_failed</span><span${edit(`rows[${idx}].before`)}>${this.esc(r.before)}</span></div>
        <div class="ba-row"><span class="material-symbols-rounded ba-ms">bolt</span><span${edit(`rows[${idx}].after`)}>${this.esc(r.after)}</span></div>
      </div>`).join('');

    // În original era o structură pe coloane, dar pentru tabel de comparație e mai bine să randăm rând cu rând dacă vrem flexibilitate.
    // Totuși, respectăm structura HTML originală 1:1:
    const beforeRows = (rows || []).map((r, idx) => `<div class="ba-row"><span class="material-symbols-rounded ba-ms">sms_failed</span><span${edit(`rows[${idx}].before`)}>${this.esc(r.before)}</span></div>`).join('');
    const afterRows = (rows || []).map((r, idx) => `<div class="ba-row"><span class="material-symbols-rounded ba-ms">bolt</span><span${edit(`rows[${idx}].after`)}>${this.esc(r.after)}</span></div>`).join('');

    return `
      <div class="sec"${ea}>
        <div class="eyebrow-sm"><span class="ey-line"></span><span${edit('eyebrow')}>${this.esc(eyebrow)}</span><span class="ey-line"></span></div>
        <h2 class="sec-h"${edit('title')}>${title}</h2>
        <div class="ba-wrap">
          <div class="ba-col before">
            <div class="ba-header"><span class="material-symbols-rounded" style="font-size:14px">close</span><span${edit('beforeTitle')}>${this.esc(beforeTitle)}</span></div>
            ${beforeRows}
          </div>
          <div class="ba-col after">
            <div class="ba-header"><span class="material-symbols-rounded" style="font-size:14px">check</span><span${edit('afterTitle')}>${this.esc(afterTitle)}</span></div>
            ${afterRows}
          </div>
        </div>
      </div>`;
  }

  // ── TUTORIALS GRID ───────────────────────────────────
  render_tutorials_grid({ title = '', showTitle = false, categories = [], courses = [], paddingY = 48, paddingX = 40 } = {}, ea = '') {
    const edit = (prop) => (this.editMode ? ` data-editable="true" data-prop="${prop}"` : '');
    
    const catHtml = (categories || []).map((cat, idx) => `
      <button class="cat-btn ${idx === 0 ? 'active' : ''}">
        <span class="material-symbols-rounded"${edit(`categories[${idx}].icon`)}>${this.esc(cat.icon || 'apps')}</span>
        <span${edit(`categories[${idx}].label`)}>${this.esc(cat.label)}</span>
      </button>`).join('');

    const courseHtml = (courses || []).map((c, idx) => {
      const levelClass = (c.level || 'Beginner').toLowerCase();
      return `
        <div class="course-card">
          <div class="cc-thumb" style="background-image:url('${this.esc(c.thumbnailUrl)}');background-size:cover;background-position:center;">
            <div class="cc-thumb-icon"><span class="material-symbols-rounded">play_circle</span></div>
            <div class="cc-play-overlay"><div class="cc-play-btn"><span class="material-symbols-rounded">play_arrow</span></div></div>
            <div class="cc-level ${levelClass}"${edit(`courses[${idx}].level`)}>${this.esc(c.level)}</div>
            <div class="cc-duration"><span class="material-symbols-rounded">schedule</span><span${edit(`courses[${idx}].duration`)}>${this.esc(c.duration)}</span></div>
          </div>
          <div class="cc-body">
            <div class="cc-cat"${edit(`courses[${idx}].category`)}>${this.esc(c.category)}</div>
            <div class="cc-title"${edit(`courses[${idx}].title`)}>${this.esc(c.title)}</div>
            <div class="cc-desc"${edit(`courses[${idx}].desc`)}>${this.esc(c.desc)}</div>
            <div class="cc-footer">
              <button class="cc-btn" data-video-url="${this.esc(c.youtubeUrl)}"><span class="material-symbols-rounded">play_arrow</span>Start</button>
            </div>
          </div>
        </div>`;
    }).join('');

    return `
      <section class="sec w-tutorials-grid" style="padding:${paddingY}px ${paddingX}px"${ea}>
        ${showTitle && title ? `<h2 class="sec-title"${edit('title')}>${this.esc(title)}</h2>` : ''}
        <div class="cats">${catHtml}</div>
        <div class="course-grid">${courseHtml}</div>
      </section>`;
  }

  // ── HTML CUSTOM ───────────────────────────────────────
  render_html({ html = '', paddingY = 24, paddingX = 40 } = {}, ea = '') {
    // Curățăm tag-urile boilerplate dacă există (pentru importuri de pagini întregi)
    let clean = html;
    if (clean.includes('<body')) {
      const match = clean.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (match) clean = match[1];
    }
    // Scoatem head-ul dacă a mai rămas ceva random
    clean = clean.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*<\/head>|<!DOCTYPE[^>]*>/gi, '').trim();

    return `<section class="sec w-html" style="padding:${paddingY}px ${paddingX}px"${ea}>
      <div data-editable="true" data-prop="html">${clean || '<em>Cod HTML custom</em>'}</div>
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
    const words = String(title || '').trim().split(' ');
    if (words.length <= 1) return `<span class="g">${this.esc(title)}</span>`;
    const last = words.pop();
    return `${this.esc(words.join(' '))} <span class="g">${this.esc(last)}</span>`;
  }
}

export default PageRenderer;
