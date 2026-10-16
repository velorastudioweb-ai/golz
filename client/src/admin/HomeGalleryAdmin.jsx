import { useEffect, useState } from "react";
import { Award, Milestone, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import api from "../api/client";
import SEO from "../components/SEO";
import PageLoader from "../components/PageLoader";
import { Modal, ConfirmDialog, Toast, Field, EmptyState, UploadInput } from "./AdminUI";

const TABS = [
  { id: "award", label: "Awards / Recognitions", Icon: Award, hint: "Awards, honours, certificates and press recognition." },
  { id: "milestone", label: "Milestones", Icon: Milestone, hint: "Every other moment of the journey." },
];

const EMPTY_DRAFT = { image: "", thumb: "", caption: "", tab: "award" };

/**
 * The home page's "Our journey - Precious moments" gallery: two tabs of
 * images, each tile's image and caption maintained here so no code change is
 * ever needed to add a photo or rewrite its text. The bundled twelve photos
 * remain the home page's fallback until the first image is added.
 */
export default function HomeGalleryAdmin() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => api.get("/admin/home-gallery").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const showToast = (message) => { setToast({ message }); setTimeout(() => setToast(null), 3000); };

  const inTab = (tab) => (items || []).filter((i) => i.tab === tab);

  const add = async () => {
    if (!draft.image) return showToast("Choose an image first", "error");
    setSaving(true);
    try {
      await api.post("/admin/home-gallery", { ...draft, caption: draft.caption.trim() });
      setDraft({ ...EMPTY_DRAFT, tab: draft.tab });
      showToast("Image added to the homepage gallery");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Adding the image failed");
    } finally {
      setSaving(false);
    }
  };

  const move = async (tab, index, dir) => {
    const list = [...inTab(tab)];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    try {
      await api.put("/admin/home-gallery/reorder", { tab, ids: list.map((i) => i._id) });
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Reordering failed");
    }
  };

  const toggle = async (item, field) => {
    try {
      await api.put(`/admin/home-gallery/${item._id}`, { [field]: !item[field] });
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Update failed");
    }
  };

  const saveCaption = async () => {
    if (!editing) return;
    try {
      await api.put(`/admin/home-gallery/${editing._id}`, { caption: String(editing.caption || "").trim() });
      setEditing(null);
      showToast("Caption updated");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed");
    }
  };

  return (
    <>
      <SEO title="Homepage Gallery" />
      <div className="mb-6">
        <p className="text-sm text-charcoal/55">
          Images and captions shown under <strong>Awards / Recognitions</strong> and <strong>Milestones</strong> on the home page.
        </p>
      </div>

      {!items ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          {/* Add image */}
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
                <Plus size={17} className="text-primary" /> Add an image
              </h3>
              <p className="text-xs text-charcoal/50">Upload the photo, write its caption, pick the tab it belongs to.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <UploadInput
                value={draft.image}
                onChange={(url) => setDraft((d) => ({ ...d, image: url, thumb: url }))}
                label="Choose image"
                aspect="aspect-[4/3]"
              />
              <div className="flex flex-col gap-4">
                <Field label="Caption" hint="Shown as the image's text on the home page and in the lightbox.">
                  <input
                    className="input"
                    value={draft.caption}
                    onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                    placeholder="e.g. Karnataka Pride Award — 2023"
                  />
                </Field>
                <div className="flex flex-wrap items-end gap-4">
                  <Field label="Tab">
                    <select className="input" value={draft.tab} onChange={(e) => setDraft((d) => ({ ...d, tab: e.target.value }))}>
                      {TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </Field>
                  <button onClick={add} disabled={saving || !draft.image} className="btn-primary !px-5 !py-2.5 !text-sm disabled:opacity-60">
                    <Plus size={16} /> {saving ? "Adding…" : "Add to gallery"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {items.length === 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No managed images yet — the home page is showing the 12 bundled starter photos. Add your own above and everything you manage here replaces them on the site.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {TABS.map(({ id, label, Icon, hint }) => {
              const list = inTab(id);
              return (
                <div key={id} className="card p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 font-heading text-base font-bold text-charcoal">
                        <Icon size={17} className="text-primary" /> {label}
                      </h3>
                      <p className="mt-0.5 text-xs text-charcoal/50">{hint}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {list.length} image{list.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {list.length === 0 ? (
                    <EmptyState text={`No ${label} images yet.`} />
                  ) : (
                    <div className="space-y-2.5">
                      {list.map((item, i) => (
                        <div key={item._id} className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-charcoal/[0.02] p-2.5 ${!item.published ? "opacity-60" : ""}`}>
                          <img src={item.thumb || item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-charcoal">{item.caption || <span className="text-charcoal/40">No caption</span>}</p>
                            <p className="text-xs text-charcoal/45">{item.published ? "Live on home page" : "Hidden"}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => move(id, i, -1)} disabled={i === 0} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move up"><ChevronUp size={14} /></button>
                            <button onClick={() => move(id, i, 1)} disabled={i === list.length - 1} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white disabled:opacity-30" aria-label="Move down"><ChevronDown size={14} /></button>
                            <button onClick={() => toggle(item, "published")} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" title="Show/hide" aria-label="Toggle publish">
                              {item.published ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button onClick={() => setEditing({ ...item })} className="rounded-lg bg-gray-100 p-1.5 text-charcoal/60 transition hover:bg-primary hover:text-white" aria-label="Edit caption"><Pencil size={14} /></button>
                            <button onClick={() => setDeleting(item)} className="rounded-lg bg-red-50 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white" aria-label="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit caption">
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); saveCaption(); }} className="space-y-5">
            <img src={editing.thumb || editing.image} alt="" className="h-40 w-full rounded-xl object-cover" />
            <Field label="Caption" hint="Shown as the image's text on the home page and in the lightbox.">
              <input className="input" value={editing.caption || ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} autoFocus />
            </Field>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline !px-5 !py-2.5 !text-sm">Cancel</button>
              <button type="submit" className="btn-primary !px-6 !py-2.5 !text-sm">Save</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete homepage image?"
        text="This image will be removed from the home page gallery."
        onConfirm={async () => {
          await api.delete(`/admin/home-gallery/${deleting._id}`);
          setDeleting(null);
          load();
          showToast("Image deleted");
        }}
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} />
    </>
  );
}
