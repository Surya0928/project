import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import Loading_Comp from '../Loading';
import CustomerInfo from './Manager_Customer_Info';
import CreateComment from './Manager_Create_Comment';

interface Accountant {
  id: number;
  username: string;
}

interface SalesPerson {
  id:number;
  name: string;
}

interface Invoice {
    id: number,
    customer_name : string,
    date: string,
    ref_no: string,
    pending: number,
    due_on: string,
    days_passed: number,
    paid: boolean,
    paid_date: string | null,
    sales_person: number,
  }

  interface Comments {
    id: number,
    invoice: string,
    date: string,
    invoice_list: string,
    remarks: string,
    amount_promised: number,
    follow_up_date: string,
    promised_date: string,
    sales_person: number,
    comment_status: boolean,
    follow_up_time: string
  }

interface InvoiceInfoProps {
  customer_name: string;
  invoice_name: string;
  ar_accountant: number;
  accountants: Accountant[];
  sales_data: SalesPerson[];
  onClose: () => void;
}

// Function to format numbers according to the Indian numbering system with 0 decimal places
const formatNumberToINR = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });
};

const InvoiceInfo: React.FC<InvoiceInfoProps> = ({ customer_name, invoice_name,ar_accountant, accountants, sales_data, onClose }) => {
  const [show_add_comment_popup, set_show_add_comment_popup] = useState<boolean>(false)
  const [selected_invoice, set_selected_invoice] = useState<Invoice>({
    id: 0,customer_name: '',date: '',ref_no: '',pending: 0,days_passed: 0,due_on :'', paid:false, paid_date:'', sales_person: 0
    })
  const accountantName = accountants.find(accountant => accountant.id === ar_accountant)?.username || 'Unknown';
  const [loading, setloading] = useState<boolean>(false)
  const [comment_data, set_comment_data] = useState<Comments[] | null>(null)
  const [show_customer_popup, set_show_customer_popup] = useState<boolean>(false)

  const fetchInvoiceData = async () => {
    setloading(true)
    try {
      const response = await fetch('http://159.89.160.186:8000/get_invoice/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: ar_accountant,
          customer: customer_name,
          invoice: invoice_name
        }),
      });

      if (response.ok) {
          const data = await response.json();
          set_selected_invoice(data['Invoice'])
          set_comment_data(data['Invoice']['comments'])
          setloading(false)
      }
      // Handle the data as needed
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [ar_accountant, selected_invoice.customer_name]);


  return (
    <div className='relative flex w-full h-full'>
      {show_customer_popup || show_add_comment_popup ? (
        <div className='w-full h-full'>
          {show_customer_popup && (
            <div className='w-full h-full py-2'>{show_customer_popup && (<CustomerInfo customer_name={customer_name} ar_accountant={ar_accountant} accountants={accountants} sales_data={sales_data} onClose={() => {set_show_customer_popup(false)}}/>)}</div>
          )}
          {show_add_comment_popup && (
            <div className='w-full h-full'>{selected_invoice && (<CreateComment customer_name={customer_name} invoices={[selected_invoice]} ar_accountant={ar_accountant} sales_data={sales_data} accountants={accountants} onClose={()=>(set_show_add_comment_popup(false), fetchInvoiceData())} />)}</div>
          )}
        </div>
        ) : (
        <div className="flex flex-col w-full h-full bg-white shadow-md rounded-lg">
          <div className="flex flex-col w-full space-y-4 bg-white px-6 pt-6">
              <div className="relative flex items-center justify-center w-full mb-4">
                  <FontAwesomeIcon
                  icon={faArrowLeft}
                  className="absolute left-0 w-7 h-7 cursor-pointer text-gray-600 hover:text-gray-800"
                  onClick={onClose}
                  />
              </div>
              <div className='flex w-full items-center justify-between px-4'>
                  <div className='flex items-center justify-center space-x-3'>
                      <div className='container flex w-20 h-20 rounded-full items-center justify-center bg-gray-200'>
                          <FontAwesomeIcon icon={faUser}  className='w-12 h-12 text-white'/>
                      </div>
                      <div className="text-4xl">{selected_invoice.ref_no}</div>
                  </div>
                  <div className='font-medium text-2xl text-gray-700'>A/R Accountant : {accountantName}</div>
              </div>
          </div>
          <div className='flex flex-col w-full h-full  pt-5 '>
            <div className='flex flex-col space-y-3 w-full h-full overflow-y-auto no-scrollbar py-4 px-10 bg-gray-100'>
                <div className='flex justify-between space-x-2 w-full h-full'>
                    <div className='flex flex-col space-y-5 rounded-lg w-1/3 h-full bg-white p-5 italic'>
                        <div className='flex w-full justify-between items-center'>
                            <div className='text-2xl tracking-wider font-semibold'>Invoice Details</div>
                        </div>
                        <div className='flex flex-col space-y-1 cursor-pointer' onClick={()=>{set_show_customer_popup(true)}}>
                            <div className=''>Customer :</div>
                            <div className='font-light text-blue-500 underline pl-2'>{selected_invoice.customer_name}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Pending :</div>
                            <div className='font-light text-gray-500 pl-2'>{formatNumberToINR(selected_invoice.pending)}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Date :</div>
                            <div className='font-light text-gray-500 pl-2'>{selected_invoice.date}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Due On :</div>
                            <div className='font-light text-gray-500 pl-2'>{selected_invoice.due_on}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Days Passes :</div>
                            <div className='font-light text-gray-500 pl-2'>{selected_invoice.days_passed} days</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Status :</div>
                            <div className='font-light text-gray-500 pl-2'>{selected_invoice.paid ? ('Paid') : ('Unpaid')}</div>
                        </div>
                        {selected_invoice.paid && (<div className='flex flex-col space-y-1'>
                            <div className=''>Paid Date :</div>
                            <div className='font-light text-gray-500 pl-2'>{selected_invoice.paid_date}</div>
                        </div>)}
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Sales Person :</div>
                            <div className='font-light text-gray-500 pl-2'>{sales_data.find((acc) => acc.id === selected_invoice.sales_person)?.name || '-'}</div>
                        </div>
                        
                    </div>
                    <div className='flex flex-col w-full rounded-xl space-y-4 bg-white p-2'>
                        <div className='flex w-full justify-between items-center'>
                            <div className='text-xl italic font-semibold'>Latest Comments</div>
                            <div className='text-blue-500 underline cursor-pointer' onClick={()=>(set_show_add_comment_popup(true))}>Add Comment</div>
                        </div>
                        {comment_data && comment_data.length > 0 && (
                            <div className='flex flex-col w-full h-auto overflow-y-auto'>
                                <table className="w-full h-auto italic text-left">
                                    <thead className="border-b">
                                    <tr>
                                        <th className=" p-2 border-r border-t border-gray-200">Date</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Selected Invocies</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Amount Promised</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Remarks</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Follow Up Date</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Promised Date</th>
                                        <th className=" p-2 border-r border-t border-gray-200">Completed</th>
                                        <th className=" p-2 border-t border-gray-200">Sales Person</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {comment_data?.map((comment) => (
                                        <tr key={comment.id} className="border-t">
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.date}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.invoice_list}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{formatNumberToINR(comment.amount_promised)}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.remarks}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.follow_up_date ? (comment.follow_up_date) : ('-')}{comment.follow_up_date && (`, ${comment.follow_up_time}`)}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.promised_date ? (comment.promised_date) : ('-')}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.comment_status ? 'Yes' : 'No'}</td>
                                            <td className=" p-2 border-t border-gray-200">{sales_data.find((acc) => acc.id === comment.sales_person)?.name || '-'}</td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table> 
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default InvoiceInfo;
