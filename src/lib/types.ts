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
  insuranceNum: number | null;
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
  kindyStudentName: string;
  no: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnpaidInvoice {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  dueDate: string;
  status: 'issued' | 'paid' | 'partial' | 'overdue';
  paid: number;
  outstanding: number;
  isCustom: boolean;
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
  savingsAmount?: number;
  isAttached?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FullDayInfo {
  date: number;
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
  amount: string;
  date: string;
  reference: string;
  invoiceId?: string | null;
  isSaving?: boolean;
}

export interface OrgFinancialInfo {
  ent: string;
  num: string;
  name: string;
  img: string;
}

export interface InsuranceInfo {
  beneficiary: string;
  ent: string;
  type: string
  num: string;
  image: string;
  benefit: string[];
}
