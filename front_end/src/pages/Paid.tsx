import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { AccountInfo, InvoiceDetail, CommentInfo } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClock, faList, faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { AppProvider, useAppContext } from '../components/app_variables';

const Paid: React.FC = () => {
  const history = useHistory();
  const [comdata, setcomdata] = useState<InvoiceDetail[]>([]);
  const {user_id, username} = useAppContext();
  
  const fetchData = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/paid_invoices/', {
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
        setcomdata(data);
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

  const handlePaidStatusChange = async (invoice: InvoiceDetail) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    const todayDate = `${year}-${month}-${day}`;

    try {
      const response = await fetch('http://165.232.188.250:8080/invoice_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          paid_status: !invoice.paid,
          paid_date: invoice.paid ? null : todayDate,
        }),
      });

      console.log(invoice.id, !invoice.paid);
      if (response.ok) {
        console.log('Paid status updated successfully');
        // Refetch data after successful API call
        fetchData();
      } else {
        console.error('Failed to update paid status');
      }
    } catch (error) {
      console.error('Error updating paid status:', error);
    }
  };

  return (
    <div className='flex w-screen h-screen'>
      <HeadBar />
      <Sidebar current_page='Paid' />
      <div className='flex flex-col w-full pt-32 items-center'>
        {comdata.length > 0 ? (
          <div className='w-full max-w-screen-2xl px-4 overflow-x-auto'>
            <table className="table-auto w-full border-collapse border border-gray-400">
            <thead>
                <tr>
                <th className="text-center border border-gray-400 p-2">Account</th>
                <th className="text-center border border-gray-400 p-2">Ref No</th>
                <th className="text-center border border-gray-400 p-2">Invoice Date</th>
                <th className="text-center border border-gray-400 p-2">Amount</th>
                <th className="text-center border border-gray-400 p-2">Payment Date</th>
                <th className="text-center border border-gray-400 p-2">Paid</th>
                </tr>
            </thead>
            <tbody>
                {comdata.map((invoice: InvoiceDetail) => (
                <tr key={invoice.id}>
                    <td className="text-center border border-gray-400 p-2">{invoice.invoice.account}</td>
                    <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                    <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                    <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                    <td className="text-center border border-gray-400 p-2">{invoice.paid_date}</td>
                    <td className="text-center border border-gray-400 p-2">
                    <input
                    type="checkbox"
                    checked={invoice.paid}
                    onChange={() => handlePaidStatusChange(invoice)}
                    />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
          </div>
        ) : (
          <div className='flex w-full h-full items-center justify-center text-5xl'>
            None
          </div>
        )}
      </div>
    </div>
  );
};

export default Paid;
