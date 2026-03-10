// admin/editor.js
// ─────────────────────────────────────────────────────────
// Editor core — state, drag-drop, undo/redo, selection
// ─────────────────────────────────────────────────────────

import { PageRenderer }     from './renderer.js';
import WIDGET_DEFINITIONS   from './widgets/definitions.js';

export class Editor {
  constructor(options = {}) {
    this.onStateChange    = options.onStateChange    || (() => {});
    this.onSelectionChange = options.onSelectionChange || (() => {});
    this.onSaveStatus     = options.onSaveStatus     || (() => {});

    this.renderer  = new PageRenderer({ editMode: true });
    this.state     = null;   // { slug, title, sections: [...] }
    this.history   = [];     // undo stack
    this.future    = [];     // redo stack
    this.selected  = null;   // id secțiune selectată
    this.dirty     = false;  // modificări nesalvate
    this.dragState = null;   // drag-drop state

    this._maxHistory = 50;
  }

  // ── LOAD ──────────────────────────────────────────────
  loadPage(pageData) {
    this.state   = this.deepClone(pageData);
    this.history = [];
    this.future  = [];
    this.selected = null;
    this.dirty    = false;
    this._emit();
    this.onSelectionChange(null);
    this.onSaveStatus('saved');
  }

  // ── SECTIONS ──────────────────────────────────────────
  addSection(type, afterId = null) {
    const def = WIDGET_DEFINITIONS[type];
    if (!def) return;

    const newSection = {
      id:    this._uid(),
      type,
      order: 0,
      props: this.deepClone(def.defaultProps || {}),
    };

    this._pushHistory();

    const sections = [...(this.state.sections || [])];
    if (afterId) {
      const idx = sections.findIndex(s => s.id === afterId);
      sections.splice(idx + 1, 0, newSection);
    } else {
      sections.push(newSection);
    }
    this._reorder(sections);
    this.state = { ...this.state, sections };
    this.selected = newSection.id;
    this._markDirty();
    this._emit();
    this.onSelectionChange(newSection);
    return newSection.id;
  }

  deleteSection(id) {
    this._pushHistory();
    const sections = this.state.sections.filter(s => s.id !== id);
    this._reorder(sections);
    this.state = { ...this.state, sections };
    if (this.selected === id) {
      this.selected = null;
      this.onSelectionChange(null);
    }
    this._markDirty();
    this._emit();
  }

  duplicateSection(id) {
    const src = this.state.sections.find(s => s.id === id);
    if (!src) return;
    this._pushHistory();
    const clone = { ...this.deepClone(src), id: this._uid() };
    const sections = [...this.state.sections];
    const idx = sections.findIndex(s => s.id === id);
    sections.splice(idx + 1, 0, clone);
    this._reorder(sections);
    this.state = { ...this.state, sections };
    this.selected = clone.id;
    this._markDirty();
    this._emit();
    return clone.id;
  }

