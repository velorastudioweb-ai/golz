import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown, Upload } from "lucide-react";
import api from "../api/client";
import SEO from "../components/SEO";
import PageLoader from "../components/PageLoader";
import { Modal, ConfirmDialog, Toast, Field, Toggle, ListEditor, UploadInput, EmptyState, SortableList } from "./AdminUI";
import { ICON_MAP, formatMoney } from "../utils/helpers";
import ServiceIcon from "../components/ServiceIcon";

const ICON_NAMES = ["Sparkles", "Flame", "Dumbbell", "HeartPulse", "Flower2", "Baby", "Medal", "Smile", "Heart", "Building2", "Pill", "Salad", "ShieldCheck", "Utensils", "Apple", "Activity", "Leaf", "Users", "Stethoscope"];

const CATEGORIES = [
  { id: "", label: "None" },
  { id: "metabolic", label: "1 · Metabolic & Lifestyle" },
  { id: "family", label: "2 · Women & Family" },
  { id: "specialised", label: "3 · Specialised & Clinical" },
  { id: "performance", label: "4 · Performance & Precision" },
];

const EMPTY = { title: "", icon: "Sparkles", image: "", category: "", shortDesc: "", description: "", forWho: "", benefits: [], planCovers: [], credibility: "", suitableFor: [], duration: "", price: null, featured: false, published: true };

