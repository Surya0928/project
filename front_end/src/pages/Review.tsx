import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { Paidinfo, InvoiceDetail, CommentInfo, SalesPerson , Each_Account_Name_List} from '../models';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';


const Review: React.FC = () => {
  const history = useHistory();
  const {user_id, username} =useAppContext();
  const [New_Invoices, set_New_Invocies] = useState<InvoiceDetail[]>([]);
  const [Old_Invoices, set_Old_Invocies] = useState<InvoiceDetail[]>([]);
  const [invoicePaidStatus, setInvoicePaidStatus] = useState<{ [key: number]: boolean }>({});
  const [invoicePaidDate, setInvoicePaidDate] = useState<{ [key: number]: string }>({});

  const fetchData = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/review_invoices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id
        }),
        
      })
      if (response.ok) {
        const data = await response.json();
        set_New_Invocies(data['invoices_new']);
        set_Old_Invocies(data['invoices_old']);
        console.log('new', data['invoices_new']);
        console.log('old', data['invoices_old'])
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    {!user_id && (
      history.push('/')
    )}
    fetchData();
    
  }, []);


  const handleCheckboxChange = (invoiceId: number) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

    setInvoicePaidStatus((prevState) => ({
      ...prevState,
      [invoiceId]: !prevState[invoiceId],
    }));

    if (!invoicePaidStatus[invoiceId]) {
      setInvoicePaidDate((prevState) => ({
        ...prevState,
        [invoiceId]: formattedDate,
      }));
    } else {
      setInvoicePaidDate((prevState) => {
        const newState = { ...prevState };
        delete newState[invoiceId];
        return newState;
      });
    }
  };

  const handleDateChange = (invoiceId: number, date: string) => {
    setInvoicePaidDate((prevState) => ({
      ...prevState,
      [invoiceId]: date,
    }));
  };

  const new_invoice_acceptance = async (id: number, acceptance: boolean) => {
    try {
      const response = await fetch('http://165.232.188.250:8080/invoice_acceptance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id : id,
          acceptance : acceptance
        }),
      });
  
      if (response.ok) {
        // Refetch data after successful API call
        fetchData();
      }
    } catch (error) {
    }
  };

  const old_invoice_acceptance = async (invoice: InvoiceDetail) => {
    try {
      const response = await fetch('http://165.232.188.250:8080/invoice_old_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: invoice.id,
            paid_status: invoicePaidStatus[invoice.id] || false,
            paid_date: invoicePaidDate[invoice.id] || null,
        }),
      });
  
      if (response.ok) {
        // Refetch data after successful API call
        fetchData();
      }
    } catch (error) {
    }
  };
  
  return (
    <div className='flex w-screen justify-between items-center'>
      <Sidebar current_page='Review' />
      <HeadBar />
      <div className="flex flex-col w-screen h-screen overflow-auto items-center justify-center py-20 text-black space-y-10">
        <div className='text-3xl font-bold underline'>New Invoices</div>
        <div className='w-5/6'>
          <table className='w-full'>
            <thead>
              <tr className='h-auto'>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Account</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Ref Number</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Date</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Amount</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {New_Invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="text-center border border-gray-400 p-2">{invoice.invoice.account}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                  <td className="flex items-center justify-center space-x-1 text-center border border-gray-400 p-2">
                    <button className='text-green-500' onClick={() => new_invoice_acceptance(invoice.id, true)}>Approve</button>
                    <div>/</div>
                    <button className='text-red-500' onClick={() => new_invoice_acceptance(invoice.id, false)}>Decline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='text-3xl font-bold underline'>Old Invoices</div>
        <div className='w-5/6'>
          <table className='w-full'>
            <thead>
              <tr className='h-auto'>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Account</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Ref Number</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Date</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Amount</th>
                <th className="text-center border bg-gray-300 border-gray-400 p-2">Is_Paid</th>
              </tr>
            </thead>
            <tbody>
              {Old_Invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="text-center border border-gray-400 p-2">{invoice.invoice.account}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                  <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                  <td className="flex flex-col items-center justify-center border border-gray-400 p-2 space-y-2">
                    <div className='flex space-x-2'>
                    <input
                        type="checkbox"
                        checked={invoicePaidStatus[invoice.id] || false}
                        onChange={() => handleCheckboxChange(invoice.id)}
                    />
                    {invoicePaidStatus[invoice.id] && (
                    <input
                        type="date"
                        value={invoicePaidDate[invoice.id] || ''}
                        onChange={(e) => handleDateChange(invoice.id, e.target.value)}
                        className='w-28'
                    />
                    )}
                    </div>
                    <button onClick={() => old_invoice_acceptance(invoice)} className='text-blue-600 font-bold'>Confirm</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Review;