  moveSection(id, direction) {
    this._pushHistory();
    const sections = [...this.state.sections];
    const idx = sections.findIndex(s => s.id === id);
    if (direction === 'up' && idx > 0) {
      [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]];
    } else if (direction === 'down' && idx < sections.length - 1) {
      [sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]];
    }
    this._reorder(sections);
    this.state = { ...this.state, sections };
    this._markDirty();
    this._emit();
  }

  moveSectionTo(id, newIndex) {
    this._pushHistory();
    const sections = [...this.state.sections];
    const fromIndex = sections.findIndex(s => s.id === id);
    if (fromIndex === -1) return;
    const [item] = sections.splice(fromIndex, 1);
    sections.splice(newIndex, 0, item);
    this._reorder(sections);
    this.state = { ...this.state, sections };
    this._markDirty();
    this._emit();
  }

  // ── PROPS ─────────────────────────────────────────────
  updateProps(id, newProps) {
    const sections = this.state.sections.map(s => {
      if (s.id !== id) return s;
      return { ...s, props: { ...s.props, ...newProps } };
    });
    this.state = { ...this.state, sections };
    this._markDirty();
    this._emit();
    // Nu push history la fiecare keystroke — pushem la blur/confirm
  }

  updatePropsWithHistory(id, newProps) {
    this._pushHistory();
    this.updateProps(id, newProps);
  }

  // ── PAGE META ─────────────────────────────────────────
  updateMeta(meta) {
    this._pushHistory();
    this.state = { ...this.state, ...meta };
    this._markDirty();
    this._emit();
  }

  // ── SELECTION ─────────────────────────────────────────
  select(id) {
    this.selected = id;
    const section = id ? this.state.sections.find(s => s.id === id) : null;
    this.onSelectionChange(section);
  }

  deselect() {
    this.selected = null;
    this.onSelectionChange(null);
  }

  // ── UNDO / REDO ───────────────────────────────────────
  undo() {
    if (!this.history.length) return;
    this.future.push(this.deepClone(this.state));
    this.state = this.history.pop();
    this._markDirty();
    this._emit();
  }

  redo() {
    if (!this.future.length) return;
    this.history.push(this.deepClone(this.state));
    this.state = this.future.pop();
    this._markDirty();
    this._emit();
  }

  canUndo() { return this.history.length > 0; }
  canRedo() { return this.future.length > 0; }

  // ── RENDER ────────────────────────────────────────────
  renderHTML() {
    return this.renderer.renderPage(this.state || { sections: [] });
  }

  // ── DRAG DROP ─────────────────────────────────────────
  startDrag(sectionId) {
    this.dragState = { sectionId, overIndex: null };
  }

  dragOver(index) {
    if (this.dragState) this.dragState.overIndex = index;
  }

  endDrag() {
    if (!this.dragState) return;
    const { sectionId, overIndex } = this.dragState;
    this.dragState = null;
    if (overIndex !== null) {
      this.moveSectionTo(sectionId, overIndex);
    }
  }

  cancelDrag() {
    this.dragState = null;
  }

  // ── CLIPBOARD ─────────────────────────────────────────
  copySection(id) {
    const sec = this.state.sections.find(s => s.id === id);
    if (sec) this._clipboard = this.deepClone(sec);
  }

  pasteSection(afterId = null) {
    if (!this._clipboard) return;
    this._pushHistory();
    const clone = { ...this.deepClone(this._clipboard), id: this._uid() };
    const sections = [...this.state.sections];
    if (afterId) {
      const idx = sections.findIndex(s => s.id === afterId);
      sections.splice(idx + 1, 0, clone);
    } else {
      sections.push(clone);
    }
    this._reorder(sections);
    this.state = { ...this.state, sections };
    this.selected = clone.id;
    this._markDirty();
    this._emit();
    return clone.id;
  }

  // ── SAVE ──────────────────────────────────────────────
  async save(token) {
    if (!this.state?.slug) return;
    this.onSaveStatus('saving');
    try {
      const res = await fetch(`/api/pages/${this.state.slug}`, {
        method:  'PUT',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title:         this.state.title,
          meta_title:    this.state.meta_title,
          meta_desc:     this.state.meta_desc,
          bg_color:      this.state.bg_color,
          content:       { sections: this.state.sections },
        }),
      });
      if (!res.ok) throw new Error('Save failed: ' + res.status);
      this.dirty = false;
      this.onSaveStatus('saved');
      return true;
    } catch (err) {
      console.error('[editor] save error:', err);
      this.onSaveStatus('error');
      return false;
    }
  }

  async load(slug, token) {
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();
      const pageData = {
        slug:     data.slug,
        title:    data.title,
        sections: data.content?.sections || [],
      };
      this.loadPage(pageData);
      return pageData;
    } catch (err) {
      console.error('[editor] load error:', err);
      return null;
    }
  }

  // ── INTERNAL ──────────────────────────────────────────
  _pushHistory() {
    this.history.push(this.deepClone(this.state));
    if (this.history.length > this._maxHistory) this.history.shift();
    this.future = []; // clear redo on new action
  }

  _reorder(sections) {
    sections.forEach((s, i) => { s.order = i; });
  }

  _markDirty() {
    this.dirty = true;
    this.onSaveStatus('unsaved');
  }

  _emit() {
    this.onStateChange(this.state, this.selected);
  }

  _uid() {
    return 'sec_' + Math.random().toString(36).slice(2, 10);
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  getSection(id) {
    return this.state?.sections?.find(s => s.id === id) || null;
  }

  getSections() {
    return (this.state?.sections || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export default Editor;
