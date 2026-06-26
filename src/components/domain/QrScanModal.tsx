import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, ScanLine } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

/**
 * Pull the verifiable value out of a scanned QR. Lattice Pass QRs encode a
 * deep link (`…#/redeem?token=<token>`); a customer might also show a plain
 * 6-digit backup code. Return whatever the verify pipeline can look up.
 */
export function extractPassCode(text: string): string {
  const trimmed = text.trim();
  const tokenMatch = trimmed.match(/[?&]token=([^&\s]+)/);
  if (tokenMatch) return decodeURIComponent(tokenMatch[1]);
  return trimmed;
}

function friendlyCameraError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError")
    return "Camera permission denied — allow access or enter the 6-digit code instead.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError")
    return "No camera found — enter the 6-digit code instead.";
  if (name === "NotReadableError" || name === "TrackStartError")
    return "Your camera is in use by another app — close it, or enter the 6-digit code instead.";
  return "Couldn't start the camera — enter the 6-digit code instead.";
}

function isRetryableConstraint(err: unknown): boolean {
  const name = (err as { name?: string })?.name ?? "";
  return name === "OverconstrainedError" || name === "NotFoundError" || name === "DevicesNotFoundError";
}

type Status = "requesting" | "scanning" | "error";

/**
 * Camera-based QR scanner for the business Redeem console. Requests webcam
 * permission, shows a live feed, and reports the decoded pass value back so the
 * existing verify flow can stage it for approval. Manual entry stays available
 * as a fallback, so a missing/denied camera is never a dead end.
 */
export function QrScanModal({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<Status>("requesting");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const reader = new BrowserQRCodeReader();
    setStatus("requesting");
    setErrorMsg("");

    const handleResult = (text: string, controls: IScannerControls) => {
      if (cancelled) return;
      controls.stop();
      controlsRef.current = null;
      onResult(extractPassCode(text));
      onClose();
    };

    const decode = (constraints: MediaStreamConstraints) => {
      const video = videoRef.current;
      if (!video) return Promise.reject(new Error("video element not ready"));
      return reader.decodeFromConstraints(constraints, video, (result, _err, controls) => {
        controlsRef.current = controls;
        if (result) handleResult(result.getText(), controls);
      });
    };

    (async () => {
      try {
        // Prefer the rear camera on phones; fall back to any camera on laptops.
        controlsRef.current = await decode({ video: { facingMode: "environment" } });
        if (!cancelled) setStatus("scanning");
      } catch (first) {
        if (isRetryableConstraint(first)) {
          try {
            controlsRef.current = await decode({ video: true });
            if (!cancelled) setStatus("scanning");
            return;
          } catch (second) {
            if (!cancelled) {
              setStatus("error");
              setErrorMsg(friendlyCameraError(second));
            }
            return;
          }
        }
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(friendlyCameraError(first));
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, attempt, onClose, onResult]);

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Scan Lattice Pass"
      description="Point the camera at the QR code on the customer's pass — it verifies automatically."
    >
      <div className="space-y-3">
        <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-[var(--tile-radius)] border border-[var(--tint-blue-border)] bg-[var(--tint-blue)]">
          <video
            ref={videoRef}
            className="size-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Scan frame overlay — shown while the feed is live. */}
          {status === "scanning" && (
            <>
              <div className="pointer-events-none absolute inset-7 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(20,40,80,0.28)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 text-[12px] font-medium text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur">
                  <ScanLine size={14} /> Point at the customer's Lattice Pass
                </span>
              </div>
            </>
          )}

          {status === "requesting" && (
            <div className="absolute inset-0 grid place-items-center bg-[var(--tint-blue)]">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="size-8 animate-spin rounded-full border-[3px] border-[var(--tint-blue-border)] border-t-primary" />
                <p className="text-[13px] font-medium">Requesting camera access…</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 grid place-items-center bg-[var(--tint-blue)] p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-card text-primary shadow-[var(--shadow-soft)]">
                  <Camera size={20} />
                </span>
                <p className="text-[13px] font-medium text-foreground">{errorMsg}</p>
                <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[12px] text-muted-foreground">
          No camera? Close this and type the 6-digit backup code instead.
        </p>
      </div>
    </Modal>
  );
}
