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
        <div style="padding:40px 20px;text-align:center;color:var(--dim);">
          <span class="material-symbols-rounded" style="font-size:48px;opacity:.2;margin-bottom:12px;">touch_app</span>
          <p style="font-size:13px;">Selectează o secțiune<br>pentru a edita proprietățile</p>
        </div>`;
      this.currentId = null;
      return;
    }

    this.currentId   = section.id;
    this.currentType = section.type;
    const def = WIDGET_DEFINITIONS[section.type];
    if (!def) {
      this.container.innerHTML = `<div style="padding:20px;color:var(--dim);">Widget necunoscut</div>`;
      return;
    }

    if (def.category === 'locked') {
      this.container.innerHTML = `
        <div style="padding:40px 20px;text-align:center;color:var(--dim);">
          <span class="material-symbols-rounded" style="font-size:48px;opacity:.2;margin-bottom:12px;">lock</span>
          <p style="font-size:13px;">Componentă sistem<br>Nu este editabilă</p>
        </div>`;
      return;
    }

    const schema = def.schema || [];
    const props  = section.props || {};

    const html = `
      <div class="adm-right-head" style="border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div class="adm-right-title" style="display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-rounded" style="font-size:18px;">${def.icon}</span>
          ${def.label}
        </div>
      </div>
      <div class="prop-fields" style="padding:0 16px 40px;">
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
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <input class="prop-input" type="text" data-key="${field.key}" value="${this._esc(v)}">
        </div>`;

      case 'textarea':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <textarea class="prop-input prop-textarea" data-key="${field.key}" rows="3">${this._esc(v)}</textarea>
        </div>`;

      case 'richtext':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <div class="pp-richtext-toolbar" style="display:flex;gap:4px;margin-bottom:4px;">
            <button class="adm-dev-btn" data-cmd="bold" title="Bold" style="width:24px;height:24px;"><b>B</b></button>
            <button class="adm-dev-btn" data-cmd="italic" title="Italic" style="width:24px;height:24px;"><i>I</i></button>
            <button class="adm-dev-btn" data-cmd="underline" title="Underline" style="width:24px;height:24px;"><u>U</u></button>
          </div>
          <div class="prop-input" contenteditable="true" data-key="${field.key}" style="min-height:80px;height:auto;display:block;">${v}</div>
        </div>`;

      case 'code':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <textarea class="prop-input" data-key="${field.key}" rows="6" spellcheck="false" style="font-family:monospace;font-size:11px;">${this._esc(v)}</textarea>
        </div>`;

      case 'range':
        return `<div class="prop-group">
          <label class="prop-label">${field.label} <span style="margin-left:auto;color:var(--muted);">${v}${field.unit || ''}</span></label>
          <input class="prop-range" type="range" data-key="${field.key}"
            min="${field.min ?? 0}" max="${field.max ?? 100}" step="${field.step ?? 1}"
            value="${v}" style="width:100%;accent-color:var(--purple);">
        </div>`;

      case 'toggle':
        return `<div class="prop-group" style="display:flex;align-items:center;justify-content:space-between;">
          <label class="prop-label" style="margin-bottom:0;">${field.label}</label>
          <label class="prop-toggle">
            <input type="checkbox" data-key="${field.key}" ${v ? 'checked' : ''} style="display:none;">
            <span class="prop-toggle-track"></span>
          </label>
        </div>`;

      case 'select':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <select class="prop-select" data-key="${field.key}">
            ${(field.options || []).map(o => `<option value="${o}" ${v === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;

      case 'color':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <div class="prop-color-row" style="display:flex;gap:8px;align-items:center;">
            <input class="prop-input" type="text" data-key="${field.key}" value="${this._esc(v)}" placeholder="rgba(...) sau #hex" style="flex:1;">
            <input class="prop-color" type="color" data-key="${field.key}" value="${this._toHex(v)}" style="width:36px;height:32px;padding:2px;border-radius:8px;">
          </div>
        </div>`;

      case 'image_upload':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <div class="pp-img-upload" data-key="${field.key}" style="border:1px dashed var(--border);border-radius:10px;padding:12px;text-align:center;cursor:pointer;margin-bottom:8px;">
            ${v ? `<img src="${this._esc(v)}" style="max-width:100%;max-height:100px;border-radius:6px;">` : `<div style="color:var(--dim);font-size:12px;"><span class="material-symbols-rounded" style="display:block;font-size:24px;margin-bottom:4px;">upload</span> Upload imagine</div>`}
            <input type="file" class="pp-file-input" accept="image/*" data-key="${field.key}" style="display:none">
          </div>
          <input class="prop-input" type="text" data-key="${field.key}" value="${this._esc(v)}" placeholder="sau URL direct...">
        </div>`;

      case 'icon_picker':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <div style="width:36px;height:36px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-rounded pp-icon-current" style="font-size:20px;">${v || 'star'}</span>
            </div>
            <input class="prop-input pp-icon-input" type="text" data-key="${field.key}"
              value="${this._esc(v)}" placeholder="ex: rocket_launch" style="flex:1;">
          </div>
          <div class="pp-icon-grid" data-key="${field.key}" style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;">
            ${this._renderIconGrid(v)}
          </div>
        </div>`;

      case 'columns_picker':
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <div style="display:flex;gap:2px;background:rgba(255,255,255,.04);border-radius:8px;padding:3px;">
            ${[1,2,3,4,5,6].filter(n => n >= (field.min||1) && n <= (field.max||6)).map(n =>
              `<button class="adm-dev-btn ${v == n ? 'active' : ''}" data-val="${n}" style="flex:1;">${n}</button>`
            ).join('')}
          </div>
        </div>`;

      case 'repeater':
        return `<div class="prop-group pp-repeater" data-key="${field.key}">
          <label class="prop-label">${field.label}</label>
          <div class="pp-repeater-list" data-key="${field.key}" style="display:flex;flex-direction:column;gap:8px;">
            ${(Array.isArray(v) ? v : []).map((item, idx) =>
              this._renderRepeaterItem(field, item, idx)
            ).join('')}
          </div>
          <button class="add-page-btn pp-add-item" data-key="${field.key}" style="margin-top:8px;">
            <span class="material-symbols-rounded">add</span> Adaugă element
          </button>
        </div>`;

      default:
        return `<div class="prop-group">
          <label class="prop-label">${field.label}</label>
          <span style="font-size:11px;color:var(--dim);">Tip câmp necunoscut: ${field.type}</span>
        </div>`;
    }
  }

  _renderRepeaterItem(field, item, idx) {
    return `<div class="pp-rep-item" data-idx="${idx}" draggable="true" style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
      <div style="padding:6px 10px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--dim);">
          <span class="material-symbols-rounded" style="font-size:14px;cursor:grab;">drag_indicator</span>
          #${idx + 1}
        </div>
        <button class="adm-dev-btn" data-del="${idx}" style="width:20px;height:20px;color:var(--pink);"><span class="material-symbols-rounded" style="font-size:14px;">close</span></button>
      </div>
      <div style="padding:10px;">
        ${(field.itemSchema || []).map(sub => {
          const sv = item[sub.key] !== undefined ? item[sub.key] : '';
          if (sub.type === 'textarea') {
            return `<div class="prop-group" style="margin-bottom:8px;">
              <label class="prop-label" style="font-size:9.5px;">${sub.label}</label>
              <textarea class="prop-input" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" rows="2">${this._esc(sv)}</textarea>
            </div>`;
          }
          if (sub.type === 'toggle') {
            return `<div class="prop-group" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <label class="prop-label" style="font-size:9.5px;margin-bottom:0;">${sub.label}</label>
              <label class="prop-toggle">
                <input type="checkbox" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" ${sv ? 'checked' : ''} style="display:none;">
                <span class="prop-toggle-track"></span>
              </label>
            </div>`;
          }
          return `<div class="prop-group" style="margin-bottom:8px;">
            <label class="prop-label" style="font-size:9.5px;">${sub.label}</label>
            <input class="prop-input" type="text" data-rep-key="${field.key}" data-item-idx="${idx}" data-sub-key="${sub.key}" value="${this._esc(sv)}">
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
    this.container.querySelectorAll('.prop-input:not([contenteditable]), .prop-textarea').forEach(el => {
      el.addEventListener('input', () => this._debounce(el.dataset.key || (el.dataset.repKey + el.dataset.itemIdx + el.dataset.subKey), () => {
        if (el.dataset.repKey) {
            this._updateRepeaterItem(id, el);
            return;
        }
        this.onUpdate(id, { [el.dataset.key]: el.value });
      }));
    });

    // Richtext
    this.container.querySelectorAll('.prop-input[contenteditable]').forEach(el => {
      el.addEventListener('input', () => this._debounce(el.dataset.key, () => {
        this.onUpdate(id, { [el.dataset.key]: el.innerHTML });
      }));
    });
    this.container.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
      });
    });

    // Range sliders
    this.container.querySelectorAll('.prop-range').forEach(el => {
      el.addEventListener('input', () => {
        if (el.dataset.repKey) {
          this._updateRepeaterItem(id, el);
        } else {
          this.onUpdate(id, { [el.dataset.key]: Number(el.value) });
        }
      });
    });

    // Toggles
    this.container.querySelectorAll('.prop-toggle input').forEach(el => {
      el.addEventListener('change', () => {
        if (el.dataset.repKey) {
          this._updateRepeaterItem(id, el);
        } else {
          this.onUpdate(id, { [el.dataset.key]: el.checked });
        }
      });
    });

    // Selects
    this.container.querySelectorAll('.prop-select').forEach(el => {
      el.addEventListener('change', () => {
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });

    // Color
    this.container.querySelectorAll('.prop-color').forEach(el => {
      el.addEventListener('input', () => {
        const textEl = el.closest('.prop-color-row').querySelector('.prop-input');
        if (textEl) textEl.value = el.value;
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });
    this.container.querySelectorAll('.prop-color-row .prop-input').forEach(el => {
      el.addEventListener('change', () => {
        this.onUpdate(id, { [el.dataset.key]: el.value });
      });
    });

    // Icon picker - text input
    this.container.querySelectorAll('.pp-icon-input').forEach(el => {
      el.addEventListener('input', () => {
        const preview = el.closest('.prop-group').querySelector('.pp-icon-current');
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
        const group = btn.closest('.prop-group');
        const input = group.querySelector('.pp-icon-input');
        const prev  = group.querySelector('.pp-icon-current');
        if (input) input.value = icon;
        if (prev)  prev.textContent = icon;
        group.querySelectorAll('.pp-icon-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onUpdate(id, { [key]: icon });
      });
    });

    // Columns picker
    this.container.querySelectorAll('.adm-dev-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.parentElement.parentElement.querySelector('label').textContent.includes('Coloane') ? 'cols' : ''; 
        // Logică mai sigură ar fi bazată pe un data-key pe container
        const picker = btn.closest('.prop-group').querySelector('[data-key]');
        const realKey = picker ? picker.dataset.key : 'cols';

        btn.parentElement.querySelectorAll('.adm-dev-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onUpdate(id, { [realKey]: Number(btn.dataset.val) });
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
            const group = el.closest('.prop-group');
            const textInput = group.querySelector('.prop-input');
            if (textInput) textInput.value = url;
            this.onUpdate(id, { [key]: url });
            // Refresh preview
            const img = el.querySelector('img');
            if (img) img.src = url;
          }
        });
      }
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
        this.render(newSection);
      });
    });

    // Repeater — delete item
    this.container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.closest('.pp-repeater').dataset.key;
        const idx = parseInt(btn.dataset.del);
        const items = [...(section.props[key] || [])];
        items.splice(idx, 1);
        this.onUpdate(id, { [key]: items });
        const newSection = { ...section, props: { ...section.props, [key]: items } };
        this.render(newSection);
      });
    });
  }

  _updateRepeaterItem(sectionId, el) {
    const key    = el.dataset.repKey;
    const idx    = parseInt(el.dataset.itemIdx);
    const subKey = el.dataset.subKey;
    
    // Obține datele direct din starea editorului (via callback sau state global în admin.js)
    // Deoarece PropertiesPanel nu are acces direct la Editor.state, 
    // vom colecta valorile curente în admin.js
    
    const val = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value;
    
    // Trimitem un obiect parțial pentru a fi procesat în admin.js
    this.onUpdate(sectionId, { 
        _isRepeater: true,
        key: key,
        idx: idx,
        subKey: subKey,
        value: val
    });
  }

  _debounce(key, fn, delay = 150) {
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

  _esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _toHex(val = '') {
    if (val.startsWith('#')) return val;
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return '#7c3aed';
    return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  }
}

export default PropertiesPanel;