export default function ServicesAdmin() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/admin/services").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const save = async (payload) => {
    setSaving(true);
    try {
      // Normalise image to string – some DB records store null/undefined.
      const safePayload = {
        ...payload,
        image: payload.image != null ? String(payload.image) : "",
      };
      if (isNew) {
        await api.post("/admin/services", safePayload);
        showToast("Service created");
      } else {
        await api.put(`/admin/services/${editing._id}`, safePayload);
        showToast("Service updated");
      }
      setEditing(null);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (item, field) => {
    await api.put(`/admin/services/${item._id}`, { [field]: !item[field] });
    load();
  };

  const reorder = async (next) => {
    setItems(next);
    await api.post("/admin/services/reorder", { ids: next.map((s) => s._id) });
    showToast("Order saved");
  };

  const move = async (i, dir) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    reorder(next);
  };

  const set = (key) => (e) => setEditing({ ...editing, [key]: e.target.value });

  return (
    <>
      <SEO title="Services" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-charcoal/55">Manage programs, pricing, order and visibility.</p>
        <button className="btn-primary !px-5 !py-2.5 !text-sm" onClick={() => { setEditing({ ...EMPTY }); setIsNew(true); }}>
          <Plus size={17} /> Add Service
        </button>
      </div>

      {!items ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState text="No services yet — click Add Service to create your first program." />
      ) : (
        <div className="space-y-3">
          <SortableList
            items={items}
            onReorder={reorder}
            getKey={(s) => s._id}
            renderItem={(s) => {
              return (
                <div className="flex items-center gap-4">
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button onClick={() => move(items.indexOf(s), -1)} disabled={items.indexOf(s) === 0} className="rounded p-0.5 text-charcoal/40 hover:text-primary disabled:opacity-20" aria-label="Move up"><ArrowUp size={13} /></button>
                    <button onClick={() => move(items.indexOf(s), 1)} disabled={items.indexOf(s) === items.length - 1} className="rounded p-0.5 text-charcoal/40 hover:text-primary disabled:opacity-20" aria-label="Move down"><ArrowDown size={13} /></button>
                  </div>
                  <img src={s.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ServiceIcon service={s} size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-semibold text-charcoal">{s.title}</p>
                    <p className="truncate text-xs text-charcoal/45">{s.shortDesc}</p>
                  </div>
                  {s.price != null && <span className="hidden rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold sm:block">{formatMoney(s.price)}</span>}
                  <span className="hidden items-center gap-2 sm:flex">
                    <button onClick={() => toggleField(s, "featured")} className={`rounded-lg p-2 transition ${s.featured ? "text-gold" : "text-charcoal/30 hover:text-gold"}`} title={s.featured ? "Unfeature" : "Feature"} aria-label="Toggle featured">
                      <Star size={17} className={s.featured ? "fill-gold" : ""} />
                    </button>
                    <button onClick={() => toggleField(s, "published")} className={`rounded-lg p-2 transition ${s.published ? "text-primary" : "text-charcoal/30 hover:text-primary"}`} title={s.published ? "Published — click to hide" : "Hidden — click to publish"} aria-label="Toggle publish">
                      {s.published ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                  </span>
                  <span className="flex items-center gap-1">
                    <button onClick={() => { setEditing(s); setIsNew(false); }} className="rounded-lg bg-primary/10 p-2.5 text-primary transition hover:bg-primary hover:text-white" title="Edit" aria-label={`Edit ${s.title}`}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleting(s)} className="rounded-lg bg-red-50 p-2.5 text-red-500 transition hover:bg-red-500 hover:text-white" title="Delete" aria-label={`Delete ${s.title}`}>
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Editor modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? "Add Service" : `Edit — ${editing?.title}`} wide>
        {editing && (
          <form onSubmit={(e) => { e.preventDefault(); save(editing); }} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Title *">
                <input className="input" value={editing.title} onChange={set("title")} required />
              </Field>
              <Field label="Section group">
                <select className="input" value={editing.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Icon">
              <div className="flex flex-wrap gap-1.5">
                {ICON_NAMES.map((name) => {
                  const I = ICON_MAP.get(name);
                  return (
                    <button key={name} type="button" onClick={() => setEditing({ ...editing, icon: name })}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${editing.icon === name ? "border-primary bg-primary text-white" : "border-gray-200 text-charcoal/50 hover:border-primary/40"}`}
                      title={name} aria-label={`Icon ${name}`}>
                      {I && <I size={16} />}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="For (who is this for)">
              <input className="input" placeholder="e.g. Prediabetes, Type 2 diabetes, or a family history of it." value={editing.forWho} onChange={set("forWho")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Short description">
                <textarea rows={3} className="input resize-none" value={editing.shortDesc} onChange={set("shortDesc")} />
              </Field>
              <Field label="Full description (supports HTML)">
                <textarea rows={6} className="input resize-none" value={editing.description} onChange={set("description")} />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Duration">
                <input className="input" placeholder="e.g. 3–6 months" value={editing.duration} onChange={set("duration")} />
              </Field>
              <Field label="Price (leave empty for on-request)">
                <input type="number" min="0" className="input" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Service image">
                <div className="relative">
                  <UploadInput value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} />
                  {editing.image && (
                    <button type="button"
                      onClick={() => setEditing({ ...editing, image: "" })}
                      className="absolute top-1 right-1 text-sm text-red-500 hover:text-red-700 opacity-0 transition opacity-100 group-hover:opacity-100">
                      ×
                    </button>
                  )}
                </div>
              </Field>
            </div>
            <Field label="What your plan covers">
              <ListEditor items={editing.planCovers} onChange={(planCovers) => setEditing({ ...editing, planCovers })} placeholder="e.g. Blood-sugar-friendly meal planning" />
            </Field>
            <Field label="Credibility line (optional)">
              <input className="input" placeholder="e.g. Advanced Nutrigenomics Expert, Genebox Academy." value={editing.credibility} onChange={set("credibility")} />
            </Field>
            <Field label="Key benefits (detail page)">
              <ListEditor items={editing.benefits} onChange={(benefits) => setEditing({ ...editing, benefits })} placeholder="e.g. Personalised meal plan" />
            </Field>
            <Field label="Who should choose this (detail page)">
              <ListEditor items={editing.suitableFor} onChange={(suitableFor) => setEditing({ ...editing, suitableFor })} placeholder="e.g. Type 2 diabetics" />
            </Field>
            <div className="flex flex-wrap items-center gap-8">
              <label className="flex items-center gap-3 text-sm font-medium text-charcoal/75">
                <Toggle checked={editing.published} onChange={(published) => setEditing({ ...editing, published })} label="Published" /> Published
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-charcoal/75">
                <Toggle checked={editing.featured} onChange={(featured) => setEditing({ ...editing, featured })} label="Featured" /> Featured
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <button type="button" onClick={() => setEditing(null)} className="btn-outline !px-5 !py-2.5 !text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary !px-6 !py-2.5 !text-sm disabled:opacity-60">
                {saving ? "Saving…" : isNew ? "Create Service" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete service?"
        text={`"${deleting?.title}" will be removed permanently from the website.`}
        onConfirm={async () => {
          await api.delete(`/admin/services/${deleting._id}`);
          setDeleting(null);
          load();
          showToast("Service deleted");
        }}
      />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}
