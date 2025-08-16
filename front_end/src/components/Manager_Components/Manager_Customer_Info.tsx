import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import Loading_Comp from '../Loading';
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

interface NameAndNumber {
    id: number;
    name: string;
    phone_number: string;
  }
  
  interface Customer {
    id: number;
    customer_name: string;
    invoices: number;
    credit_period: number;
    over_due: number;
    total_balance: number;
    ar_accountant: number;
  }
interface CustomerInfoProps {
  customer_name: string;
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

const CustomerInfo: React.FC<CustomerInfoProps> = ({ customer_name,ar_accountant, accountants, sales_data, onClose }) => {
  // Find the accountant name by ID
  const [selected_customer, set_selected_customer] = useState<Customer>({
    id: 0,customer_name: '',invoices: 0,credit_period: 0,over_due: 0,total_balance: 0,ar_accountant: 0,
    })
  const accountantName = accountants.find(accountant => accountant.id === selected_customer.ar_accountant)?.username || 'Unknown';
  const [selected_tab, set_selected_tab] = useState<string>('Account')
  const [isEditingCreditPeriod, setIsEditingCreditPeriod] = useState<boolean>(false);
  const [newCreditPeriod, setNewCreditPeriod] = useState<string>(selected_customer.credit_period.toString()); // Store as string to handle empty input
  const [isAddingName, setIsAddingName] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');
  const [names_and_numbers, set_names_and_numbers] = useState<NameAndNumber[]>([])
  const [loading, setloading] = useState<boolean>(false)
  const [invoice_data, set_invoice_data] = useState<Invoice[] | null>(null)
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [comment_data, set_comment_data] = useState<Comments[] | null>(null)
  const [show_add_comment_popup, set_show_add_comment_popup] = useState<boolean>(false)
  const fetchCustomerData = async () => {
    setloading(true)
    try {
      const response = await fetch('http://159.89.160.186/get_customer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: ar_accountant,
          customer: customer_name,
        }),
      });

