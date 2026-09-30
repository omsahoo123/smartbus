"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cancelBooking } from "@/services/bookings";
import { Download, Share2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export function TicketActions({
  bookingId,
  bookingCode,
  status,
}: {
  bookingId: string;
  bookingCode: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      await cancelBooking(supabase, bookingId);
      setCancelModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to cancel ticket.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    window.print();
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SmartBus Ticket #${bookingCode}`,
          text: `My SmartBus ticket booking code: ${bookingCode}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={handleDownload} className="flex items-center gap-1.5 text-xs">
          <Download className="h-4 w-4" />
          <span>Download / Print</span>
        </Button>

        <Button variant="secondary" onClick={handleShare} className="flex items-center gap-1.5 text-xs">
          <Share2 className="h-4 w-4" />
          <span>{copied ? "Copied Link!" : "Share Ticket"}</span>
        </Button>

        {status === "confirmed" && (
          <Button
            variant="danger"
            onClick={() => setCancelModalOpen(true)}
            className="text-xs"
          >
            Cancel Ticket
          </Button>
        )}
      </div>

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Ticket Cancellation"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-3 rounded-xl bg-danger/10 border border-danger/30 p-3.5 text-danger">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to cancel booking #{bookingCode}?</p>
              <p className="mt-1 text-muted text-[11px] leading-relaxed">
                Once cancelled, your seat reservation will immediately be released in the database and made available to other passengers.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-bg p-3.5 border border-line space-y-2">
            <p className="font-bold text-ink text-[11px] uppercase tracking-wider">Refund Policy Schedule</p>
            <ul className="space-y-1 text-muted text-[11px]">
              <li>• More than 24 hours prior to departure: <strong>90% refund</strong></li>
              <li>• Between 6 and 24 hours prior: <strong>50% refund</strong></li>
              <li>• Less than 6 hours prior: <strong>No refund</strong></li>
            </ul>
          </div>

          {error && <p className="text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)} disabled={loading}>
              Keep Ticket
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </span>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
