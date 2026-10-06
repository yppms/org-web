// Type definitions for Kindy Student portal

export interface KindyStudent {
  id: string;
  name: string;
  nickname: string | null;
  phone: string | null;
  lang: 'EN' | 'ID';
  finEnt: string | null;
  finNum: string | null;
  finName: string | null;
  nisn: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  /** Calendar date at UTC midnight, e.g. `2020-02-16T00:00:00.000Z`. */
  birthDate: string | null;
  /** Short-lived SAS read URL for the profile photo; the blob path itself never leaves the API. */
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  KindyEnrollment: KindyEnrollment[];
  KindyStudentOneTimeFee: KindyStudentOneTimeFee[];
  KindyStudentRecurringFee: KindyStudentRecurringFee[];
}

export interface KindyEnrollment {
  id: string;
  kindyStudentName: string;
  kindyGroupId: string;
  KindyGroup: {
    id: string;
    name: string;
    kindyYearName: string;
  };
}

export interface KindyStudentOneTimeFee {
  id: string;
  discount: number;
  amount: number;
  kindyStudentName: string;
  kindyOneTimeFeeId: string;
  KindyOneTimeFee: {
    id: string;
    name: string;
    amount: number;
    startDate: string;
    dueDate: string;
    kindyYearName: string;
  };
}

export interface KindyStudentRecurringFee {
  id: string;
  discount: number;
  amount: number;
  kindyStudentName: string;
  kindyRecurringFeeId: string;
  KindyRecurringFee: {
    id: string;
    name: string;
    amount: number;
    startDate: number;
    dueDate: number;
    kindyYearName: string;
  };
}

export interface OutstandingInvoice {
  name: string;
  outstanding: number;
  dueDate: string;
  daysLate: number;
}

export interface AdmissionInfo {
  outstanding: number;
  discount: number;
  minimum: number;
}

export interface StudentStats {
  outstanding: number;
  totalInvoice: number;
  countInvoice: number;
  totalPayment: number;
  countPayment: number;
  saving: number;
  infaq: number;
  outstandingInvoice?: OutstandingInvoice[];
  admission?: AdmissionInfo;
}