      if (response.ok) {
          const data = await response.json();
          set_names_and_numbers(data['Customer']['names'])
          set_invoice_data(data['Customer']['invoice_details'])
          set_comment_data(data['Customer']['comments'])
          set_selected_customer(data['Customer'])
          setloading(false)
      }
      // Handle the data as needed
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [selected_customer.ar_accountant, selected_customer.customer_name]);

  const handleSaveCreditPeriod = async () => {
    try {
      const response = await fetch('http://159.89.160.186/customer_credit_period/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selected_customer.id,
          new_credit_period: newCreditPeriod,
        }),
      });

      if (response.ok) {
        setIsEditingCreditPeriod(false);
        fetchCustomerData()
      }
    } catch (error) {
      console.error('Error saving credit period:', error);
    }
  };


  const handleAddName = async () => {
    try {
      const response = await fetch('http://159.89.160.186/customer_name_number/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selected_customer.id,
          user: selected_customer.ar_accountant,
          name: newName,
          phone_number: newPhoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add name and number');
      }

      setIsAddingName(false);
      setNewName('');
      setNewPhoneNumber('');
      fetchCustomerData()
    } catch (error) {
      console.error('Error adding name and number:', error);
    }
  };

  return (
    <div className='relative flex w-full h-full'>
      {show_add_comment_popup ? (
        <div className='w-full h-full'>{invoice_data && (<CreateComment customer_name={customer_name} invoices={invoice_data} ar_accountant={ar_accountant} sales_data={sales_data} accountants={accountants} onClose={()=>(set_show_add_comment_popup(false), fetchCustomerData())} />)}</div>
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
                      <div className="text-4xl">{selected_customer.customer_name}</div>
                  </div>
                  <div className='font-medium text-2xl text-gray-700'>A/R Accountant : {accountantName}</div>
              </div>
          </div>
          <div className='flex flex-col w-full h-full  pt-5 '>
              <div className='flex w-full h-auto px-10 items-center justify-between'>
                <div className='flex space-x-4 font-light tracking-wide text-gray-400'>
                    <div className={`px-1 cursor-pointer ${selected_tab === 'Account' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Account')}>Account</div>
                    <div className={`px-1 cursor-pointer ${selected_tab === 'Invoices' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Invoices')}>Invoices</div>
                    <div className={`px-1 cursor-pointer ${selected_tab === 'Comments' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Comments')}>Comments</div>
                </div>
                <div className='text-blue-500 underline cursor-pointer' onClick={()=>(set_show_add_comment_popup(true))}>Add Comment</div>
              </div>
              {selected_tab === 'Account' && (
                <div className='flex flex-col space-y-3 w-full h-full overflow-y-auto no-scrollbar py-4 px-10 bg-gray-100'>
                  <div className='flex justify-between w-full h-full'>
                      <div className='flex flex-col space-y-5 rounded-lg w-1/3 h-full bg-white p-5 italic'>
                          <div className='flex w-full justify-between items-center'>
                              <div className='text-2xl tracking-wider font-semibold'>Customer Details</div>
                              {isEditingCreditPeriod ? (
                                  <div className='flex space-x-2'>
                                      <div className='text-red-500 underline cursor-pointer' onClick={()=>setIsEditingCreditPeriod(false)}>Cancel</div>
                                      <div className='text-green-500 underline cursor-pointer' onClick={()=>handleSaveCreditPeriod()}>Save</div>
                                  </div>
                              ):(
                                  <div className='text-blue-500 underline cursor-pointer' onClick={()=>setIsEditingCreditPeriod(true)}>Edit</div>
                              )}
                              
                          </div>
                          <div className='flex flex-col space-y-1'>
                              <div className=''>Invoices :</div>
                              <div className='font-light text-gray-500 pl-2'>{selected_customer.invoices} invoices</div>
                          </div>
                          <div className='flex flex-col space-y-1'>
                              <div className=''>Over Due :</div>
                              <div className='font-light text-gray-500 pl-2'>{formatNumberToINR(selected_customer.over_due)}</div>
                          </div>
                          <div className='flex flex-col space-y-1'>
                              <div className=''>Total Balance :</div>
                              <div className='font-light text-gray-500 pl-2'>{(formatNumberToINR(selected_customer.total_balance))}</div>
                          </div>
                          <div className='flex flex-col space-y-1'>
                              <div className=''>Credit Period :</div>
                              {isEditingCreditPeriod ? (
                                  <div className='flex items-center space-x-2'>
                                      <input
                                          type="number"
                                          value={newCreditPeriod}
                                          onChange={(e) => setNewCreditPeriod((e.target.value))}
                                          className="border rounded w-20 px-2 py-1 text-gray-500"
                                      /> 
                                      <div>days</div>
                                  </div>
                              ) : (
                              <div className='font-light text-gray-500 pl-2'>{selected_customer.credit_period} days</div>
                              )}
                          </div>
                          
                      </div>
                      <div className='flex flex-col space-y-5 rounded-lg w-3/5 h-full overflow-y-auto no-scrollbar bg-white p-5'>
                          <div className='flex w-full justify-between items-center'>
                              <div className='text-2xl tracking-wider font-semibold'>Names & Numbers</div>
                              {isAddingName ? (
                                  <div className='flex space-x-2'>
                                      <div className='text-red-500 underline cursor-pointer' onClick={()=>setIsAddingName(false)}>Cancel</div>
                                      <div className='text-green-500 underline cursor-pointer' onClick={()=>handleAddName()}>Save</div>
                                  </div>
                              ):(
                                  <div className='text-blue-500 underline cursor-pointer' onClick={()=>setIsAddingName(true)}>Add</div>
                              )}
                          </div>
                          <table>
                              <thead>
                                  <tr>
                                      <th className='text-left w-2/5 pl-2 border-b border-gray-200 italic'>Name</th>
                                      <th className='text-left w-2/5 pl-2 border-b border-gray-200 italic'>Phone Number</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {names_and_numbers.map((name) => (
                                      <tr key={name.id}>
                                          <td className='pl-2 border-b border-gray-200 italic py-2'>{name.name}</td>
                                          <td className='pl-2 border-b border-gray-200 italic py-2'>{name.phone_number}</td>
                                      </tr>
                                  ))}
                                  {isAddingName && (
                                      <tr>
                                          <td className='pl-2 border-b border-gray-200 italic py-2'>
                                              <input
                                                  value={newName}
                                                  onChange={(e) => setNewName(e.target.value)}
                                                  className='italic focus:outline-none' // Removed border and added focus:outline-none
                                                  placeholder='Enter Name...'
                                              />
                                          </td>
                                          <td className='pl-2 border-b border-gray-200 italic py-2'>
                                              <input
                                                  value={newPhoneNumber}
                                                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                                                  className='italic focus:outline-none' // Removed border and added focus:outline-none
                                                  placeholder='Enter Number...'
                                              />
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  
                    <div className='flex flex-col w-full rounded-xl space-y-4 bg-white p-2'>
                      <div className='flex w-full justify-between items-center'>
                        <div className='text-xl italic font-semibold'>Latest Comments</div>
                      </div>
                      {comment_data && comment_data.length > 0 && (
                        <div className='flex flex-col w-full h-auto'>
                          <table className="w-full h-auto italic text-left">
                            <thead className="border-b">
                              <tr>
                                  <th className="p-2 border-r border-t border-gray-200">Date</th>
                                  <th className="p-2 border-r border-t border-gray-200">Selected Invocies</th>
                                  <th className="p-2 border-r border-t border-gray-200">Amount Promised</th>
                                  <th className="p-2 border-r border-t border-gray-200">Remarks</th>
                                  <th className="p-2 border-r border-t border-gray-200">Follow Up Date</th>
                                  <th className="p-2 border-r border-t border-gray-200">Promised Date</th>
                                  <th className="p-2 border-r border-t border-gray-200">Completed</th>
                                  <th className="p-2 border-t border-gray-200">Sales Person</th>
                              </tr>
                            </thead>
                            <tbody>
                              {comment_data?.slice(0, 2).map((comment) => (
                                <tr key={comment.id} className="border-t">
                                    <td className="p-2 border-r border-t border-gray-200">{comment.date}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{comment.invoice_list}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{formatNumberToINR(comment.amount_promised)}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{comment.remarks}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{comment.follow_up_date ? (comment.follow_up_date) : ('-')}{comment.follow_up_date && (`, ${comment.follow_up_time}`)}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{comment.promised_date ? (comment.promised_date) : ('-')}</td>
                                    <td className="p-2 border-r border-t border-gray-200">{comment.comment_status ? 'Yes' : 'No'}</td>
                                    <td className="p-2 border-t border-gray-200">{sales_data.find((acc) => acc.id === comment.sales_person)?.name || '-'}</td>
                                </tr>
                                ))}
                            </tbody>
                          </table> 
                          <div className='flex w-full items-center justify-end text-blue-500 cursor-pointer'>
                            <div className='' onClick={()=> set_selected_tab('Comments')}>View More</div>
                          </div>
                        </div>
                      )}
                    </div>
                  
                </div>
              )}
              {selected_tab === 'Invoices' && (
                  <div className='flex flex-col space-y-2 w-full h-full overflow-y-auto no-scrollbar py-4 px-10 bg-gray-100'>
                      <div className="space-x-3">
                          <button onClick={() => setInvoiceFilter('All')} className={`py-2 px-4 rounded-xl shadow-lg hover:bg-blue-300 ${invoiceFilter === 'All' ? 'bg-blue-500 text-white' : ''}`}>All</button>
                          <button onClick={() => setInvoiceFilter('Paid')} className={`py-2 px-4 rounded-xl shadow-lg hover:bg-blue-300 ${invoiceFilter === 'Paid' ? 'bg-blue-500 text-white' : ''}`}>Paid</button>
                          <button onClick={() => setInvoiceFilter('Unpaid')} className={`py-2 px-4 rounded-xl shadow-lg hover:bg-blue-300 ${invoiceFilter === 'Unpaid' ? 'bg-blue-500 text-white' : ''}`}>Unpaid</button>
                      </div>
                      <div className='container bg-white h-full overflow-y-auto no-scrollbar items-center justify-center rounded-lg'>
                          <table className="w-full italic text-center">
                              <thead className="border-b">
                              <tr>
                                  <th className="px-4 py-2 border-r border-gray-200">Date</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Ref No</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Pending</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Due On</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Days Passed</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Paid</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Paid Date</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Sales Person</th>
                              </tr>
                              </thead>
                              <tbody>
                              {invoice_data?.filter(invoice => {
                                  if (invoiceFilter === 'Paid') return invoice.paid === true;
                                  if (invoiceFilter === 'Unpaid') return invoice.paid === false;
                                  return true; // For 'All'
                                  })
                                  .map((invoice, index) => (
                                  <tr key={invoice.id} className="border-t">
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.date}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.ref_no}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{formatNumberToINR(invoice.pending)}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.due_on}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.days_passed}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.paid ? 'Yes' : 'No'}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{invoice.paid_date ? invoice.paid_date : '-'}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{sales_data.find((acc) => acc.id === invoice.sales_person)?.name || '-'}</td>
                                  </tr>
                                  ))
                              }
                              </tbody>
                          </table>
                      </div>      
                  </div>
              )}
              {selected_tab === 'Comments' && (
                  <div className='flex justify-between w-full h-full overflow-y-auto no-scrollbar py-4 px-10 bg-gray-100'>
                      <div className='container bg-white  overflow-y-auto no-scrollbar items-center justify-center rounded-lg'>
                          <table className="w-full h-auto italic text-center">
                              <thead className="border-b">
                              <tr>
                                  <th className="px-4 py-2 border-r border-gray-200">Date</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Selected Invocies</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Amount Promised</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Remarks</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Follow Up Date</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Promised Date</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Completed</th>
                                  <th className="px-4 py-2 border-r border-gray-200">Sales Person</th>
                              </tr>
                              </thead>
                              <tbody>
                              {loading ? (
                                  <tr>
                                  <td colSpan={8} className="text-center py-4">
                                      <Loading_Comp />
                                  </td>
                                  </tr>
                              ) : (
                                  comment_data?.map((comment) => (
                                  <tr key={comment.id} className="border-t">
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.date}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.invoice_list}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{formatNumberToINR(comment.amount_promised)}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.remarks}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.follow_up_date ? (comment.follow_up_date) : ('-')}{comment.follow_up_date && (`, ${comment.follow_up_time}`)}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.promised_date ? (comment.promised_date) : ('-')}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{comment.comment_status ? 'Yes' : 'No'}</td>
                                      <td className="px-4 py-2 border-r border-gray-200">{sales_data.find((acc) => acc.id === comment.sales_person)?.name || '-'}</td>
                                  </tr>
                                  ))
                              )}
                              </tbody>
                          </table>
                      </div>      
                  </div>
              )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default CustomerInfo;
