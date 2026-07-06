"use client";

interface FullDayModalProps {
  isEnrolled: boolean;
  isSubmitting: boolean;
  success: string | null;
  error: string | null;
  onToggle: () => void;
  onClearError: () => void;
  onClose: () => void;
}

const closeDialog = () => {
  (document.getElementById("fullday_modal") as HTMLDialogElement | null)?.close();
};

/**
 * Full Day enrollment confirmation. Opened imperatively via
 * document.getElementById("fullday_modal").showModal() from the dashboard.
 */
export default function FullDayModal({
  isEnrolled,
  isSubmitting,
  success,
  error,
  onToggle,
  onClearError,
  onClose,
}: FullDayModalProps) {
  const handleClose = () => {
    closeDialog();
    onClose();
  };

  return (
    <dialog id="fullday_modal" className="modal">
      <div className="modal-box w-full max-w-sm mx-2">
        {success ? (
          <div className="text-center py-8">
            <h3 className="font-bold text-lg text-success mb-4">Sukses!</h3>
            <p className="text-base-content/70 mb-6">{success}</p>
            <button className="btn btn-success" onClick={handleClose}>
              Selesai
            </button>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <h3 className="font-bold text-lg text-error mb-4">Update gagal</h3>
            <p className="text-base-content/70 mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-outline" onClick={onClearError}>
                Ulangi lagi
              </button>
              <button className="btn" onClick={handleClose}>
                Keluar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg">
              {isEnrolled ? "Berhenti Full Day" : "Daftar Full Day"}
            </h3>
            <div className="py-4">
              <p className="text-base-content/70 mb-4">
                {isEnrolled
                  ? "Ananda dapat mengikuti kembali program full day kapan saja di bulan berikutnya"
                  : "Ananda akan mengikuti full day mulai bulan depan. Konfirmasi."}
              </p>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={handleClose} disabled={isSubmitting}>
                Keluar
              </button>
              <button
                className={`btn ${isEnrolled ? "btn-error" : "btn-primary"}`}
                onClick={onToggle}
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="loading loading-spinner loading-sm" />}
                {isEnrolled ? "Berhenti Full Day" : "Ya. Daftarkan"}
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>keluar</button>
      </form>
    </dialog>
  );
}