export interface Saving {
  id: string;
  amount: number;
  type: 'SAVE' | 'WITHDRAW';
  reference: string | null;
  date: string;
  status: 'SUCCESS' | 'REQUEST' | 'FAIL';
  kindyStudentName: string;
  no: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  name: string;
  amountFull: number;
  discount: number;
  amount: number;
  startDate: string;
  dueDate: string;
  status: 'issued' | 'paid' | 'partial' | 'overdue';
  paid: number;
  outstanding: number;
  /**
   * Set on the bill a refund sits on (parents never see a refund as a row of
   * its own): what it comes to, with the breakdown of the school's share as
   * sanitized HTML. The bill's own figures stay its originals; `status` and
   * `paid` are the refund's — paid once the money has moved either way.
   */
  refund?: RefundBreakdown & { description: string | null };
  /** Another bill the same refund replaces — the name of the one it sits on. */
  refundedIn?: string;
  kindyStudentName: string;
  no: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * What a refund comes to: everything the parent paid (payouts excluded) minus
 * the school's share. `refundable` < 0 means the parent still owes that much.
 */
export interface RefundBreakdown {
  totalPaid: number;
  schoolShare: number;
  refundable: number;
  /** Already paid back to the parent. */
  transferred: number;
}

export interface UnpaidInvoice {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  dueDate: string;
  status: 'issued' | 'paid' | 'partial' | 'overdue' | 'refund';
  paid: number;
  /**
   * For a payout offer (`status: 'refund'`): what the school can still pay
   * out. A refund the parent still owes on is an ordinary row.
   */
  outstanding: number;
  isCustom: boolean;
  /** Listed only while something is left to pay out — see `outstanding`. */
  isRefund: boolean;
  daysLate: number;
  no: number;
  createdAt: string;
  updatedAt: string;
}

export interface Infaq {
  id: string;
  amount: number;
  reference: string | null;
  date: string;
  kindyStudentName: string;
  no: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  reference: string | null;
  date: string;
  kindyStudentName: string;
  no: number;
  invoiceId?: string | null;
  invoiceName?: string | null;
  appliedInvoices?: { invoiceId: string; invoiceName: string; amount: number }[];
  /**
   * Misnamed on the API: this is the part of the payment left over after the
   * server filled outstanding invoices, i.e. an overpayment ("Lebih bayar").
   * It is NOT savings — no code path turns it into a KindySaving row, and it
   * does not affect the savings balance, which is derived separately from
   * SUM(SAVE) − SUM(WITHDRAW). Computed per request, never stored.
   */
  savingsAmount?: number;
  isAttached?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Admin portal shared types (previously re-declared inline in each admin
// component, which caused drift — e.g. Payment defined three different ways).
// ---------------------------------------------------------------------------

/** A student as returned by the admin student list / used in admin dropdowns. */
export interface AdminStudent {
  id: string;
  name: string;
  no?: number;
}

/** A student's aggregate outstanding balance (admin outstanding section). */
export interface StudentOutstanding {
  id: string;
  name: string;
  totalInvoice: number;
  totalPayment: number;
  outstanding: number;
  invoiceCount: number;
  paymentCount: number;
  no: number;
  unpaidInvoiceCount?: number;
  unpaidInvoice?: { name: string; outstanding: number }[];
}

/**
 * Invoice as shown in the admin invoice list. Distinct from the student-facing
 * `Invoice` above (which carries status/paid/outstanding); the admin shape is
 * the raw billing record.
 */
export interface AdminInvoice {
  id: string;
  kindyStudentName: string;
  name: string;
  amountFull: number;
  discount: number;
  amount: number;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A student's bills for the refund form: what the ordinary FIFO fill has paid
 * on each (refunds ignored), and everything the student has paid, payouts
 * excluded.
 */
export interface StudentInvoices {
  invoices: {
    id: string;
    name: string;
    amount: number;
    paid: number;
    dueDate: string;
    /** Set when a refund already replaces this bill. */
    supersededById: string | null;
  }[];
  totalPaid: number;
}

/**
 * Form state for the admin invoice modal. amount/discount are strings because
 * they are bound to text inputs; the section parses them before calling the API.
 */
export interface InvoiceFormData {
  studentId: string;
  name: string;
  amount: string;
  discount: string;
  startDate: string;
  dueDate: string;
}

/**
 * A refund as listed in the admin Refund tab. It replaces its source bills
 * (tagihan asal) with the school's share; the figures come from the server's
 * settlement reading. At most one of toTransfer / owed is above zero.
 */
export interface AdminRefund extends RefundBreakdown {
  id: string;
  name: string;
  kindyStudentName: string;
  KindyStudent: { id: string; name: string };
  description: string | null;
  startDate: string;
  /** The planned transfer date. */
  dueDate: string;
  status: 'issued' | 'paid' | 'partial' | 'overdue';
  /** Still to pay back to the parent. */
  toTransfer: number;
  /** Still owed by the parent. */
  owed: number;
  sources: { id: string; name: string; amount: number; amountFull: number; discount: number }[];
  no: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment as shown in the admin payment list. Distinct from the student-facing
 * `Payment` above (which carries appliedInvoices/savingsAmount); the admin shape
 * carries a single attached invoiceId/invoiceName.
 */
export interface AdminPayment {
  id: string;
  kindyStudentName: string;
  amount: number;
  date: string;
  reference: string;
  invoiceId?: string;
  invoiceName?: string;
  createdAt: string;
  updatedAt: string;
}

/** Form payload for creating/editing a payment (admin payment modal). */
export interface PaymentFormData {
  studentId: string;
  /** Always entered positive; negated on submit when isPayout. */
  amount: string;
  date: string;
  reference: string;
  invoiceId?: string | null;
  isSaving?: boolean;
  /** The school paying a refund back to the parent (sent as a negative amount). */
  isPayout?: boolean;
}

export interface OrgFinancialInfo {
  ent: string;
  num: string;
  name: string;
  img: string;
}

/** Facilities the foundation provides to parents — served by `GET /org/facility`. */
export interface FacilityInfo {
  wifi: {
    ssid: string;
    pass: string;
  };
}

// ---------------------------------------------------------------------------
// Laporan Harian (daily report) — see docs/harian-design-handoff.md.
// The portal only ever receives `noteParent`; the teacher's raw internal `note`
// column never crosses the wire.
// ---------------------------------------------------------------------------

/** One photo or video on a report entry. Signed blob URLs — they expire. */
export interface HarianMedia {
  /** Blob path, e.g. "reports/xyz.jpg". Carries the file extension. */
  path: string;
  /** Short-lived SAS read URL for the full-size media. */
  url: string;
  /**
   * Signed URL for the 400px grid thumbnail (~20KB vs ~150KB) — a poster frame
   * for video. Absent on responses from before thumbnails existed.
   */
  thumbUrl?: string | null;
  /**
   * Signed URL for the browser-playable H.264 MP4 sibling of a clip. Null for
   * photos, and absent on responses from before transcoding existed.
   *
   * May 404 while a deferred re-encode is still running — the viewer falls
   * back to the original.
   */
  playUrl?: string | null;
}

/**
 * One observation. A report holds 1–2 of these, and the media often sits on
 * the second one rather than the first.
 */
export interface HarianEntry {
  /** The teacher-approved, parent-facing wording. The only text we get. */
  noteParent: string;
  /** Named `photos` by the backend, but it carries video too (.mp4 / .mov). */
  photos: HarianMedia[];
}

export interface HarianReport {
  id: string;
  type: 'CLASS_WIDE' | 'INDIVIDUAL';
  teacher: string | null;
  entries: HarianEntry[];
}

/** One day. `classReport` is the spine — an individual never exists without it. */
export interface HarianDay {
  /** `YYYY-MM-DD`. */
  date: string;
  /** Null when the register wasn't taken that day. */
  attendance?: 'PRESENT' | 'ABSENT' | 'LATE' | null;
  classReport: HarianReport | null;
  individualReport: HarianReport | null;
}

/** A row of the day index. Only days that have a report are listed. */
export interface HarianIndexEntry {
  /** `YYYY-MM-DD`. */
  date: string;
  /**
   * Null when the register wasn't taken. An `ABSENT` day is listed even with
   * no visible report, so the feed can distinguish "wasn't in" from "the
   * teacher wrote nothing" — the class report is withheld on those days.
   */
  attendance?: 'PRESENT' | 'ABSENT' | 'LATE' | null;
  hasClassReport: boolean;
  hasIndividual: boolean;
  mediaCount: number;
  videoCount: number;
}
