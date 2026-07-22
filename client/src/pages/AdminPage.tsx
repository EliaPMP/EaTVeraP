/**
 * EatVera Admin Dashboard — Pending Product Submissions
 *
 * Protected admin-only page for reviewing user-submitted products.
 * Features: approve/reject individual items, bulk actions, status filtering,
 * and inline ingredient/nutrition preview.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Package,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  RefreshCw,
  Filter,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface Submission {
  id: number;
  barcode: string;
  productName: string | null;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  ingredients: string[];
  nutritionFacts: Record<string, number>;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  submittedBy: number;
  createdAt: Date;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-[#DCF4DF] text-[#145A3A] border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={11} />,
    approved: <CheckCircle2 size={11} />,
    rejected: <XCircle size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || styles.pending}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SubmissionCard({
  submission,
  selected,
  onToggleSelect,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  submission: Submission;
  selected: boolean;
  onToggleSelect: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, notes?: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const isPending = submission.status === "pending";

  const nutritionEntries = Object.entries(submission.nutritionFacts).filter(
    ([, v]) => v !== null && v !== undefined
  );

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all ${
        selected ? "border-[#0B3D2E] bg-green-50/30" : "border-stone-200 bg-white"
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggleSelect}
            className="mt-0.5 text-stone-400 hover:text-[#0B3D2E] transition-colors flex-shrink-0"
          >
            {selected ? (
              <CheckSquare size={18} className="text-[#0B3D2E]" />
            ) : (
              <Square size={18} />
            )}
          </button>

          {/* Product Image */}
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {submission.imageUrl ? (
              <img
                src={submission.imageUrl}
                alt={submission.productName || "Product"}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Package size={20} className="text-stone-300" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <h3 className="font-semibold text-stone-800 text-sm leading-tight truncate">
                  {submission.productName || "Unnamed Product"}
                </h3>
                <p className="text-stone-400 text-xs truncate">
                  {submission.brand || "Unknown brand"} · #{submission.barcode}
                </p>
              </div>
              <StatusBadge status={submission.status} />
            </div>
            {submission.category && (
              <p className="text-xs text-stone-500 mb-1 truncate">{submission.category}</p>
            )}
            <p className="text-[10px] text-stone-400 font-mono">
              Submitted {new Date(submission.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-2 mt-3 ml-9">
            <Button
              size="sm"
              onClick={() => onApprove(submission.id)}
              disabled={isApproving || isRejecting}
              className="flex-1 bg-[#0B3D2E] hover:bg-[#145A3A] text-white text-xs h-8"
            >
              {isApproving ? <Loader2 size={12} className="animate-spin mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={isApproving || isRejecting}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs h-8"
            >
              <XCircle size={12} className="mr-1" />
              Reject
            </Button>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && isPending && (
          <div className="mt-2 ml-9 space-y-2">
            <Input
              placeholder="Reason for rejection (optional)"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onReject(submission.id, rejectNotes);
                  setShowRejectForm(false);
                }}
                disabled={isRejecting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-7"
              >
                {isRejecting ? <Loader2 size={11} className="animate-spin mr-1" /> : null}
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                className="text-xs h-7"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Rejection notes */}
        {submission.status === "rejected" && submission.notes && (
          <div className="mt-2 ml-9 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <p className="text-xs text-red-600"><span className="font-semibold">Reason:</span> {submission.notes}</p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-3 bg-stone-50/50">
          {/* Ingredients */}
          {submission.ingredients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-1">Ingredients</p>
              <p className="text-xs text-stone-600 leading-relaxed bg-white rounded-lg p-2 border border-stone-100">
                {submission.ingredients.join(", ")}
              </p>
            </div>
          )}

          {/* Nutrition Facts */}
          {nutritionEntries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-2">Nutrition Facts</p>
              <div className="grid grid-cols-3 gap-1.5">
                {nutritionEntries.map(([key, val]) => (
                  <div key={key} className="bg-white rounded-lg p-2 text-center border border-stone-100">
                    <p className="text-[10px] text-stone-400 capitalize">{key}</p>
                    <p className="text-xs font-bold text-stone-800">
                      {typeof val === "number" ? val.toFixed(1) : val}
                      {key === "calories" ? " kcal" : key === "sodium" ? " mg" : "g"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barcode */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-stone-400 font-mono">Barcode: <span className="text-stone-700 font-semibold">{submission.barcode}</span></p>
            <p className="text-xs text-stone-400 font-mono">User ID: <span className="text-stone-700">{submission.submittedBy}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRejectNotes, setBulkRejectNotes] = useState("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [backfillResult, setBackfillResult] = useState<{ updated: number; failed: number; remaining: number } | null>(null);
  const [isBackfillingAll, setIsBackfillingAll] = useState(false);
  const [backfillAllStats, setBackfillAllStats] = useState<{ totalUpdated: number; totalFailed: number; batches: number } | null>(null);

  const utils = trpc.useUtils();

  const { data: submissions = [], isLoading, refetch } = trpc.barcode.getPendingSubmissions.useQuery(
    { status: statusFilter === "all" ? "all" : statusFilter === "pending" ? "pending" : statusFilter === "approved" ? "approved" : "rejected" },
    { enabled: user?.role === "admin" }
  );

  const approveMutation = trpc.barcode.approveSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission approved and added to database");
      utils.barcode.getPendingSubmissions.invalidate();
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setApprovingId(null),
  });

  const rejectMutation = trpc.barcode.rejectSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission rejected");
      utils.barcode.getPendingSubmissions.invalidate();
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setRejectingId(null),
  });

  const bulkApproveMutation = trpc.barcode.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.approved} submission${data.approved !== 1 ? "s" : ""} approved`);
      setSelectedIds(new Set());
      utils.barcode.getPendingSubmissions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const backfillMutation = trpc.barcode.backfillMetadata.useMutation({
    onSuccess: (data) => {
      setBackfillResult({ updated: data.updated, failed: data.failed, remaining: data.remaining });
      // Only show toast for single-batch runs (not during Backfill All loop)
      if (!isBackfillingAll) {
        if (data.updated > 0) toast.success(`Backfilled ${data.updated} product${data.updated !== 1 ? "s" : ""}`);
        else toast.info("No rows needed backfilling");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // Backfill All: loop batches of 50 with 150ms delay until remaining === 0
  const handleBackfillAll = async () => {
    setIsBackfillingAll(true);
    setBackfillAllStats(null);
    let totalUpdated = 0;
    let totalFailed = 0;
    let batches = 0;
    try {
      while (true) {
        const result = await backfillMutation.mutateAsync({ limit: 50 });
        totalUpdated += result.updated;
        totalFailed += result.failed;
        batches += 1;
        setBackfillAllStats({ totalUpdated, totalFailed, batches });
        if (result.remaining === 0 || result.updated === 0) break;
        await new Promise(r => setTimeout(r, 150));
      }
      toast.success(`Backfill complete: ${totalUpdated} rows updated in ${batches} batch${batches !== 1 ? "es" : ""}`);
      // Refresh submissions list after backfill
      utils.barcode.getPendingSubmissions.invalidate();
    } catch {
      toast.error("Backfill All stopped due to an error");
    } finally {
      setIsBackfillingAll(false);
    }
  };

  const bulkRejectMutation = trpc.barcode.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.rejected} submission${data.rejected !== 1 ? "s" : ""} rejected`);
      setSelectedIds(new Set());
      setBulkRejectNotes("");
      utils.barcode.getPendingSubmissions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    let results = submissions as Submission[];
    // Server already filters by status; client-side filter handles search only
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.productName?.toLowerCase().includes(q) ||
          s.brand?.toLowerCase().includes(q) ||
          s.barcode.includes(q)
      );
    }
    return results;
  }, [submissions, statusFilter, searchQuery]);

  const pendingCount = (submissions as Submission[]).filter((s) => s.status === "pending").length;
  const selectedPending = filtered.filter((s) => selectedIds.has(s.id) && s.status === "pending");

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = filtered.filter((s) => s.status === "pending").map((s) => s.id);
    setSelectedIds(new Set(pendingIds));
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Auth guards
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ec-page-bg">
        <Loader2 size={32} className="animate-spin text-stone-300" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 ec-page-bg">
        <ShieldAlert size={40} className="text-red-300" />
        <p className="text-stone-800 font-bold text-lg">Admin Access Required</p>
        <p className="text-stone-500 text-sm text-center">This page is restricted to administrators only.</p>
      </div>
    );
  }

  // Pending images section
  const utils2 = trpc.useUtils();
  const { data: pendingImages = [], isLoading: imagesLoading, refetch: refetchImages } = trpc.productImage.getPendingImages.useQuery(
    { limit: 50 },
    { enabled: user?.role === "admin" }
  );
  const approveImageMutation = trpc.productImage.approveImage.useMutation({
    onSuccess: () => { toast.success("Image approved and applied to product"); utils2.productImage.getPendingImages.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const rejectImageMutation = trpc.productImage.rejectImage.useMutation({
    onSuccess: () => { toast.success("Image suggestion rejected"); utils2.productImage.getPendingImages.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [adminTab, setAdminTab] = useState<"submissions" | "images">("submissions");

  return (
    <div className="ec-page-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 ec-sticky-header px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-xl text-stone-800">Admin Dashboard</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {pendingCount} pending review{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Backfill Metadata Card */}
        <div className="mb-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-700">Backfill Product Metadata</p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Re-fetch Open Food Facts for cached rows missing allergens / serving size / NOVA score.
              </p>
              {backfillMutation.isPending && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Loader2 size={10} className="animate-spin text-[#0B3D2E]" />
                  <span className="text-[10px] font-mono text-[#145A3A]">Running — fetching up to 50 rows from Open Food Facts…</span>
                </div>
              )}
              {!backfillMutation.isPending && backfillResult && (
                <div className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono" style={{ color: backfillResult.updated > 0 ? "#145A3A" : "#78716c" }}>
                      ✓ {backfillResult.updated} updated
                    </span>
                    {backfillResult.failed > 0 && (
                      <span className="text-[10px] font-mono text-red-500">✗ {backfillResult.failed} failed</span>
                    )}
                    <span className="text-[10px] font-mono text-stone-400">{backfillResult.remaining} remaining</span>
                  </div>
                 {backfillResult?.remaining > 0 && (
                    <p className="text-[9px] text-stone-400 mt-0.5">Run again to process the next batch of {Math.min(50, backfillResult.remaining)}.</p>
                  )}
                  {backfillResult?.remaining === 0 && (
                    <p className="text-[9px] text-[#0B3D2E] mt-0.5">All cached rows are up to date.</p>
                  )}
              {isBackfillingAll && backfillAllStats && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Loader2 size={10} className="animate-spin text-[#0B3D2E]" />
                      <span className="text-[10px] font-mono text-[#145A3A]">
                        Batch {backfillAllStats.batches} · {backfillAllStats.totalUpdated} updated so far…
                      </span>
                    </div>
                  )}
                  {!isBackfillingAll && backfillAllStats && (
                    <div className="mt-1.5">
                      <span className="text-[10px] font-mono text-[#145A3A]">
                        ✓ All done: {backfillAllStats.totalUpdated} updated in {backfillAllStats.batches} batch{backfillAllStats.batches !== 1 ? "es" : ""}
                      </span>
                      {backfillAllStats.totalFailed > 0 && (
                        <span className="text-[10px] font-mono text-red-500 ml-2">✗ {backfillAllStats.totalFailed} failed</span>
                      )}
                    </div>
                  )}                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => backfillMutation.mutate({ limit: 50 })}
                disabled={backfillMutation.isPending || isBackfillingAll}
                className="text-xs"
              >
                {backfillMutation.isPending && !isBackfillingAll ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
                {backfillMutation.isPending && !isBackfillingAll ? "Running…" : "Run Batch"}
              </Button>
              <Button
                size="sm"
                onClick={handleBackfillAll}
                disabled={backfillMutation.isPending || isBackfillingAll || backfillResult?.remaining === 0}
                className="text-xs text-white"
                style={{
                  background: (isBackfillingAll || backfillResult?.remaining === 0)
                    ? "#78716c"
                    : "linear-gradient(135deg, #0B3D2E, #4ade80)"
                }}
              >
                {isBackfillingAll ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
                {isBackfillingAll ? "Running All…" : backfillResult?.remaining === 0 ? "All Done" : "Backfill All"}
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Filter size={14} className="absolute left-3 top-3 text-stone-400" />
          <Input
            placeholder="Search by name, brand, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        {/* Admin Section Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setAdminTab("submissions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              adminTab === "submissions" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Package size={12} /> Product Submissions
          </button>
          <button
            onClick={() => setAdminTab("images")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              adminTab === "images" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <ImagePlus size={12} /> Image Suggestions
            {pendingImages.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">{pendingImages.length}</span>
            )}
          </button>
        </div>

        {/* Status Filter Tabs (submissions only) */}
        {adminTab === "submissions" && <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((s) => {
            const count = s === "all"
              ? (submissions as Submission[]).length
              : (submissions as Submission[]).filter((x) => x.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>
        }
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-[148px] z-10 mx-4 mt-3 bg-stone-800 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-sm font-semibold flex-1">
            {selectedIds.size} selected ({selectedPending.length} pending)
          </span>
            {selectedPending.length > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => bulkApproveMutation.mutate({ submissionIds: selectedPending.map((s) => s.id) })}
                  disabled={bulkApproveMutation.isPending}
                  className="bg-green-500 hover:bg-[#0B3D2E] text-white text-xs h-7 px-3"
                >
                  {bulkApproveMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} className="mr-1" />}
                  Approve All
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const notes = bulkRejectNotes.trim() || undefined;
                    bulkRejectMutation.mutate({ submissionIds: selectedPending.map((s) => s.id), notes });
                  }}
                  disabled={bulkRejectMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs h-7 px-3"
                >
                  {bulkRejectMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} className="mr-1" />}
                  Reject All
                </Button>
              </>
            )}
            {/* Bulk reject notes input */}
            {selectedPending.length > 0 && (
              <Input
                placeholder="Reject reason (optional)"
                value={bulkRejectNotes}
                onChange={(e) => setBulkRejectNotes(e.target.value)}
                className="h-7 text-xs bg-stone-700 border-stone-600 text-white placeholder:text-stone-400 w-32"
              />
            )}
          <button onClick={clearSelection} className="text-stone-400 hover:text-white transition-colors">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Image Suggestions Panel */}
      {adminTab === "images" && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-500">{pendingImages.length} pending image{pendingImages.length !== 1 ? "s" : ""}</p>
            <button onClick={() => refetchImages()} className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
          {imagesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="animate-spin text-stone-300" />
              <p className="text-stone-400 text-sm">Loading…</p>
            </div>
          ) : pendingImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ImagePlus size={36} className="text-stone-200" />
              <p className="text-stone-500 font-semibold">No pending image suggestions</p>
              <p className="text-stone-400 text-xs text-center">Users can suggest images for products that have no photo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingImages.map((img) => (
                <div key={img.id} className="ec-card rounded-2xl overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={img.productName ?? img.barcode}
                    className="w-full object-contain bg-stone-50 dark:bg-stone-800"
                    style={{ maxHeight: 240 }}
                  />
                  <div className="p-4">
                    <p className="font-semibold text-foreground text-sm">{img.productName ?? "Unknown Product"}</p>
                    <p className="text-muted-foreground text-xs font-mono mt-0.5">Barcode: {img.barcode}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">
                      Submitted {new Date(img.submittedAt).toLocaleDateString()} · User #{img.userId}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approveImageMutation.mutate({ id: img.id })}
                        disabled={approveImageMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
                      >
                        {approveImageMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Approve & Apply
                      </button>
                      <button
                        onClick={() => rejectImageMutation.mutate({ id: img.id })}
                        disabled={rejectImageMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 transition-opacity disabled:opacity-50"
                      >
                        {rejectImageMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Submissions Content */}
      {adminTab === "submissions" && (<div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin text-stone-300" />
            <p className="text-stone-400 text-sm">Loading submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 size={36} className="text-stone-200" />
            <p className="text-stone-500 font-semibold">
              {statusFilter === "pending" ? "No pending submissions" : "No submissions found"}
            </p>
            <p className="text-stone-400 text-xs text-center">
              {statusFilter === "pending"
                ? "All user submissions have been reviewed."
                : "Try changing the filter or search query."}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            {statusFilter !== "rejected" && filtered.some((s) => s.status === "pending") && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-stone-500">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={selectedIds.size > 0 ? clearSelection : selectAllPending}
                  className="text-xs text-[#0B3D2E] font-semibold hover:underline"
                >
                  {selectedIds.size > 0 ? "Clear selection" : "Select all pending"}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {filtered.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  selected={selectedIds.has(submission.id)}
                  onToggleSelect={() => toggleSelect(submission.id)}
                  onApprove={(id) => {
                    setApprovingId(id);
                    approveMutation.mutate({ submissionId: id });
                  }}
                  onReject={(id, notes) => {
                    setRejectingId(id);
                    rejectMutation.mutate({ submissionId: id, notes });
                  }}
                  isApproving={approvingId === submission.id && approveMutation.isPending}
                  isRejecting={rejectingId === submission.id && rejectMutation.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>)}
    </div>
  );
}
