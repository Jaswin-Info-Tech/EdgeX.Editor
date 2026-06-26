import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, FilePlus, Package, Plus, RefreshCw, Search, Upload, X } from "lucide-react";
import type { CtxMenu, LibraryItem, PlanMeta, Plugin } from "../../types/editor";
import { TYPE_LABEL, TYPE_STRIPE } from "../../constants/editor";
import { TypeIcon } from "./atoms";

function Field({ label, value, onChange, placeholder, textarea }: any) {
  const cls = "w-full bg-background border border-border px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";
  return (
    <div>
      <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-widest">{label}</label>
      {textarea
        ? <textarea className={`${cls} h-16 resize-none`} value={value} onChange={onChange} placeholder={placeholder} />
        : <input className={cls} value={value} onChange={onChange} placeholder={placeholder} />}
    </div>
  );
}

export function NewPlanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: PlanMeta) => void }) {
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<PlanMeta>({ name: "Untitled Test Plan", description: "", author: "", version: "1.0.0", dutName: "", dutSerial: "", dutModel: "", dutFirmware: "" });
  const upd = (k: keyof PlanMeta) => (e: any) => setMeta(m => ({ ...m, [k]: e.target.value }));
  const STEPS = ["Plan Details", "DUT Configuration", "Review"];

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[540px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FilePlus size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">New Test Plan</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex border-b border-border">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 py-2 text-center text-[11px] font-mono font-semibold uppercase tracking-wider border-b-2 transition-colors
              ${i === step ? "border-primary text-primary" : i < step ? "border-emerald-500 text-emerald-500" : "border-transparent text-muted-foreground"}`}>
              <span className="mr-1">{i < step ? "✓" : i + 1}.</span>{s}
            </div>
          ))}
        </div>
        <div className="px-5 py-5 space-y-4">
          {step === 0 && <>
            <Field label="Plan Name *" value={meta.name} onChange={upd("name")} placeholder="e.g. RF Board Validation v3" />
            <Field label="Description" value={meta.description} onChange={upd("description")} placeholder="What does this plan verify?" textarea />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author" value={meta.author} onChange={upd("author")} placeholder="Engineer name" />
              <Field label="Version" value={meta.version} onChange={upd("version")} placeholder="1.0.0" />
            </div>
          </>}
          {step === 1 && <>
            <div className="text-[12px] text-muted-foreground font-mono mb-2">Configure the Device Under Test for traceability.</div>
            <Field label="DUT Name" value={meta.dutName} onChange={upd("dutName")} placeholder="e.g. RF Transceiver Module" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serial Number" value={meta.dutSerial} onChange={upd("dutSerial")} placeholder="SN-001234" />
              <Field label="Model" value={meta.dutModel} onChange={upd("dutModel")} placeholder="TRX-4820" />
            </div>
            <Field label="Firmware Version" value={meta.dutFirmware} onChange={upd("dutFirmware")} placeholder="v2.3.1" />
          </>}
          {step === 2 && (
            <div className="space-y-0">
              {[["Plan Name", meta.name], ["Author", meta.author || "—"], ["Version", meta.version],
                ["DUT Name", meta.dutName || "—"], ["DUT Serial", meta.dutSerial || "—"], ["DUT Model", meta.dutModel || "—"]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-[12px] font-mono text-muted-foreground">{k}</span>
                  <span className="text-[12px] font-mono text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center px-5 py-3 border-t border-border bg-muted/20">
          <button onClick={onClose} className="text-[12px] text-muted-foreground hover:text-foreground font-mono">Cancel</button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-3 h-8 border border-border text-[12px] font-mono text-foreground hover:bg-secondary">
                <ChevronLeft size={12} /> Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !meta.name.trim()}
                className="flex items-center gap-1 px-4 h-8 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-40">
                Next <ChevronRight size={12} />
              </button>
            ) : (
              <button onClick={() => onCreate(meta)} className="flex items-center gap-1 px-4 h-8 bg-emerald-600 text-white text-[12px] font-mono font-semibold hover:bg-emerald-600/90">
                <Check size={12} /> Create Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Step Modal ───────────────────────────────────────────────────────────

export function AddStepModal({ library, onAdd, onClose }: { library: LibraryItem[]; onAdd: (i: LibraryItem) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(library.map(l => l.category))];
  const filtered = library.filter(l =>
    (cat === "All" || l.category === cat) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[620px] h-[480px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2"><Plus size={15} className="text-primary" /><span className="text-[13px] font-semibold text-foreground">Add Test Step</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 border-r border-border overflow-y-auto shrink-0">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`w-full text-left px-3 py-2 text-[12px] font-mono transition-colors border-l-2
                  ${cat === c ? "text-primary border-primary bg-primary/8" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 border border-border px-2 py-1.5 bg-background">
                <Search size={12} className="text-muted-foreground shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search steps..."
                  className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && <div className="py-8 text-center text-[12px] text-muted-foreground font-mono">No matching steps</div>}
              {filtered.map(item => (
                <button key={item.id} onClick={() => { onAdd(item); onClose(); }}
                  className="w-full text-left px-4 py-3 hover:bg-secondary group transition-colors border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[3px] h-5 shrink-0" style={{ background: TYPE_STRIPE[item.type] || "#64748b" }} />
                    <TypeIcon type={item.type} size={13} />
                    <span className="text-[13px] font-mono text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-1.5">
                      {TYPE_LABEL[item.type] || "—"}
                    </span>
                    {item.pluginId && <span className="text-[10px] font-mono text-primary border border-primary/30 px-1.5">plugin</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 pl-8">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
          {filtered.length} steps · double-click or click to add
        </div>
      </div>
    </div>
  );
}

// ─── Plugin Manager ───────────────────────────────────────────────────────────

export function PluginManager({ plugins, onInstall, onUpload, onClose }: {
  plugins: Plugin[]; onInstall: (id: string) => void; onUpload: (file: File) => Promise<void> | void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"installed" | "browse" | "upload">("installed");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const installed = plugins.filter(p => p.state === "installed");
  const available = plugins.filter(p => p.state === "available");

console.log(plugins,"llllqqq")

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError("");
    try {
      await onUpload(uploadFile);
      setUploadFile(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[660px] h-[520px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2"><Package size={15} className="text-primary" /><span className="text-[13px] font-semibold text-foreground">Plugin Manager</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex border-b border-border shrink-0">
          {(["installed", "browse", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 h-9 text-[12px] font-mono font-semibold uppercase tracking-wider border-b-2 transition-colors
                ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "installed" ? `Installed (${installed.length})` : t === "browse" ? `Available (${available.length})` : "Upload"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "installed" && (
            <div>
              {installed.length === 0 && <div className="py-12 text-center text-[12px] text-muted-foreground font-mono">No plugins installed</div>}
              {installed.map(p => (
                <div key={p.id} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                        <span className="text-[11px] font-mono text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-2">v{p.version}</span>
                        <span className="text-[11px] font-mono text-emerald-500">● installed</span>
                      </div>
                      {/* <div className="text-[12px] text-muted-foreground mb-1">{p.description}</div> */}
                      {/* <div className="text-[11px] text-muted-foreground/60 font-mono">by {p.author} · {p.steps.length} steps</div> */}
                    </div>
                    <button className="text-[11px] font-mono text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/30 px-2.5 py-1 transition-colors">Uninstall</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.steps ?? []).map(s => (
                      <span key={s.id} className="text-[11px] font-mono border border-border px-2 py-0.5 text-muted-foreground">{s.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "browse" && (
            <div>
              {available.map(p => (
                <div key={p.id} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">v{p.version}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{p.description}</div>
                      <div className="text-[11px] text-muted-foreground/60 font-mono">by {p.author} · {p.steps?.length ?? 0} steps</div>
                    </div>
                    <button onClick={() => onInstall(p.id)}
                      className="text-[11px] font-mono text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 px-3 py-1 flex items-center gap-1.5 transition-colors">
                      <Download size={11} /> Install
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.steps ?? []).map(s => <span key={s.id} className="text-[11px] font-mono border border-border px-2 py-0.5 text-muted-foreground">{s.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "upload" && (
            <div className="px-6 py-6 space-y-4">
              <div className="text-[12px] text-muted-foreground font-mono">Upload a  <span className="text-primary">zip</span> or <span className="text-primary">.tappackage</span> or <span className="text-primary">.dll</span> file to install a custom plugin.</div>
              <label className="block border-2 border-dashed border-border hover:border-primary/60 p-10 text-center cursor-pointer transition-colors group">
                <Upload size={28} className="mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <div className="text-[12px] font-mono text-muted-foreground">
                  {uploadFile ? <span className="text-primary">{uploadFile.name}</span> : <>Drop file or <span className="text-primary underline">browse</span></>}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-1">zip, .tappackage, .dll supported</div>
                <input type="file" className="hidden" accept=".zip,.tappackage,.dll" onChange={e => {
                  if (e.target.files?.[0]) {
                    setUploadFile(e.target.files[0]);
                    setUploadError("");
                  }
                }} />
              </label>
              {uploadError && <div className="text-[12px] text-red-500 font-mono">{uploadError}</div>}
              {uploadFile && (
                <button onClick={handleUpload} disabled={uploading}
                  className="w-full h-9 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {uploading ? <><RefreshCw size={12} className="animate-spin" /> Uploading...</> : <><Upload size={12} /> Upload Package</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

export function ContextMenu({ menu, onAction, onClose }: { menu: CtxMenu; onAction: (a: string, id: string) => void; onClose: () => void }) {
  const groups = [
    [{ label: "Add Step After", action: "add_after" }, { label: "Add Child Step", action: "add_child" }],
    [{ label: "Move Up", action: "move_up" }, { label: "Move Down", action: "move_down" }],
    [{ label: "Duplicate", action: "duplicate" }, { label: "Rename", action: "rename" }, { label: "Toggle Enable", action: "toggle" }, { label: "Toggle Breakpoint", action: "breakpoint" }],
    [{ label: "Delete", action: "delete", danger: true }],
  ];
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute bg-popover border border-border shadow-2xl w-48 py-1"
        style={{ left: Math.min(menu.x, window.innerWidth - 200), top: Math.min(menu.y, window.innerHeight - 260) }}
        onClick={e => e.stopPropagation()}>
        {groups.map((g, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-border my-1" />}
            {g.map(item => (
              <button key={item.action} onClick={() => { onAction(item.action, menu.stepId); onClose(); }}
                className={`w-full text-left px-4 py-1.5 text-[12px] font-mono transition-colors
                  ${"danger" in item && item.danger ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

