/**
 * WeightHistoryPage — /track/weight
 * Full scrollable list of all weight log entries with inline edit and delete.
 * Authenticated users: data from DB via tRPC (getAllWeightLogs + editWeightLog + deleteWeightLog)
 * Guest users: data from localStorage via useWeightLog hook
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useWeightLog } from "@/hooks/useWeightLog";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Check, X, Scale } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (same as ProgressPage)
// ─────────────────────────────────────────────────────────────────────────────
function rowToKg(entry: { weightKg: number; weightRaw: string; unit: string }): number {
  const kgFromStored = entry.weightKg / 100;
  if (kgFromStored > 0) return kgFromStored;
  if (entry.unit === "kg") {
    const v = parseFloat(entry.weightRaw);
    if (!isNaN(v) && v > 0) return v;
  } else {
    const lbs = parseFloat(entry.weightRaw);
    if (!isNaN(lbs) && lbs > 0) return lbs * 0.453592;
  }
  return entry.weightKg;
}

function rowToDisplayValue(
  entry: { weightKg: number; weightRaw: string; unit: string },
  preferredUnit: "kg" | "lbs"
): number {
  if (entry.unit === preferredUnit) {
    const v = parseFloat(entry.weightRaw);
    if (!isNaN(v) && v > 0) return Math.round(v * 10) / 10;
  }
  const kg = rowToKg(entry);
  if (preferredUnit === "lbs") return Math.round(kg * 2.20462 * 10) / 10;
  return Math.round(kg * 10) / 10;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified display entry type (id is always string for key purposes)
// ─────────────────────────────────────────────────────────────────────────────
interface DisplayEntry {
  id: string;          // string for both DB (stringified number) and local (uuid)
  dbId?: number;       // present only for DB entries
  date: string;
  weightRaw: string;
  weightKg: number;
  unit: string;
  notes?: string | null;
  isLocal: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function WeightHistoryPage() {
  const { user } = useAuth();
  const { entries: localEntries, removeEntry: removeLocalEntry } = useWeightLog();

  // Preferred unit from localStorage
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(() => {
    try { return localStorage.getItem("eatvera-weight-unit") === "kg" ? "kg" : "lbs"; } catch { return "lbs"; }
  });

  // DB data
  const { data: dbEntriesRaw = [], isLoading, refetch } = trpc.fitness.getAllWeightLogs.useQuery(undefined, {
    enabled: !!user,
  });

  const editMutation = trpc.fitness.editWeightLog.useMutation({
    onSuccess: () => { refetch(); toast.success("Entry updated!"); setEditingId(null); },
    onError: () => toast.error("Failed to update entry."),
  });
  const deleteMutation = trpc.fitness.deleteWeightLog.useMutation({
    onSuccess: () => { refetch(); toast.success("Entry deleted."); },
    onError: () => toast.error("Failed to delete entry."),
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editUnit, setEditUnit] = useState<"kg" | "lbs">("lbs");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Build unified display entries
  const allEntries: DisplayEntry[] = useMemo(() => {
    if (user) {
      return (dbEntriesRaw as Array<{ id: number; date: string; weightRaw: string; weightKg: number; unit: string; notes?: string | null }>)
        .map(e => ({
          id: String(e.id),
          dbId: e.id,
          date: e.date,
          weightRaw: e.weightRaw,
          weightKg: e.weightKg,
          unit: e.unit,
          notes: e.notes,
          isLocal: false,
        }));
    }
    return localEntries.map(e => ({
      id: e.id,
      date: e.date,
      weightRaw: String(e.weightLbs),
      weightKg: Math.round(e.weightLbs * 0.453592 * 100),
      unit: "lbs",
      notes: null,
      isLocal: true,
    }));
  }, [user, dbEntriesRaw, localEntries]);

  // Grouping: by month
  const grouped = useMemo(() => {
    const map = new Map<string, DisplayEntry[]>();
    for (const e of allEntries) {
      const [y, m] = e.date.split("-");
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const [y, m] = key.split("-").map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return { key, label, items };
    });
  }, [allEntries]);

  const totalEntries = allEntries.length;

  function startEdit(entry: DisplayEntry) {
    setEditingId(entry.id);
    setEditUnit(entry.unit as "kg" | "lbs");
    setEditVal(entry.weightRaw);
    setEditDate(entry.date);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditVal("");
    setEditDate("");
  }

  function submitEdit(entry: DisplayEntry) {
    if (!entry.dbId) return;
    const v = parseFloat(editVal);
    const minVal = editUnit === "kg" ? 20 : 44;
    const maxVal = editUnit === "kg" ? 320 : 700;
    if (isNaN(v) || v < minVal || v > maxVal) {
      toast.error(`Enter a valid weight (${minVal}–${maxVal} ${editUnit}).`);
      return;
    }
    editMutation.mutate({ id: entry.dbId, date: editDate, weightRaw: editVal, unit: editUnit });
  }

  function handleDelete(entry: DisplayEntry) {
    if (!entry.isLocal && entry.dbId != null) {
      deleteMutation.mutate({ id: entry.dbId });
    } else {
      removeLocalEntry(entry.id);
      toast.success("Entry deleted.");
    }
    setConfirmDeleteId(null);
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(160deg, #0a1a0f 0%, #0d1f12 40%, #0a1510 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-12 pb-4 flex items-center gap-3"
        style={{ background: "rgba(10,26,15,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/track">
          <button className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ArrowLeft size={16} className="text-white" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
            Weight History
          </h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {totalEntries} {totalEntries === 1 ? "entry" : "entries"} total
          </p>
        </div>
        {/* Unit toggle */}
        <div className="flex gap-1.5">
          {(["lbs", "kg"] as const).map(u => (
            <button key={u} onClick={() => {
              setWeightUnit(u);
              try { localStorage.setItem("eatvera-weight-unit", u); } catch {}
            }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: weightUnit === u ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                color: weightUnit === u ? "#4ade80" : "rgba(255,255,255,0.35)",
                border: `1px solid ${weightUnit === u ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.1)"}`,
              }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Guest banner */}
        {!user && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <p style={{ fontSize: 12, color: "rgba(251,191,36,0.8)" }}>
              You're viewing local entries. Sign in to sync your weight history across devices.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && totalEntries === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Scale size={28} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white mb-1">No weight entries yet</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Start logging your weight on the Progress page</p>
            </div>
            <Link href="/track">
              <button className="px-5 py-2.5 rounded-full text-sm font-semibold"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
                Go to Progress
              </button>
            </Link>
          </div>
        )}

        {/* Grouped entries */}
        {!isLoading && grouped.map(({ key, label, items }) => (
          <div key={key} className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
              {label}
            </p>
            <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {items.map((entry, idx) => {
                const isEditing = editingId === entry.id;
                const isLast = idx === items.length - 1;
                const displayVal = rowToDisplayValue(entry, weightUnit);

                return (
                  <div key={entry.id}>
                    <div className="px-4 py-3.5">
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editDate}
                              onChange={e => setEditDate(e.target.value)}
                              className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              placeholder={editUnit === "kg" ? "70" : "155"}
                              className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                            />
                            {/* Unit toggle for edit */}
                            <div className="flex gap-1">
                              {(["lbs", "kg"] as const).map(u => (
                                <button key={u} onClick={() => {
                                  if (editVal && !isNaN(Number(editVal)) && Number(editVal) > 0) {
                                    const v = Number(editVal);
                                    if (u === "kg" && editUnit === "lbs") setEditVal((Math.round(v * 0.453592 * 10) / 10).toString());
                                    if (u === "lbs" && editUnit === "kg") setEditVal((Math.round(v * 2.20462 * 10) / 10).toString());
                                  }
                                  setEditUnit(u);
                                }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                                  style={{
                                    background: editUnit === u ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                                    color: editUnit === u ? "#4ade80" : "rgba(255,255,255,0.4)",
                                    border: `1px solid ${editUnit === u ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                                  }}>
                                  {u}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => submitEdit(entry)}
                              disabled={editMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>
                              <Check size={14} />
                              {editMutation.isPending ? "Saving…" : "Save"}
                            </button>
                            <button onClick={cancelEdit}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : confirmDeleteId === entry.id ? (
                        /* ── Delete confirm ── */
                        <div className="space-y-2">
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Delete this entry?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(entry)}
                              className="flex-1 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}>
                              Delete
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="flex-1 py-2 rounded-xl text-sm font-semibold"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal view ── */
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white" style={{ fontSize: 15 }}>
                              {displayVal}
                              <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.35)", marginLeft: 3 }}>{weightUnit}</span>
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                              {formatDate(entry.date)}
                            </p>
                            {entry.notes && (
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2, fontStyle: "italic" }}>
                                {entry.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {!entry.isLocal && (
                              <button onClick={() => startEdit(entry)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <Pencil size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                              </button>
                            )}
                            <button onClick={() => setConfirmDeleteId(entry.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                              <Trash2 size={13} style={{ color: "rgba(248,113,113,0.6)" }} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isLast && <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginLeft: 16, marginRight: 16 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
