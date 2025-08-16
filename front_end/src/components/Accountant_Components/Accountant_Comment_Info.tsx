import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import Loading_Comp from '../Loading';
import AccountantCustomerInfo from './Accountant_Customer_Info';
import AccountantInvoiceInfo from './Accountant_Invoice_Info';
import AccountantCreateComment from './Accountant_Create_Comment';
import { useAppContext } from '../../components/app_variables';

interface Comments {
  id: number,
  date: string,
  invoice_list: [],
  remarks: string,
  amount_promised: number,
  follow_up_date: string,
  promised_date: string,
  sales_person: string,
  comment_status: boolean,
  follow_up_time: string,
  customer_name: string
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

interface SalesPerson {
  id:number;
  name: string;
}

interface AccountantCommentInfoProps {
  comment_id: number;
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

const AccountantCommentInfo: React.FC<AccountantCommentInfoProps> = ({ comment_id, onClose }) => {
  const {id} = useAppContext()
  const [sales_data, set_sales_data] = useState<SalesPerson[]>([]);
  const [show_add_comment_popup, set_show_add_comment_popup] = useState<boolean>(false)
  const [comment_data, set_comment_data] = useState<Comments[] | null>(null)
  const [invoice_data, set_invoice_data] = useState<Invoice[]>([])
  const [show_customer_popup, set_show_customer_popup] = useState<boolean>(false)
  const [show_invoice_popup, set_show_invoice_popup] = useState<boolean>(false)
  const [selected_invoice, set_selected_invoice] = useState<string>('')
  const [loading, setloading] = useState<boolean>(false)
  const [comment, set_comment] = useState<Comments>({id : 0, date : "", invoice_list : [], remarks : "", amount_promised: 0,follow_up_date: "",promised_date: "",sales_person: "", comment_status : false, follow_up_time : "", customer_name : "", })
  const fetchCommentData = async () => {
    setloading(true)
    try {
      const response = await fetch('http://159.89.160.186/api/accountant_comment_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: id,
          id: comment_id,
        }),
      });

      if (response.ok) {
          const data = await response.json();
          set_invoice_data(data.comment_data['invoice_data'])
          set_comment(data.comment_data)
          set_comment_data(data.comment_data['comments'])
      }
      // Handle the data as needed
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  useEffect(() => {
    fetchCommentData();
  }, []);


  return (
    <div className='relative flex w-full h-full'>
      {show_customer_popup || show_add_comment_popup || show_invoice_popup ? (
        <div className='w-full h-full'>
          {show_customer_popup && (
            <div className='w-full h-full'>{show_customer_popup && (<AccountantCustomerInfo customer_name={comment.customer_name} sales_data={sales_data} onClose={() => {set_show_customer_popup(false)}}/>)}</div>
          )}
          {show_invoice_popup && (
            <div className='w-full h-full'>{show_invoice_popup && (<AccountantInvoiceInfo customer_name={comment.customer_name} invoice_name={selected_invoice} sales_data={sales_data} onClose={() => {set_show_invoice_popup(false)}}/>)}</div>
          )}
          {show_add_comment_popup && (
            <div className='w-full h-full'>{show_add_comment_popup && (<AccountantCreateComment customer_name={comment.customer_name} invoices={invoice_data} sales_data={sales_data} onClose={() => {set_show_add_comment_popup(false)}}/>)}</div>
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
                      <div className="text-4xl cursor-pointer hover:text-blue-400" onClick={()=>{set_show_customer_popup(true)}}>
                        {comment.customer_name}
                      </div>
                  </div>
              </div>
          </div>
          <div className='flex flex-col w-full h-full  pt-5 '>
            <div className='flex flex-col space-y-3 w-full h-full overflow-y-auto no-scrollbar py-4 px-10 bg-gray-100'>
                <div className='flex justify-between space-x-2 w-full h-full'>
                    <div className='flex flex-col space-y-5 rounded-lg w-1/3 h-full bg-white p-5 italic'>
                        <div className='flex w-full justify-between items-center'>
                            <div className='text-2xl tracking-wider font-semibold'>Record Details</div>
                        </div>
                        <div className='flex flex-col space-y-1' >
                            <div className=''>Invoices :</div>
                            <div className='flex w-full space-x-1 font-light text-gray-500 pl-2'>
                              {comment.invoice_list.map((inv: string, index: number) => (
                                <div key={index} className="text-gray-500 cursor-pointer hover:text-blue-500" onClick={()=>{set_selected_invoice(inv); set_show_invoice_popup(true)}} >
                                  {inv}{index < comment.invoice_list.length - 1 ? ',' : ''}
                                </div>
                              ))}
                            </div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Amount :</div>
                            <div className='font-light text-gray-500 pl-2'>{formatNumberToINR(comment.amount_promised)}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Created Date:</div>
                            <div className='font-light text-gray-500 pl-2'>{comment.date}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Follow Up Date :</div>
                            <div className='font-light text-gray-500 pl-2'>{comment.follow_up_date ? `${comment.follow_up_date}${comment.follow_up_time ? `, ${comment.follow_up_time}` : ''}` : '-'}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Promised Date :</div>
                            <div className='font-light text-gray-500 pl-2'>{comment.promised_date ? `${comment.promised_date}` : '-'}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Remarks :</div>
                            <div className='font-light text-gray-500 pl-2'>{comment.remarks}</div>
                        </div>
                        <div className='flex flex-col space-y-1'>
                            <div className=''>Sales Person :</div>
                            <div className='font-light text-gray-500 pl-2'>{comment.sales_person ? `${comment.sales_person}` : '-'}</div>
                        </div>
                        
                    </div>
                    <div className='flex flex-col w-full rounded-xl space-y-4 bg-white p-2'>
                        <div className='flex w-full justify-between items-center'>
                            <div className='text-xl italic font-semibold'>All Comments</div>
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
                                      </tr>
                                    </thead>
                                    <tbody>
                                    {comment_data?.map((comment) => (
                                        <tr key={comment.id} className="border-t">
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.date}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.invoice_list}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{formatNumberToINR(comment.amount_promised)}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.remarks}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.follow_up_date ? `${comment.follow_up_date}${comment.follow_up_time ? `, ${comment.follow_up_time}` : ''}` : '-'}</td>
                                            <td className=" p-2 border-r border-t border-gray-200">{comment.promised_date ? (comment.promised_date) : ('-')}</td>
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

export default AccountantCommentInfo;
