"use client";

interface BankRequiredModalProps {
  onAddBankInfo: () => void;
}

const closeDialog = () => {
  (document.getElementById("bank_required_modal") as HTMLDialogElement | null)?.close();
};

/**
 * Prompts the parent to add receiving-bank info before a withdrawal.
 * Opened via document.getElementById("bank_required_modal").showModal().
 */
export default function BankRequiredModal({ onAddBankInfo }: BankRequiredModalProps) {
  return (
    <dialog id="bank_required_modal" className="modal">
      <div className="modal-box w-full max-w-sm mx-2">
        <h3 className="font-bold text-lg text-center">
          Informasi rekening penerimaan dibutuhkan
        </h3>
        <div className="py-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-3">🏦</div>
            <p className="text-sm text-base-content/50 mb-3">
              Untuk menarik tabungan, mohon isi rekening penerimaan terlebih dahulu.
            </p>
            <p className="text-sm text-base-content/50">
              Dana yang ditarik akan dikirimkan ke rekening tersebut melalui transfer.
            </p>
          </div>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={closeDialog}>
            Keluar
          </button>
          <button className="btn btn-primary" onClick={onAddBankInfo}>
            Tambah rekening penerimaan
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>keluar</button>
      </form>
    </dialog>
  );
}
