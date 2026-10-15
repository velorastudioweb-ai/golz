import { useEffect, useRef, useState } from "react";
import {
  Upload, Trash2, Star, Eye, EyeOff, Pencil, CheckSquare, Square, Filter,
  LayoutGrid, Plus, ChevronUp, ChevronDown, Save, X,
} from "lucide-react";
import api from "../api/client";
import SEO from "../components/SEO";
import PageLoader from "../components/PageLoader";
import ImgFallback from "../components/ImgFallback";
import { Modal, ConfirmDialog, Toast, Field, Toggle, EmptyState } from "./AdminUI";
import { formatDate } from "../utils/helpers";

const EMPTY_SECTION = { name: "", title: "", description: "", eventDescriptions: {}, published: true };

export default function GalleryAdmin() {
  const [items, setItems] = useState(null);
  const [sections, setSections] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploadSection, setUploadSection] = useState("General");
  const [sectionModal, setSectionModal] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const fileRef = useRef(null);

  const load = () =>
    api.get("/admin/gallery").then(({ data }) => { setItems(data); setSelected([]); }).catch(() => {
      showToast("Failed to load gallery", "error");
      setItems([]);
    });
  const loadSections = () =>
    api.get("/admin/gallery/sections").then(({ data }) => {
      setSections(data);
      setUploadSection((cur) => (data.some((s) => s.name === cur) ? cur : (data[0]?.name ?? "General")));
    }).catch(() => showToast("Failed to load gallery sections", "error"));

  useEffect(() => {
    load();
    loadSections();
  }, []);

  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(async () => {
      await api.put(`/admin/gallery/${editing._id}`, editing).catch(() => {});
      load();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const uploadFiles = async (files) => {
    setUploading(files.length);
    const failed = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("category", uploadSection);
      try {
        await api.post("/admin/gallery/upload", form);
      } catch (err) {
        failed.push({ name: file.name, message: err.response?.data?.message || "Upload failed" });
      }
      setUploading((u) => u - 1);
    }
    if (failed.length === 0) {
      showToast(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to ${uploadSection}`);
    } else if (failed.length === files.length) {
      showToast(`Upload failed: ${failed[0].message}`, "error");
    } else {
      showToast(`${files.length - failed.length} uploaded, ${failed.length} failed (e.g. ${failed[0].name}: ${failed[0].message})`, "error");
    }
    load();
    loadSections();
  };

  const toggle = async (item, field) => {
    try {
      await api.put(`/admin/gallery/${item._id}`, { [field]: !item[field] });
      showToast(field === "featured" ? (item[field] ? "Removed from featured" : "Marked as featured") : (item[field] ? "Item hidden" : "Item published"));
      load();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to update ${field}`, "error");
    }
  };

  const reorder = async (next) => {
    setItems(next);
    try {
      await api.post("/admin/gallery/reorder", { ids: next.map((g) => g._id) });
    } catch (err) {
      showToast(err.response?.data?.message || "Reorder failed", "error");
      load();
    }
  };

  const moveSection = async (index, dir) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await api.post("/admin/gallery/sections/reorder", { ids: next.map((s) => s._id) });
    } catch (err) {
      showToast(err.response?.data?.message || "Reorder failed", "error");
      loadSections();
    }
  };

  const toggleSection = async (s) => {
    try {
      await api.put(`/admin/gallery/sections/${s._id}`, { published: !s.published });
      showToast(s.published ? "Section hidden" : "Section visible");
      loadSections();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const saveSection = async () => {
    if (!sectionModal.name.trim()) return showToast("Section name is required", "error");
    try {
      if (sectionModal._id) {
        await api.put(`/admin/gallery/sections/${sectionModal._id}`, sectionModal);
        showToast("Section updated");
      } else {
        await api.post("/admin/gallery/sections", sectionModal);
        showToast("Section added");
      }
      closeSectionModal();
      loadSections();
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed", "error");
    }
  };

  const closeSectionModal = () => {
    setSectionModal(null);
    setNewEventTitle("");
  };

  /* Event titles that may carry their own blurb inside the section currently
     being edited: every subsection found among this section's photos, plus any
     title already present in the saved map so an existing description can be
     edited or cleared even when its photos are not in the current list. */
  const sectionEventNames = (() => {
    if (!sectionModal) return [];
    const names = new Set(Object.keys(sectionModal.eventDescriptions || {}));
    for (const g of items || []) {
      const event = String(g.eventName || "").trim();
      if (event && String(g.category || "") === String(sectionModal.name || "")) names.add(event);
    }
    return [...names];
  })();

  const chips = sections.length ? sections.map((s) => s.name) : [];
  const visible = (items || []).filter((g) => filter === "All" || g.category === filter);

  return (
    <>
      <SEO title="Gallery & Media" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-charcoal/40" />
          {["All", ...chips].map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={`chip ${filter === c ? "chip-active" : ""}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <button onClick={() => setBulkDelete(true)} className="btn-primary !bg-red-500 !px-5 !py-2.5 !text-sm hover:!bg-red-600">
              <Trash2 size={15} /> Delete ({selected.length})
            </button>
          )}
          <select
            value={uploadSection}
            onChange={(e) => setUploadSection(e.target.value)}
            className="input !w-auto !py-2.5 !text-sm"
            aria-label="Upload to section"
            title="Section to upload into"
          >
            {sections.length ? sections.map((s) => <option key={s._id} value={s.name}>{s.title || s.name}</option>) : <option value="General">General</option>}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading > 0 || busy || sections.length === 0}
            className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60"
            title={sections.length === 0 ? "Please select a gallery section first" : `Upload to ${uploadSection}`}
          >
            <Upload size={16} /> {uploading > 0 ? `Uploading ${uploading}…` : `Upload to ${uploadSection}`}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden"
            onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) uploadFiles(files); e.target.value = ""; }} />
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Please select a gallery section first — add a section below, then choose it in the dropdown to upload images into it.
        </p>
      ) : (
        <p className="mb-6 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
          Selected section: <strong>{uploadSection}</strong>
        </p>
      )}

      {/* Sections manager */}
      <div className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
            <LayoutGrid size={17} className="text-primary" /> Gallery Sections
          </h3>
          <button onClick={() => setSectionModal({ ...EMPTY_SECTION })} className="btn-primary !px-4 !py-2 !text-sm">
            <Plus size={15} /> Add Section
          </button>
        </div>
        {sections.length === 0 ? (
          <p className="text-sm text-charcoal/50">No sections yet — add one to organise your gallery. Images can live in any section (or &quot;General&quot;).</p>
        ) : (
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={s._id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${s.published ? "border-gray-100 bg-white" : "border-dashed border-charcoal/20 bg-charcoal/[0.03] opacity-70"}`}>
                {s.cover ? (
                  <ImgFallback src={s.cover} alt="" className="h-10 w-14 shrink-0 rounded-lg object-cover" fallbackClassName="h-10 w-14 shrink-0 rounded-lg" />
                ) : (
                  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{s.name.slice(0, 2).toUpperCase()}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal">{s.title || s.name}</p>
                  <p className="text-xs text-charcoal/45">
                    {s.count} media
                    {Object.keys(s.eventDescriptions || {}).length > 0
                      ? ` • ${Object.keys(s.eventDescriptions).length} event blurb${Object.keys(s.eventDescriptions).length > 1 ? "s" : ""}`
                      : ""}
                    {!s.published && " • hidden"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move up"><ChevronUp size={14} /></button>
                  <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move down"><ChevronDown size={14} /></button>
                  <button onClick={() => toggleSection(s)} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Show/hide section">
                    {s.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setSectionModal({ ...s, eventDescriptions: { ...(s.eventDescriptions || {}) } })} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Edit section"><Pencil size={14} /></button>
                  <button onClick={() => setDeletingSection(s)} className="rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white" aria-label="Delete section"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!items ? (
        <PageLoader />
      ) : visible.length === 0 ? (
        <EmptyState text="No media in this section. Upload images or videos to get started." />
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
          {visible.map((g, i) => (
            <div
              key={g._id}
              draggable={!selected.length}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null || dragIndex === i) return;
                const next = [...visible];
                const [moved] = next.splice(dragIndex, 1);
                next.splice(i, 0, moved);
                reorder(next.map((x) => x));
                setDragIndex(null);
              }}
              className={`group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl shadow-card ${dragIndex === i ? "opacity-50 ring-2 ring-primary" : ""} ${selected.includes(g._id) ? "ring-2 ring-primary" : ""}`}
            >
              {g.type === "video" ? (
                <video src={g.url} muted className="aspect-square w-full object-cover" />
              ) : (
                <ImgFallback src={g.url} alt={g.alt} className="h-auto w-full object-contain" fallbackClassName="aspect-square" />
              )}
              <span className="absolute left-2 top-2 rounded-md bg-charcoal/70 px-2 py-0.5 text-[10px] font-semibold text-white">{g.category}</span>
              <button
                onClick={() => setSelected((s) => (s.includes(g._id) ? s.filter((x) => x !== g._id) : [...s, g._id]))}
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-charcoal shadow transition hover:bg-primary hover:text-white"
                aria-label="Select"
              >
                {selected.includes(g._id) ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-charcoal/85 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
                <div className="flex gap-1">
                  <button onClick={() => toggle(g, "featured")} className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-gold" title="Feature" aria-label="Toggle featured">
                    <Star size={13} className={g.featured ? "fill-gold text-gold" : ""} />
                  </button>
                  <button onClick={() => toggle(g, "published")} className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-primary" title="Show/hide" aria-label="Toggle publish">
                    {g.published ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button onClick={() => setEditing({ ...g })} className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-primary" title="Edit details" aria-label="Edit details">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleting(g)} className="rounded-lg bg-white/15 p-1.5 text-white hover:bg-red-500" title="Delete" aria-label="Delete item">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="absolute left-2 top-7 max-w-[90%]">
                {g.featured && <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold text-white">★ Featured</span>}
              </div>
              {!g.published && <span className="absolute inset-0 bg-charcoal/55" />}
            </div>
          ))}
        </div>
      )}

      {items && items.length > 0 && (
        <p className="mt-4 text-center text-xs text-charcoal/40">Tip: drag tiles to reorder • {items.length} total items • Hover a tile for actions</p>
      )}

      {/* Edit item modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit media details">
        {editing && (
          <div className="space-y-5">
            <div className="flex gap-4">
              {editing.type === "video"
                ? <video src={editing.url} controls className="h-32 w-48 shrink-0 rounded-xl object-cover" />
                : <ImgFallback src={editing.url} alt="" className="h-32 w-48 shrink-0 rounded-xl object-cover" fallbackClassName="h-32 w-48 shrink-0 rounded-xl" />}
              <div className="flex-1 space-y-4">
                <Field label="Section">
                  <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    {sections.length ? sections.map((s) => <option key={s._id} value={s.name}>{s.title || s.name}</option>) : <option>{editing.category}</option>}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Year" hint="Shown as secondary info">
                    <input className="input" value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} placeholder="e.g. 2020" />
                  </Field>
                  <Field label="Event name" hint="Main heading for this photo">
                    <input className="input" value={editing.eventName || ""} onChange={(e) => setEditing({ ...editing, eventName: e.target.value })} placeholder="e.g. Annual Cultural Fest" />
                  </Field>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75">
                    <Toggle checked={editing.published} onChange={(published) => setEditing({ ...editing, published })} label="Published" /> Published
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75">
                    <Toggle checked={editing.featured} onChange={(featured) => setEditing({ ...editing, featured })} label="Featured" /> Featured
                  </label>
                </div>
              </div>
            </div>
            <Field label="Caption" hint="Shown under the event name in the lightbox. Leave blank if the event name already says it.">
              <textarea className="input resize-none" rows={2} value={editing.caption || ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} placeholder="Describe this specific photo…" />
            </Field>
            <Field label="Description" hint="Shown under the name when the image opens">
              <textarea className="input resize-none" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Describe this photo or video…" />
            </Field>
            <Field label="SEO alt text">
              <input className="input" value={editing.alt} onChange={(e) => setEditing({ ...editing, alt: e.target.value })} />
            </Field>
            <p className="text-xs text-charcoal/40">Uploaded {formatDate(editing.createdAt)} — changes save automatically.</p>
          </div>
        )}
      </Modal>

      {/* Section add/edit modal */}
      <Modal open={!!sectionModal} onClose={closeSectionModal} title={sectionModal?._id ? "Edit section" : "Add section"}>
        {sectionModal && (
          <div className="space-y-5">
            <Field label="Name *" hint="Matches the tag shown on each image">
              <input className="input" value={sectionModal.name} onChange={(e) => setSectionModal({ ...sectionModal, name: e.target.value })} placeholder="e.g. Workshops" />
            </Field>
            <Field label="Title shown on gallery page" hint="Leave empty to use the name">
              <input className="input" value={sectionModal.title} onChange={(e) => setSectionModal({ ...sectionModal, title: e.target.value })} placeholder={sectionModal.name || "e.g. Cooking Workshops"} />
            </Field>
            <Field label="Description" hint="Intro shown under this section's title on the gallery page; leave blank to show nothing.">
              <textarea className="input resize-none" rows={3} value={sectionModal.description} onChange={(e) => setSectionModal({ ...sectionModal, description: e.target.value })} placeholder="Short intro for this section…" />
            </Field>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-charcoal">Subsection (event) descriptions</p>
              <p className="mb-3 mt-1 text-xs text-charcoal/50">
                Optional, one per event. Each description appears on the gallery page directly below its event title and above
                its photo grid. Clear the text and save to remove one.
              </p>
              {sectionEventNames.length ? (
                <div className="space-y-3">
                  {sectionEventNames.map((event) => (
                    <Field key={event} label={event}>
                      <textarea
                        className="input resize-none"
                        rows={2}
                        value={(sectionModal.eventDescriptions || {})[event] || ""}
                        onChange={(e) =>
                          setSectionModal({
                            ...sectionModal,
                            eventDescriptions: { ...(sectionModal.eventDescriptions || {}), [event]: e.target.value },
                          })
                        }
                        placeholder="Leave blank to show nothing under this event…"
                      />
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-charcoal/45">
                  No events in this section yet — each event title will appear here once its photos carry that event name.
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <input
                  className="input !py-2 !text-sm"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("add-event-blurb")?.click();
                    }
                  }}
                  placeholder="Event title not listed yet…"
                  aria-label="Event title to describe"
                />
                <button
                  id="add-event-blurb"
                  type="button"
                  onClick={() => {
                    const title = newEventTitle.trim();
                    if (!title) return;
                    setSectionModal({ ...sectionModal, eventDescriptions: { ...(sectionModal.eventDescriptions || {}), [title]: "" } });
                    setNewEventTitle("");
                  }}
                  className="btn-outline shrink-0 !px-4 !py-2 !text-sm"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75">
              <Toggle checked={sectionModal.published} onChange={(published) => setSectionModal({ ...sectionModal, published })} label="Visible on site" /> Visible on site
            </label>
            <div className="flex justify-end gap-2.5">
              <button onClick={closeSectionModal} className="btn-outline !px-5 !py-2.5 !text-sm"><X size={15} /> Cancel</button>
              <button onClick={saveSection} className="btn-primary !px-5 !py-2.5 !text-sm"><Save size={15} /> Save Section</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => { if (!busy) setDeleting(null); }}
        title="Delete this item?"
        text="It will be removed from the public gallery immediately."
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.delete(`/admin/gallery/${deleting._id}`);
            showToast("Item deleted");
          } catch (err) {
            showToast(err.response?.data?.message || "Delete failed", "error");
          }
          setDeleting(null);
          setBusy(false);
          load();
        }}
      />
      <ConfirmDialog
        open={bulkDelete}
        onClose={() => { if (!busy) setBulkDelete(false); }}
        title={`Delete ${selected.length} items?`}
        text="All selected media will be removed permanently."
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.post("/admin/gallery/bulk-delete", { ids: selected });
            showToast(`${selected.length} items deleted`);
          } catch (err) {
            showToast(err.response?.data?.message || "Delete failed", "error");
          }
          setBulkDelete(false);
          setBusy(false);
          load();
        }}
      />
      <ConfirmDialog
        open={!!deletingSection}
        onClose={() => { if (!busy) setDeletingSection(null); }}
        title={`Delete section "${deletingSection?.name}"?`}
        text="Its media will be moved to the General section. Nothing is deleted."
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.delete(`/admin/gallery/sections/${deletingSection._id}`);
            showToast("Section deleted");
          } catch (err) {
            showToast(err.response?.data?.message || "Delete failed", "error");
          }
          setDeletingSection(null);
          setBusy(false);
          loadSections();
          load();
        }}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}
