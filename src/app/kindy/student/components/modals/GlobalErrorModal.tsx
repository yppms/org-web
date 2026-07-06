"use client";

interface GlobalErrorModalProps {
  message: string | null;
  onClose: () => void;
}

/**
 * App-wide error modal for the student dashboard. Opened via
 * document.getElementById("global_error_modal").showModal().
 */
export default function GlobalErrorModal({ message, onClose }: GlobalErrorModalProps) {
  const handleClose = () => {
    (document.getElementById("global_error_modal") as HTMLDialogElement | null)?.close();
    onClose();
  };

  return (
    <dialog id="global_error_modal" className="modal">
      <div className="modal-box w-full max-w-sm mx-2">
        <div className="text-center py-8">
          <h3 className="text-md mb-4">Terjadi kesalahan</h3>
          <p className="text-md mb-4">
            <strong>{message}</strong>
          </p>
          <button className="btn btn-secondary" onClick={handleClose}>
            Mengerti
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>keluar</button>
      </form>
    </dialog>
  );
}
