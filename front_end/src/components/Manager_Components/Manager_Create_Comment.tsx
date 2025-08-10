import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import Loading_Comp from '../Loading';
import { useAppContext } from '../app_variables';

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
    sales_person: string,
    comment_status: boolean,
    follow_up_time: string
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
    invoices : Invoice[];
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

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};


const CreateComment: React.FC<CustomerInfoProps> = ({ customer_name,ar_accountant, accountants, sales_data, onClose }) => {
  // Find the accountant name by ID
  const {id} =useAppContext();
  const [selected_customer, set_selected_customer] = useState<Customer>({
    id: 0,customer_name: '',invoices: 0,credit_period: 0,over_due: 0,total_balance: 0,ar_accountant: 0,
    })
  const accountantName = accountants.find(accountant => accountant.id === selected_customer.ar_accountant)?.username || 'Unknown';
  const [selected_tab, set_selected_tab] = useState<string>('Add Comment')
  const [loading, set_loading] = useState<boolean>(false)
  const [invoice_data, set_invoice_data] = useState<Invoice[] | null>(null)
  const [selected_invoices, set_selected_invoices] = useState<string[]>([]);
  const selected_invoices_string = selected_invoices.join(', ');
  const [open_tab_selection, set_open_tab_selection] = useState<boolean>(false);
  const [totalPendingAmount, set_TotalPendingAmount] = useState(0);
  const [sales_option, set_sales_option] = useState<string>('');
  const [follow_up_date, set_follow_up_date] = useState<string>('');
  const [followUpTime, set_FollowUpTime] = useState(''); 
  const [paid_date, set_paid_date] = useState<string>('');
  const handleCheckboxChange = (refNo: string, pendingAmount: number) => {
    set_selected_invoices((prev_selected_invoices) => {
      if (prev_selected_invoices.includes(refNo)) {
        // If the reference number is already selected, remove it and subtract the amount
        set_TotalPendingAmount(() => {
          const updatedTotal = Number(totalPendingAmount) - Number(pendingAmount);
          return parseFloat(updatedTotal.toFixed(2));
        });
        return prev_selected_invoices.filter((number) => number !== refNo);
      } else {
        // If the reference number is not selected, add it and add the amount
        set_TotalPendingAmount(() => {
          const updatedTotal = Number(totalPendingAmount) + Number(pendingAmount);
          return parseFloat(updatedTotal.toFixed(2));
        });
        return [...prev_selected_invoices, refNo];
      }
    });
  };
  
  const [remarks, set_Remarks] = useState<string>('');
  const [selectedOption, set_SelectedOption] = useState<string>('Select Response');

  const handleRemarksChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    set_SelectedOption(value);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    if (value === "No Response" || value === "Requested Call Back") {
      set_follow_up_date(formattedDate);
      set_promised_date('');
      set_prom_amount(0.00)
    }

    if (value === "Payment") {
      set_invoices_paid(true)
      set_paid_date(`${year}-${month}-${String(Number(day)-1)}`)
    } else {
      set_invoices_paid(false)
      set_paid_date(``)
    }

  };

  const [prom_amount, set_prom_amount] = useState<number>(0.00);
  const [paid_amount, set_paid_amount] = useState<number>(0.00);
  const [promised_date, set_promised_date] = useState<string>('');
  const [invoices_paid, set_invoices_paid] = useState<boolean>(false);

  const handleSelectAll = () => {
    if (invoice_data) {
      // Select all invoice reference numbers
      const allInvoiceRefs = invoice_data.map((invoice) => invoice.ref_no);
  
      // Calculate the total pending amount for all invoices
      const totalAmount = invoice_data.reduce((sum, invoice) => sum + invoice.pending, 0);
  
      // Update the selected invoices and total pending amount state
      set_selected_invoices(allInvoiceRefs);
      set_TotalPendingAmount(parseFloat(totalAmount.toFixed(2)));
    }
  };  
  
  const fetchCustomerData = async () => {
    set_loading(true)
    try {
      const response = await fetch('http://159.89.160.186:8000/get_customer/', {
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
          set_invoice_data(data['Customer']['invoice_details'])
          set_selected_customer(data['Customer'])
          set_loading(false)
      }
      // Handle the data as needed
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const create_commentt = async () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    // Add more logs to inspect the form elements and values
    if (selectedOption && selectedOption == 'No Response' || selectedOption == 'Requested Call Back') {
      set_prom_amount(0)
    }

    if (selected_invoices.length >0 && selectedOption && (promised_date || follow_up_date)) {
      try {
        const response = await fetch('http://159.89.160.186:8000/create-comment/', {
          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            manager: id,
            user : id,
            invoice : selected_customer.customer_name,
            date : `${year}-${month}-${day}`,
            invoice_list : selected_invoices_string || null,
            remarks : `${selectedOption}. ${remarks}`,
            amount_promised: prom_amount || totalPendingAmount || 0.00,
            sales_person: sales_option || null,
            follow_up_date: follow_up_date || null,
            follow_up_time: followUpTime || null,
            promised_date: promised_date || null,
            invoices_paid: invoices_paid,
            invoices_paid_date: paid_date || null,
            invoices_paid_amount : prom_amount || totalPendingAmount || 0.00,
          }),
        });
      
        if (response.ok) {
          console.log('Comment created successfully');
          onClose()
        } else {
          console.error('Failed to create comment');
        }
      } catch (error) {
        console.error('Error creating comment:', error);
      }
    
    }
  };


  useEffect(() => {
    fetchCustomerData();
  }, [selected_customer.ar_accountant, selected_customer.customer_name]);


  return (
    <div className="flex flex-col w-full h-full bg-white shadow-md rounded-lg">
        <div className="flex flex-col w-full space-y-4 bg-white px-6 pt-6 pb-2">
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
        {/* {open_tab_selection ? (
            <div className='flex flex-col w-full h-full  pt-5 '>
                <div className='flex w-full px-10 items-center justify-between font-light tracking-wide'>
                    <div className='flex space-x-4 text-gray-400'>
                        <div className={`px-1 cursor-pointer ${selected_tab === 'Add Comment' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Add Comment')}>Add Comment</div>
                        <div className={`px-1 cursor-pointer ${selected_tab === 'Pay Invoices' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Pay Invoices')}>Pay Invoices</div>
                        <div className={`px-1 cursor-pointer ${selected_tab === 'Flag To Manager' ? 'border-b-4 border-green-600 text-green-600 font-medium' : ''}`} onClick={() => set_selected_tab('Flag To Manager')}>Flag To Manager</div>
                    </div>
                    <div className='text-xl text-blue-500 underline cursor-pointer' onClick={()=>set_open_tab_selection(false)}>GO BACK TO INVOICE SELECTION</div>
                </div>
                {selected_tab === 'Add Comment' && (
                    <div></div>
                )}
            </div>        
        ) : ( */}
        <div className='flex flex-col space-y-2 w-full h-full py-2 px-10 bg-gray-100'>
            <div className='w-1/2 flex justify-between items-center px-3'>
              {invoice_data && selected_invoices.length<invoice_data.length && (<div className='text-blue-500 underline cursor-pointer' onClick={()=>handleSelectAll()}>Select All</div>)}
              {selected_invoices.length>0 && (<div className='text-red-500 underline cursor-pointer' onClick={()=>{set_selected_invoices([]); set_TotalPendingAmount(0);}}>Clear All</div>)}
            </div>
            <div className='flex w-full justify-between space-x-8 h-4/5 p-1'>
              <div className='container bg-white overflow-y-auto no-scrollbar items-center justify-center rounded-lg' style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                  <table className="w-full h-full italic text-center">
                      <thead className="border-b">
                      <tr>
                          <th className="px-4 py-2 border-r border-gray-200">Select</th>
                          <th className="px-4 py-2 border-r border-gray-200">Date</th>
                          <th className="px-4 py-2 border-r border-gray-200">Ref No</th>
                          <th className="px-4 py-2 border-r border-gray-200">Pending</th>
                          <th className="px-4 py-2 border-r border-gray-200">Due On</th>
                          <th className="px-4 py-2 border-r border-gray-200">Days Passed</th>
                      </tr>
                      </thead>
                      <tbody>
                      {invoice_data?.filter(invoice => {return invoice.paid === false;}).map((invoice, index) => (
                          <tr key={invoice.id} className="border-t" onClick={() => handleCheckboxChange(invoice.ref_no, invoice.pending)}>
                              <td className="px-4 py-2 border-r border-gray-200">
                                  <input
                                      type="checkbox"
                                      id={invoice.ref_no}
                                      checked={selected_invoices.includes(invoice.ref_no)}
                                  />
                              </td>
                              <td className="px-4 py-2 border-r border-gray-200">{invoice.date}</td>
                              <td className="px-4 py-2 border-r border-gray-200">{invoice.ref_no}</td>
                              <td className="px-4 py-2 border-r border-gray-200">{formatNumberToINR(invoice.pending)}</td>
                              <td className="px-4 py-2 border-r border-gray-200">{invoice.due_on}</td>
                              <td className="px-4 py-2 border-r border-gray-200">{invoice.days_passed}</td>
                          </tr>
                          ))
                      }
                      </tbody>
                  </table>
              </div> 
              <div className='flex flex-col w-full h-full space-y-4 italic'> 
                <div className='flex space-x-4 w-full h-auto'>
                  <div className='font-bold italic text-xl'>Type :</div>
                  <div className="relative inline-block w-64">
                    <select
                      value={selectedOption}
                      onChange={handleRemarksChange}
                      className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-lg italic"
                    >
                      <option className="italic" value=""></option>
                      <option className="italic" value="No Response">No Response</option>
                      <option className="italic" value="Requested Call Back">Requested Call Back</option>
                      <option className="italic" value="Payment">Payment</option>
                      <option className="italic" value="Other">Other</option>
                      {/* Add more options as needed */}
                    </select>
                  </div>
                </div>
                {(selectedOption == 'Other' || selectedOption =='Payment') && (
                  <div className='flex flex-col w-full h-auto'>
                    <div className='font-bold text-xl'>Remarks : </div>
                    <textarea
                      id='remarks'
                      onChange={(event) => set_Remarks(event.target.value)}
                      className="block appearance-none w-full max-h-80 bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-lg italic"
                      placeholder="Enter other remarks..."
                    />
                  </div>
                )}
                {selectedOption != 'Payment' && (
                  <div className='flex h-auto justify-between space-x-3 w-full items-center'>
                    <div className='font-bold text-xl'>Follow Up Date: </div>
                    <input 
                      className="block appearance-none w-1/4 bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-xl italic"
                      value={follow_up_date} 
                      onChange={(e) => set_follow_up_date(e.target.value)} 
                      type="date"
                    />

                    <div className='font-bold text-xl'>Follow Up Time: </div>
                    <input 
                      className='block appearance-none w-1/4 bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-xl italic'
                      type="time" 
                      value={followUpTime} 
                      onChange={(e) => set_FollowUpTime(e.target.value)} 
                      placeholder="Follow Up Time" 
                    />
                  </div>
                )}
                {selectedOption == 'Other' && (
                  <div className='flex h-13 space-x-3 w-full items-center'>
                    <div className='font-bold text-xl'>Promised Payment Date: </div>
                    <input 
                      className="block appearance-none w-1/4 bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-xl italic"
                      value={promised_date} onChange={(e) => set_promised_date(e.target.value)} 
                      type="date"
                    />
                  </div>
                )}
                <div className='flex h-auto w-full items-center justify-between'>
                  <div className='flex h-13 space-x-3 w-auto items-center'>
                    <div className='font-bold text-xl'>Amount Promised:</div>
                    <input 
                      disabled = {(selectedOption != 'Other' && selectedOption!= 'Payment') || selected_invoices.length === 0} 
                      placeholder={`${formatNumberToINR(totalPendingAmount)}`} 
                      type='number' 
                      onChange={(e) => set_prom_amount(Number(e.target.value))} 
                      className="block appearance-none w-44 bg-white border border-gray-300 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-xl italic"
                    />
                  </div>
                  {selectedOption != 'Payment' && (
                    <div className='flex h-13 space-x-3 w-auto items-center'>
                      <div className='font-bold text-xl'>Sales Person :</div>
                      <select value={sales_option} onChange={(e) => set_sales_option(e.target.value)} className="block appearance-none w-60  bg-white border border-gray-300 py-1 px-3 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-lg italic">
                        <option value="">Select Sales Person</option> {/* Deselection option */}
                        {sales_data.map((person, index) => (
                          <option key={index} value={person.name}>{person.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {selectedOption == 'Payment' && (
                  <div className='flex h-13 space-x-3 w-full items-center'>
                    <div className='font-bold text-xl'>Payment Date: </div>
                    <input 
                      className="block appearance-none w-1/4 bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded-lg leading-tight focus:outline-none focus:border-gray-300 font-italic text-xl italic"
                      value={paid_date} onChange={(e) => set_paid_date(e.target.value)} 
                      type="date"
                    />
                  </div>
                )}
                <div className='flex flex-col space-y-2 h-80 overflow-y-auto bg-white p-2 rounded-xl'>
                  <div className='text-xl italic w-full font-bold'> Selected Invoices Reference Numbers :</div>
                  <div className='text-lg italic w-full font-medium text-gray-400 '>{selected_invoices_string}</div>
                </div>
                <button
                  className="w-full bg-gradient-to-r from-blue-400 to-purple-600 text-white py-2 rounded-lg "
                  onClick={()=>{create_commentt()}}
                  disabled={loading || !selectedOption || selected_invoices.length == 0}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div> 
            </div>

        </div>    
        {/* )} */}
    </div>
  );
};

export default CreateComment;
