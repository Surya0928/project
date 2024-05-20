// src/models.ts
export interface CommentInfo {
  id: number;
  invoice: string;
  date: string;
  invoice_list: string;
  remarks: string;
  sales_follow_msg: string;
  sales_follow_response: string;
  sales_up_date: string;
  amount_promised: number;
}


export interface InvoiceDetail {
    id: number;
    invoice: number;
    date: string;
    ref_no: string;
    pending: number;
    due_on: string;
    days_passed: number;
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
    promised_amount: number;
    promised_date: string;
    sales_person: string;
  }
  