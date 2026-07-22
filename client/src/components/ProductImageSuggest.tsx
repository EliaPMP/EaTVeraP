/**
 * ProductImageSuggest
 * Shown in ProductResult when a product has no image.
 * Lets authenticated users submit an image suggestion for admin review.
 */
import { useState, useRef } from "react";
import { Camera, Upload, X, CheckCircle, Clock, ImagePlus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Props {
  barcode: string;
  productName?: string;
}

export default function ProductImageSuggest({ barcode, productName }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pendingData } = trpc.productImage.hasPendingSuggestion.useQuery(
    { barcode },
    { enabled: true }
  );

  const suggestMutation = trpc.productImage.suggestImage.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!preview) return;
    // Strip the data:image/...;base64, prefix
    const base64 = preview.split(",")[1];
    suggestMutation.mutate({ barcode, productName, imageBase64: base64, mimeType });
  };

  const handleClose = () => {
    setModalOpen(false);
    setPreview(null);
    setError(null);
    if (!submitted) setSubmitted(false);
  };

  // Already has pending suggestion
  if (pendingData?.hasPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10">
        <Clock size={14} className="text-amber-500 flex-shrink-0" />
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          Your image suggestion is under review
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Trigger button — shown in place of missing image */}
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed transition-all"
        style={{ borderColor: "rgba(11,61,46,0.25)", background: "rgba(11,61,46,0.04)" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(11,61,46,0.1)" }}
        >
          <ImagePlus size={22} style={{ color: "#0B3D2E" }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "#0B3D2E" }}>
            No image available
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tap to suggest one for this product
          </p>
        </div>
      </button>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={handleClose}
          />
          <div className="relative w-full max-w-lg bg-background rounded-t-3xl shadow-2xl p-5 pb-8 z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground text-base">Suggest a Product Image</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your image will be reviewed before it goes live
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              /* Success state */
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(11,61,46,0.1)" }}
                >
                  <CheckCircle size={32} style={{ color: "#0B3D2E" }} />
                </div>
                <h3 className="font-bold text-foreground text-base">Thank you!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your image suggestion has been submitted and is under review. We'll apply it once approved.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Upload flow */
              <div className="space-y-4">
                {/* Image picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {preview ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full object-contain rounded-2xl"
                      style={{ maxHeight: 240 }}
                    />
                    <button
                      onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed transition-all"
                    style={{ borderColor: "rgba(11,61,46,0.25)", background: "rgba(11,61,46,0.04)" }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(11,61,46,0.1)" }}
                    >
                      <Upload size={22} style={{ color: "#0B3D2E" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Choose a photo</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
                    </div>
                  </button>
                )}

                {/* Guidelines */}
                <div className="rounded-xl p-3 bg-muted">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Guidelines:</strong> Use a clear, well-lit photo of the product packaging. Avoid blurry or cropped images. Do not submit copyrighted images you don't own.
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm text-foreground border border-border ec-card"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!preview || suggestMutation.isPending}
                    className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white disabled:opacity-50 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #0B3D2E, #145A3A)" }}
                  >
                    {suggestMutation.isPending ? "Submitting…" : "Submit for Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
