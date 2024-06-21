// src/models.ts
export interface CommentInfo {
  sales_person: string;
  id: number;
  invoice: string;
  date: string;
  invoice_list: string;
  remarks: string;
  follow_up_date: string;
  promised_date: string;
  amount_promised: number;
  paid: boolean;
  paid_date: string;
}

export interface SalesPerson {
  id: number;
  name: string;
  phone_number: string;
  address: string;
  email: string;
}

export interface InvoiceDetail {
  sales_person: number;
  id: number;
  invoice: {
    account: string;
    phone_number: string;
  };
  date: string;
  ref_no: string;
  pending: number;
  due_on: string;
  days_passed: number;
  paid: boolean;
  paid_date: string;
  sales_p: string
} 
  
export interface AccountInfo {
  id: number;
  account: string;
  name: string;
  phone_number: string;
  optimal_due: number;
  threshold_due: number;
  over_due: number;
  total_due: number;
  invoices: number;
  invoice_details: InvoiceDetail[];
  comments: CommentInfo[];
  names : Each_Account_Name_List[];
  promised_amount: number;
  promised_date: string;
  premium_user: boolean;
  credit_period: number;
}
  
export interface DataByDate {
  [date: string]: Data_by_Day[];
}

export interface Data_by_Day {
  id: number;
  account: string;
  name: string;
  phone_number: string;
  optimal_due: number;
  threshold_due: number;
  over_due: number;
  total_due: number;
  invoices: number;
  invoice_details: InvoiceDetail[];
  comments: CommentInfo[];
  names : Each_Account_Name_List[];
  promised_amount: number;
  promised_date: string;
  premium_user: boolean;
  invoice_list: string;
  follow_up_date: string;
  sales_person: string;
  credit_period: number;
}


export interface Paidinfo {
  id: number;
  account: string;
  name: string;
  phone_number: string;
  optimal_due: number;
  threshold_due: number;
  over_due: number;
  total_due: number;
  invoices: number;
  invoice_details: InvoiceDetail[];
  comments: CommentInfo[];
  names : Each_Account_Name_List[];
  promised_amount: number;
  promised_date: string;
  premium_user: boolean;
  amount_paid : string;
  number_of_invoices: number;
  last_payment_date : string;
}



export interface Each_Account_Name_List {
  id: number;
  invoice: string;
  name: string;
  phone_number : string;
}