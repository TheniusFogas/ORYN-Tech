// admin/properties.js
// ─────────────────────────────────────────────────────────
// Properties panel — generează formulare contextuale
// pentru fiecare tip de widget pe baza schema din definitions.js
// ─────────────────────────────────────────────────────────

import WIDGET_DEFINITIONS from './widgets/definitions.js';

export class PropertiesPanel {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate  = onUpdate; // callback(id, newProps)
    this.currentId   = null;
    this.currentType = null;
    this._debounceTimers = {};
  }

  // ── RENDER ────────────────────────────────────────────
  render(section) {
    this.container.innerHTML = '';
    if (!section) {
      this.container.innerHTML = `
        <div class="pp-empty">
          <span class="material-symbols-rounded">touch_app</span>
          <p>Selectează o secțiune<br>pentru a edita proprietățile</p>
        </div>`;
      this.currentId = null;
      return;
    }

    this.currentId   = section.id;
    this.currentType = section.type;
    const def = WIDGET_DEFINITIONS[section.type];
    if (!def) {
      this.container.innerHTML = `<div class="pp-empty">Widget necunoscut</div>`;
      return;
    }

    if (def.category === 'locked') {
      this.container.innerHTML = `
        <div class="pp-locked">
          <span class="material-symbols-rounded">lock</span>
          <p>Componentă sistem<br>Nu este editabilă</p>
        </div>`;
      return;
    }

    const schema = def.schema || [];
    const props  = section.props || {};

    const html = `
      <div class="pp-header">
        <span class="material-symbols-rounded">${def.icon}</span>
        <span>${def.label}</span>
      </div>
      <div class="pp-fields">
        ${schema.map(field => this._renderField(field, props[field.key], section.id)).join('')}
      </div>`;

    this.container.innerHTML = html;
    this._bindEvents(section);
  }

  // ── FIELD RENDERERS ───────────────────────────────────
  _renderField(field, value, sectionId) {
    const v = value !== undefined ? value : '';
    switch (field.type) {
      case 'text':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <input class="pp-input" type="text" data-key="${field.key}" value="${this._esc(v)}">
        </div>`;

      case 'textarea':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <textarea class="pp-textarea" data-key="${field.key}" rows="3">${this._esc(v)}</textarea>
        </div>`;

      case 'richtext':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <div class="pp-richtext-toolbar">
            <button class="pp-rt-btn" data-cmd="bold" title="Bold"><b>B</b></button>
            <button class="pp-rt-btn" data-cmd="italic" title="Italic"><i>I</i></button>
            <button class="pp-rt-btn" data-cmd="underline" title="Underline"><u>U</u></button>
          </div>
          <div class="pp-richtext" contenteditable="true" data-key="${field.key}">${v}</div>
        </div>`;

      case 'code':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <textarea class="pp-code" data-key="${field.key}" rows="6" spellcheck="false">${this._esc(v)}</textarea>
        </div>`;

      case 'range':
        return `<div class="pp-field">
          <label class="pp-label">${field.label} <span class="pp-range-val" data-for="${field.key}">${v}${field.unit || ''}</span></label>
          <input class="pp-range" type="range" data-key="${field.key}"
            min="${field.min ?? 0}" max="${field.max ?? 100}" step="${field.step ?? 1}"
            value="${v}">
        </div>`;

      case 'toggle':
        return `<div class="pp-field pp-field-toggle">
          <label class="pp-label">${field.label}</label>
          <label class="pp-switch">
            <input type="checkbox" data-key="${field.key}" ${v ? 'checked' : ''}>
            <span class="pp-switch-track"></span>
          </label>
        </div>`;

      case 'select':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <select class="pp-select" data-key="${field.key}">
            ${(field.options || []).map(o => `<option value="${o}" ${v === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;

      case 'color':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <div class="pp-color-wrap">
            <input class="pp-color-input" type="text" data-key="${field.key}" value="${this._esc(v)}" placeholder="rgba(...) sau #hex">
            <input class="pp-color-picker" type="color" data-key="${field.key}" value="${this._toHex(v)}">
          </div>
        </div>`;

      case 'image_upload':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <div class="pp-img-upload" data-key="${field.key}">
            ${v ? `<img src="${this._esc(v)}" class="pp-img-preview">` : `<div class="pp-img-placeholder"><span class="material-symbols-rounded">upload</span> Click sau drag</div>`}
            <input type="file" class="pp-file-input" accept="image/*" data-key="${field.key}" style="display:none">
          </div>
          <input class="pp-input" type="text" data-key="${field.key}" value="${this._esc(v)}" placeholder="sau URL direct...">
        </div>`;

      case 'icon_picker':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <div class="pp-icon-wrap">
            <div class="pp-icon-preview">
              <span class="material-symbols-rounded pp-icon-current">${v || 'star'}</span>
            </div>
            <input class="pp-input pp-icon-input" type="text" data-key="${field.key}"
              value="${this._esc(v)}" placeholder="ex: rocket_launch">
          </div>
          <div class="pp-icon-grid" data-key="${field.key}">
            ${this._renderIconGrid(v)}
          </div>
        </div>`;

      case 'columns_picker':
        return `<div class="pp-field">
          <label class="pp-label">${field.label}</label>
          <div class="pp-cols-picker" data-key="${field.key}">
            ${[1,2,3,4,5,6].filter(n => n >= (field.min||1) && n <= (field.max||6)).map(n =>
              `<button class="pp-col-btn ${v == n ? 'active' : ''}" data-val="${n}">${n}</button>`
            ).join('')}
          </div>
        </div>`;

      case 'repeater':
        return `<div class="pp-field pp-repeater" data-key="${field.key}">
          <label class="pp-label">${field.label}</label>
          <div class="pp-repeater-list" data-key="${field.key}">
            ${(Array.isArray(v) ? v : []).map((item, idx) =>
              this._renderRepeaterItem(field, item, idx)
            ).join('')}
          </div>
          <button class="pp-add-item" data-key="${field.key}">
            <span class="material-symbols-rounded">add</span> Adaugă
          </button>
        </div>`;

      default:
        return `<div class="pp-field pp-field-unknown">
          <label class="pp-label">${field.label}</label>
          <span style="font-size:11px;color:#8a84aa">Tip câmp necunoscut: ${field.type}</span>
        </div>`;
    }
  }

  _renderRepeaterItem(field, item, idx) {
    return `<div class="pp-rep-item" data-idx="${idx}" draggable="true">
      <div class="pp-rep-header">
        <span class="pp-rep-drag material-symbols-rounded">drag_indicator</span>
        <span class="pp-rep-label">#${idx + 1}</span>
        <button class="pp-rep-del material-symbols-rounded" data-del="${idx}">close</button>
      </div>
      <div class="pp-rep-fields">
        ${(field.itemSchema || []).map(sub => {
          const sv = item[sub.key] !== undefined ? item[sub.key] : '';
          if (sub.type === 'textarea') {
            return `<div class="pp-sub-field">
              <label class="pp-sublabel">${sub.label}</label>
              <textarea class="pp-textarea" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" rows="2">${this._esc(sv)}</textarea>
            </div>`;
          }
          if (sub.type === 'toggle') {
            return `<div class="pp-sub-field pp-field-toggle">
              <label class="pp-sublabel">${sub.label}</label>
              <label class="pp-switch">
                <input type="checkbox" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" ${sv ? 'checked' : ''}>
                <span class="pp-switch-track"></span>
              </label>
            </div>`;
          }
          if (sub.type === 'range') {
            return `<div class="pp-sub-field">
              <label class="pp-sublabel">${sub.label} <span class="pp-range-val" data-for="${field.key}_${idx}_${sub.key}">${sv}</span></label>
              <input class="pp-range" type="range" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}"
                min="${sub.min??0}" max="${sub.max??100}" step="${sub.step??1}" value="${sv}">
            </div>`;
          }
          if (sub.type === 'icon_picker') {
            return `<div class="pp-sub-field">
              <label class="pp-sublabel">${sub.label}</label>
              <div class="pp-icon-wrap">
                <div class="pp-icon-preview"><span class="material-symbols-rounded">${sv||'star'}</span></div>
                <input class="pp-input" type="text" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" value="${this._esc(sv)}" placeholder="ex: smart_toy">
              </div>
            </div>`;
          }
          return `<div class="pp-sub-field">
            <label class="pp-sublabel">${sub.label}</label>
            <input class="pp-input" type="text"
              data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}"
              value="${this._esc(sv)}">
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  _renderIconGrid(current) {
    const icons = [
      'smart_toy','rocket_launch','auto_awesome','check_circle','star','bolt',
      'trending_up','groups','schedule','notifications','phone','email',
      'chat','support_agent','analytics','settings','dashboard','storefront',
      'local_hospital','spa','fitness_center','home','gavel','shopping_cart',
      'play_circle','image','code','link','language','lock','lock_open',
      'send','ads_click','price_change','bar_chart','pie_chart','insights',
      'person','business','work','school','medical_services','engineering',
    ];
    return icons.map(ic => `
      <button class="pp-icon-option ${ic === current ? 'active' : ''}" data-icon="${ic}" title="${ic}">
        <span class="material-symbols-rounded">${ic}</span>
      </button>`).join('');
  }

  // ── EVENTS ────────────────────────────────────────────
  _bindEvents(section) {
    const id = section.id;

    // Text inputs — debounced
    this.container.querySelectorAll('.pp-input, .pp-textarea, .pp-code').forEach(el => {
      el.addEventListener('input', () => this._debounce(el.dataset.key, () => {
        if (el.dataset.repKey) return; // handled by repeater
        this.onUpdate(id, { [el.dataset.key]: el.value });
      }));
      el.addEventListener('change', () => {
        if (el.dataset.repKey) return;
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });

    // Richtext
    this.container.querySelectorAll('.pp-richtext').forEach(el => {
      el.addEventListener('input', () => this._debounce(el.dataset.key, () => {
        this.onUpdate(id, { [el.dataset.key]: el.innerHTML });
      }));
    });
    this.container.querySelectorAll('.pp-rt-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
      });
    });

    // Range sliders
    this.container.querySelectorAll('.pp-range').forEach(el => {
      el.addEventListener('input', () => {
        // Update display value
        const valEl = this.container.querySelector(`.pp-range-val[data-for="${el.dataset.key}"]`);
        if (valEl) valEl.textContent = el.value;
        if (!el.dataset.repKey) {
          this.onUpdate(id, { [el.dataset.key]: Number(el.value) });
        } else {
          this._updateRepeaterItem(id, el);
        }
      });
    });

    // Toggles
    this.container.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.addEventListener('change', () => {
        if (!el.dataset.repKey) {
          this.onUpdate(id, { [el.dataset.key]: el.checked });
        } else {
          this._updateRepeaterItem(id, el);
        }
      });
    });

    // Selects
    this.container.querySelectorAll('.pp-select').forEach(el => {
      el.addEventListener('change', () => {
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });

    // Color
    this.container.querySelectorAll('.pp-color-picker').forEach(el => {
      el.addEventListener('input', () => {
        const textEl = this.container.querySelector(`.pp-color-input[data-key="${el.dataset.key}"]`);
        if (textEl) textEl.value = el.value;
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });
    this.container.querySelectorAll('.pp-color-input').forEach(el => {
      el.addEventListener('change', () => {
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });

    // Icon picker - text input
    this.container.querySelectorAll('.pp-icon-input').forEach(el => {
      el.addEventListener('input', () => {
        const preview = el.closest('.pp-field').querySelector('.pp-icon-current');
        if (preview) preview.textContent = el.value || 'star';
        this._debounce(el.dataset.key, () => {
          this.onUpdate(id, { [el.dataset.key]: el.value });
        });
      });
    });

    // Icon grid
    this.container.querySelectorAll('.pp-icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const key   = btn.closest('.pp-icon-grid').dataset.key;
        const icon  = btn.dataset.icon;
        const input = this.container.querySelector(`.pp-icon-input[data-key="${key}"]`);
        const prev  = this.container.querySelector('.pp-icon-current');
        if (input) input.value = icon;
        if (prev)  prev.textContent = icon;
        this.container.querySelectorAll('.pp-icon-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onUpdate(id, { [key]: icon });
      });
    });

    // Columns picker
    this.container.querySelectorAll('.pp-col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.closest('.pp-cols-picker').dataset.key;
        this.container.querySelectorAll('.pp-col-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onUpdate(id, { [key]: Number(btn.dataset.val) });
      });
    });

    // Image upload click
    this.container.querySelectorAll('.pp-img-upload').forEach(el => {
      el.addEventListener('click', () => {
        el.querySelector('.pp-file-input')?.click();
      });
      const fileInput = el.querySelector('.pp-file-input');
      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const url = await this._uploadImage(file);
          if (url) {
            const key = el.dataset.key;
            const textInput = this.container.querySelector(`.pp-input[data-key="${key}"]`);
            if (textInput) textInput.value = url;
            this.onUpdate(id, { [key]: url });
          }
        });
      }
    });

    // Repeater — sub-field inputs
    this.container.querySelectorAll('[data-rep-key]').forEach(el => {
      const evt = el.tagName === 'INPUT' && el.type !== 'checkbox' ? 'input' : 'change';
      el.addEventListener(evt, () => this._updateRepeaterItem(id, el));
    });

    // Repeater — delete item
    this.container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.closest('.pp-repeater').dataset.key;
        const idx = parseInt(btn.dataset.del);
        const items = [...(section.props[key] || [])];
        items.splice(idx, 1);
        this.onUpdate(id, { [key]: items });
        // Re-render this section's props
        const newSection = { ...section, props: { ...section.props, [key]: items } };
        section = newSection;
        this.render(newSection);
      });
    });

    // Repeater — add item
    this.container.querySelectorAll('.pp-add-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const def = WIDGET_DEFINITIONS[section.type];
        const fieldDef = def?.schema?.find(f => f.key === key);
        if (!fieldDef?.itemSchema) return;
        const newItem = { id: 'item_' + Math.random().toString(36).slice(2, 8) };
        fieldDef.itemSchema.forEach(sub => { newItem[sub.key] = ''; });
        const items = [...(section.props[key] || []), newItem];
        this.onUpdate(id, { [key]: items });
        const newSection = { ...section, props: { ...section.props, [key]: items } };
        section = newSection;
        this.render(newSection);
      });
    });
  }

  _updateRepeaterItem(sectionId, el) {
    const key    = el.dataset.repKey;
    const idx    = parseInt(el.dataset.itemIdx);
    const subKey = el.dataset.subKey;
    const sec    = this._getSection(sectionId);
    if (!sec) return;
    const items = JSON.parse(JSON.stringify(sec.props[key] || []));
    if (!items[idx]) return;
    const val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
    items[idx][subKey] = val;
    this.onUpdate(sectionId, { [key]: items });

    // Update range display
    if (el.type === 'range') {
      const valEl = this.container.querySelector(`.pp-range-val[data-for="${key}_${idx}_${subKey}"]`);
      if (valEl) valEl.textContent = el.value;
    }
  }

  _debounce(key, fn, delay = 120) {
    clearTimeout(this._debounceTimers[key]);
    this._debounceTimers[key] = setTimeout(fn, delay);
  }

  async _uploadImage(file) {
    const token = localStorage.getItem('oryn_admin_token');
    if (!token) return null;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  _getSection(id) {
    // Called from repeater handlers - needs access to current state
    // Passed via closure in render()
    return null; // Will be overridden by admin.js
  }

  _esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _toHex(val = '') {
    if (val.startsWith('#')) return val;
    // Parse rgba to hex approximate (for color picker)
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return '#7c3aed';
    return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  }
}

export default PropertiesPanel;
