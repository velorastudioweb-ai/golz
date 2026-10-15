import { useEffect, useRef, useState } from "react";
import {
  Upload, Trash2, Star, Eye, EyeOff, Pencil, CheckSquare, Square, Filter,
  LayoutGrid, Plus, ChevronUp, ChevronDown, Save, X, Tag as TagIcon, Image as ImageIcon,
  Layers, ImagePlus,
} from "lucide-react";
import api from "../api/client";
import SEO from "../components/SEO";
import PageLoader from "../components/PageLoader";
import ImgFallback from "../components/ImgFallback";
import { Modal, ConfirmDialog, Toast, Field, Toggle, EmptyState } from "./AdminUI";
import { formatDate } from "../utils/helpers";

const EMPTY_SECTION = { name: "", title: "", description: "", eventDescriptions: {}, published: true, showEmpty: false, cover: "" };
const EMPTY_TAG = { name: "", blurb: "", published: true };

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
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadMainSection, setUploadMainSection] = useState("");
  const [uploadEventName, setUploadEventName] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadPreview, setUploadPreview] = useState([]);
  const [subsectionFilter, setSubsectionFilter] = useState("");
  const [sectionModal, setSectionModal] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [tagModal, setTagModal] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const uploadRef = useRef(null);
  const gridRef = useRef(null);

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

  const loadTags = () =>
    api.get("/admin/gallery/tags").then(({ data }) => setTags(data)).catch(() => showToast("Failed to load gallery tags", "error"));

  useEffect(() => {
    load();
    loadSections();
    loadTags();
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

  const clearPreview = () => {
    setUploadPreview((cur) => {
      cur.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      return [];
    });
  };

  const pickFiles = (files) => {
    const next = files.map((file) => ({
      file,
      name: file.name,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      video: file.type.startsWith("video/"),
    }));
    setUploadPreview((cur) => [...cur, ...next]);
  };

  const removePreview = (index) =>
    setUploadPreview((cur) => {
      const p = cur[index];
      if (p?.url) URL.revokeObjectURL(p.url);
      return cur.filter((_, i) => i !== index);
    });

  const uploadFiles = async () => {
    if (!uploadSection) return showToast("Please select a year before uploading", "error");
    if (!uploadEventName.trim()) return showToast("Please select or type a subsection before uploading", "error");
    if (!uploadPreview.length) return showToast("Choose at least one image first", "error");

    const tagsForBatch = [...new Set([uploadMainSection, ...uploadTags].map((t) => String(t).trim()).filter(Boolean))];
    const files = uploadPreview.map((p) => p.file);
    setUploading(files.length);
    const failed = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("category", uploadSection);
      form.append("eventName", uploadEventName.trim());
      if (uploadTitle.trim()) form.append("caption", uploadTitle.trim());
      if (uploadDescription.trim()) form.append("description", uploadDescription.trim());
      for (const tag of tagsForBatch) form.append("tags", tag);
      try {
        await api.post("/admin/gallery/upload", form);
      } catch (err) {
        failed.push({ name: file.name, message: err.response?.data?.message || "Upload failed" });
      }
      setUploading((u) => u - 1);
    }
    const prefix = `${uploadSection} › ${uploadEventName.trim()}`;
    const suffix = tagsForBatch.length ? ` · tagged ${tagsForBatch.join(", ")}` : "";
    if (failed.length === 0) {
      showToast(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to ${prefix}${suffix}`);
    } else if (failed.length === files.length) {
      showToast(`Upload failed: ${failed[0].message}`, "error");
    } else {
      showToast(`${files.length - failed.length} uploaded, ${failed.length} failed (e.g. ${failed[0].name}: ${failed[0].message})`, "error");
    }
    clearPreview();
    load();
    loadSections();
    loadTags();
  };

  const addImagesTo = (year, subsection) => {
    setUploadSection(year);
    setUploadEventName(subsection === "(no subsection)" ? "" : subsection);
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const manageImages = (year, subsection) => {
    setFilter(year);
    setSubsectionFilter(subsection === "(no subsection)" ? "" : subsection);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleUploadTag = (name) =>
    setUploadTags((cur) => (cur.includes(name) ? cur.filter((t) => t !== name) : [...cur, name]));

  const toggleEditTag = (name) =>
    setEditing((cur) => {
      if (!cur) return cur;
      const list = Array.isArray(cur.tags) ? cur.tags : [];
      return { ...cur, tags: list.includes(name) ? list.filter((t) => t !== name) : [...list, name] };
    });

  /* Tags manager */
  const saveTag = async () => {
    if (!tagModal?.name?.trim()) return showToast("Tag name is required", "error");
    try {
      if (tagModal._id) {
        await api.put(`/admin/gallery/tags/${tagModal._id}`, tagModal);
        showToast("Tag updated");
      } else {
        await api.post("/admin/gallery/tags", tagModal);
        showToast("Tag added");
      }
      setTagModal(null);
      loadTags();
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed", "error");
    }
  };

  const moveTag = async (index, dir) => {
    const next = [...tags];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setTags(next);
    try {
      await api.post("/admin/gallery/tags/reorder", { ids: next.map((t) => t._id) });
    } catch (err) {
      showToast(err.response?.data?.message || "Reorder failed", "error");
      loadTags();
    }
  };

  const toggleTag = async (t) => {
    try {
      await api.put(`/admin/gallery/tags/${t._id}`, { published: !t.published });
      showToast(t.published ? "Tag hidden from site" : "Tag visible on site");
      loadTags();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  const uploadCover = async (file) => {
    if (!file || !sectionModal) return;
    setCoverUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/admin/upload", form);
      setSectionModal((m) => (m ? { ...m, cover: data.url } : m));
      showToast("Cover uploaded — remember to save the section");
    } catch (err) {
      showToast(err.response?.data?.message || "Cover upload failed", "error");
    } finally {
      setCoverUploading(false);
    }
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
  const visible = (items || []).filter(
    (g) => (filter === "All" || g.category === filter) &&
      (!subsectionFilter || String(g.eventName || "").trim() === subsectionFilter)
  );

  /* Subsection directory: year -> subsection -> image count. Rendered in the
     same order as the sections list so it mirrors the public gallery. */
  const sectionRank = new Map(sections.map((s, i) => [s.name, i]));
  const subsectionsByYear = (() => {
    const map = new Map();
    for (const g of items || []) {
      const year = g.category || "General";
      if (!map.has(year)) map.set(year, new Map());
      const subs = map.get(year);
      const name = String(g.eventName || "").trim() || "(no subsection)";
      subs.set(name, (subs.get(name) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => (sectionRank.get(a[0]) ?? 999) - (sectionRank.get(b[0]) ?? 999))
      .map(([year, subs]) => [year, [...subs.entries()].sort((a, b) => a[0].localeCompare(b[0])),
        [...subs.values()].reduce((n, c) => n + c, 0)]);
  })();

  /* Existing subsection names for the year currently selected in the upload
     form, used to populate the datalist dropdown (admins can still type new). */
  const subsectionOptions = [...new Set(
    (items || [])
      .filter((g) => g.category === uploadSection)
      .map((g) => String(g.eventName || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const subsectionOptionsFor = (year) => [...new Set(
    (items || [])
      .filter((g) => g.category === year)
      .map((g) => String(g.eventName || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <SEO title="Gallery & Media" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-charcoal/40" />
          {["All", ...chips].map((c) => (
            <button key={c} onClick={() => { setFilter(c); setSubsectionFilter(""); }} className={`chip ${filter === c ? "chip-active" : ""}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <button onClick={() => setBulkDelete(true)} className="btn-primary !bg-red-500 !px-5 !py-2.5 !text-sm hover:!bg-red-600">
              <Trash2 size={15} /> Delete ({selected.length})
            </button>
          )}
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Add a section (year) below first, then choose it here to upload images into its subsections.
        </p>
      ) : (
        <div ref={uploadRef} className="card mb-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
              <Upload size={17} className="text-primary" /> Add Images to a Subsection
            </h3>
            <p className="text-xs text-charcoal/50">Pick a year and a subsection, choose images, then upload.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
              Select Year <span className="text-red-500">*</span>
              <select
                value={uploadSection}
                onChange={(e) => { setUploadSection(e.target.value); setUploadEventName(""); }}
                className="input !py-2 !text-sm"
                aria-label="Select year"
              >
                {sections.map((s) => <option key={s._id} value={s.name}>{s.title || s.name}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
              Select Main Section <span className="font-normal text-charcoal/40">(optional)</span>
              <select
                value={uploadMainSection}
                onChange={(e) => setUploadMainSection(e.target.value)}
                className="input !py-2 !text-sm"
                aria-label="Select main section"
              >
                <option value="">— none —</option>
                {tags.filter((t) => t.published !== false).map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
              Select Subsection <span className="text-red-500">*</span>
              <input
                list="gallery-subsection-options"
                className="input !py-2 !text-sm"
                value={uploadEventName}
                onChange={(e) => setUploadEventName(e.target.value)}
                placeholder="Pick an existing one or type a new name"
                aria-label="Select subsection"
              />
              <datalist id="gallery-subsection-options">
                {subsectionOptions.map((name) => <option key={name} value={name} />)}
              </datalist>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
              Image title <span className="font-normal text-charcoal/40">(optional)</span>
              <input className="input !py-2 !text-sm" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Shown as the caption" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
              Description <span className="font-normal text-charcoal/40">(optional)</span>
              <input className="input !py-2 !text-sm" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Short description for these images" />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 text-xs font-semibold text-charcoal/60">
            Additional tags <span className="font-normal text-charcoal/40">(optional — applied to every image in this upload)</span>
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const active = uploadTags.includes(t.name) || uploadMainSection === t.name;
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => toggleUploadTag(t.name)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active ? "border-primary bg-primary text-white" : "border-primary/25 bg-white text-primary hover:bg-primary/5"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="font-normal text-charcoal/45">No tags yet — add some in the Tags section below.</span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading > 0 || busy}
              className="btn-outline !px-5 !py-2.5 !text-sm disabled:opacity-60"
            >
              <ImagePlus size={16} /> Choose images
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) pickFiles(files); e.target.value = ""; }}
            />
            {uploadPreview.length > 0 && (
              <span className="text-sm text-charcoal/60">{uploadPreview.length} file{uploadPreview.length > 1 ? "s" : ""} ready</span>
            )}
          </div>

          {uploadPreview.length > 0 && (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {uploadPreview.map((p, i) => (
                  <div key={`${p.name}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-black/5 bg-white">
                    {p.video ? (
                      <span className="flex h-full w-full items-center justify-center bg-charcoal/5 text-xs font-semibold text-charcoal/50">VIDEO</span>
                    ) : (
                      <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-90 transition hover:bg-red-500"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={uploadFiles}
                  disabled={uploading > 0 || busy}
                  className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60"
                >
                  <Upload size={16} /> {uploading > 0 ? `Uploading ${uploading}…` : `Upload ${uploadPreview.length} file${uploadPreview.length > 1 ? "s" : ""}`}
                </button>
                <button onClick={clearPreview} disabled={uploading > 0} className="btn-outline !px-4 !py-2.5 !text-sm disabled:opacity-60">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subsections manager */}
      <div className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
            <Layers size={17} className="text-primary" /> Gallery Subsections
          </h3>
          <p className="text-xs text-charcoal/50">Each subsection is a heading under its year on the public gallery.</p>
        </div>
        {subsectionsByYear.length === 0 ? (
          <p className="text-sm text-charcoal/50">No images yet — upload some above to create subsections.</p>
        ) : (
          <div className="space-y-4">
            {subsectionsByYear.map(([year, subs, total]) => (
              <div key={year} className="rounded-2xl border border-gray-100 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-charcoal">{year}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{total} image{total === 1 ? "" : "s"}</span>
                </div>
                <div className="space-y-2">
                  {subs.map(([name, count]) => (
                    <div key={name} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-charcoal/[0.02] p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-charcoal">{name}</p>
                        <p className="text-xs text-charcoal/45">{count} image{count === 1 ? "" : "s"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => addImagesTo(year, name)} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white">
                          <Plus size={13} /> Add Images
                        </button>
                        <button onClick={() => manageImages(year, name)} className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-charcoal/70 transition hover:bg-primary hover:text-white">
                          <Eye size={13} /> Manage Images
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <button onClick={() => setSectionModal({ ...s, eventDescriptions: { ...(s.eventDescriptions || {}) }, showEmpty: !!s.showEmpty, published: s.published !== false })} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Edit section"><Pencil size={14} /></button>
                  <button onClick={() => setDeletingSection(s)} className="rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white" aria-label="Delete section"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tags manager */}
      <div className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
            <TagIcon size={17} className="text-primary" /> Gallery Tags
          </h3>
          <button onClick={() => setTagModal({ ...EMPTY_TAG })} className="btn-primary !px-4 !py-2 !text-sm">
            <Plus size={15} /> Add Tag
          </button>
        </div>
        <p className="mb-3 text-xs text-charcoal/50">
          These are the “Type” filters visitors see on the gallery page. Renaming a tag updates every image that uses it;
          deleting one only removes the tag — the images are kept.
        </p>
        {tags.length === 0 ? (
          <p className="text-sm text-charcoal/50">No tags yet — add one, then assign it to images here or while uploading.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((t, i) => (
              <div key={t._id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${t.published ? "border-gray-100 bg-white" : "border-dashed border-charcoal/20 bg-charcoal/[0.03] opacity-70"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><TagIcon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal">{t.name}</p>
                  <p className="truncate text-xs text-charcoal/45">
                    {t.count} image{t.count === 1 ? "" : "s"}
                    {t.blurb ? ` • ${t.blurb}` : ""}
                    {!t.published && " • hidden"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveTag(i, -1)} disabled={i === 0} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move up"><ChevronUp size={14} /></button>
                  <button onClick={() => moveTag(i, 1)} disabled={i === tags.length - 1} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move down"><ChevronDown size={14} /></button>
                  <button onClick={() => toggleTag(t)} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Show/hide tag">
                    {t.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setTagModal({ ...t })} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Edit tag"><Pencil size={14} /></button>
                  <button onClick={() => setDeletingTag(t)} className="rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white" aria-label="Delete tag"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!items ? (
        <PageLoader />
      ) : (
        <>
          {subsectionFilter && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-sm">
              <span className="text-charcoal/70">Showing <strong>{filter}</strong> › <strong>{subsectionFilter}</strong></span>
              <button onClick={() => setSubsectionFilter("")} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white">
                Clear filter
              </button>
            </div>
          )}
          {visible.length === 0 ? (
            <EmptyState text={subsectionFilter ? "No media in this subsection." : "No media in this section. Upload images or videos to get started."} />
          ) : (
            <div ref={gridRef} className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
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
        </>
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
                <Field label="Year / Section">
                  <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    {sections.length ? sections.map((s) => <option key={s._id} value={s.name}>{s.title || s.name}</option>) : <option>{editing.category}</option>}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Year label" hint="Shown as secondary info">
                    <input className="input" value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} placeholder="e.g. 2020" />
                  </Field>
                  <Field label="Subsection" hint="Heading this photo appears under (pick or type new)">
                    <input
                      list="gallery-subsection-options-edit"
                      className="input"
                      value={editing.eventName || ""}
                      onChange={(e) => setEditing({ ...editing, eventName: e.target.value })}
                      placeholder="e.g. Annual Cultural Fest"
                    />
                    <datalist id="gallery-subsection-options-edit">
                      {subsectionOptionsFor(editing.category).map((name) => <option key={name} value={name} />)}
                    </datalist>
                  </Field>
                </div>
                <Field label="Tags" hint="Shown as the “Type” filters on the gallery page.">
                  {tags.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => {
                        const active = (editing.tags || []).includes(t.name);
                        return (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => toggleEditTag(t.name)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              active ? "border-primary bg-primary text-white" : "border-primary/25 bg-white text-primary hover:bg-primary/5"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-charcoal/45">No tags yet — create them in the Gallery Tags section.</span>
                  )}
                </Field>
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

            <Field label="Cover image" hint="Optional thumbnail shown in the admin list and used as the section's cover.">
              <div className="flex items-center gap-3">
                {sectionModal.cover ? (
                  <ImgFallback src={sectionModal.cover} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" fallbackClassName="h-12 w-16 shrink-0 rounded-lg" />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-charcoal/40"><ImageIcon size={16} /></span>
                )}
                <button type="button" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="btn-outline !px-4 !py-2 !text-sm disabled:opacity-60">
                  <Upload size={14} /> {coverUploading ? "Uploading…" : sectionModal.cover ? "Replace cover" : "Upload cover"}
                </button>
                {sectionModal.cover ? (
                  <button type="button" onClick={() => setSectionModal({ ...sectionModal, cover: "" })} className="text-xs font-semibold text-red-500 hover:underline">
                    Remove
                  </button>
                ) : null}
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
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

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75">
                <Toggle checked={sectionModal.published} onChange={(published) => setSectionModal({ ...sectionModal, published })} label="Visible on site" /> Visible on site
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75" title="Show this section in the gallery filters even when it has no photos yet.">
                <Toggle checked={sectionModal.showEmpty} onChange={(showEmpty) => setSectionModal({ ...sectionModal, showEmpty })} label="Show when empty" /> Show when empty
              </label>
            </div>
            <p className="-mt-2 text-xs text-charcoal/45">
              “Show when empty” keeps this section visible in the public filters even with no photos, letting you set it up before uploading.
            </p>
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
      {/* Tag add/edit modal */}
      <Modal open={!!tagModal} onClose={() => setTagModal(null)} title={tagModal?._id ? "Edit tag" : "Add tag"}>
        {tagModal && (
          <div className="space-y-5">
            <Field label="Name *" hint="Shown as the filter chip on the public gallery page.">
              <input
                className="input"
                value={tagModal.name}
                onChange={(e) => setTagModal({ ...tagModal, name: e.target.value })}
                placeholder="e.g. Workshops"
                autoFocus
              />
            </Field>
            <Field label="Description" hint="Optional — shown when a visitor hovers the chip.">
              <textarea
                className="input resize-none"
                rows={2}
                value={tagModal.blurb || ""}
                onChange={(e) => setTagModal({ ...tagModal, blurb: e.target.value })}
                placeholder="Short description of this tag…"
              />
            </Field>
            <label className="flex items-center gap-2.5 text-sm font-medium text-charcoal/75">
              <Toggle checked={tagModal.published !== false} onChange={(published) => setTagModal({ ...tagModal, published })} label="Visible on site" /> Visible on site
            </label>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setTagModal(null)} className="btn-outline !px-5 !py-2.5 !text-sm"><X size={15} /> Cancel</button>
              <button onClick={saveTag} className="btn-primary !px-5 !py-2.5 !text-sm"><Save size={15} /> Save Tag</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingTag}
        onClose={() => { if (!busy) setDeletingTag(null); }}
        title={`Delete tag "${deletingTag?.name}"?`}
        text="The tag is removed from every image. The photos themselves are not deleted."
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.delete(`/admin/gallery/tags/${deletingTag._id}`);
            showToast("Tag deleted");
          } catch (err) {
            showToast(err.response?.data?.message || "Delete failed", "error");
          }
          setDeletingTag(null);
          setBusy(false);
          loadTags();
          load();
        }}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}
