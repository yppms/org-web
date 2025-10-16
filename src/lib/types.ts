// Type definitions for Kindy Student portal

export interface KindyStudent {
  id: string;
  name: string;
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

export interface StudentStats {
  outstanding: number;
  credit: number;
  saving: number;
  infaq: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface FullDayInfo {
  date: number;
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
