import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { Paidinfo, InvoiceDetail, CommentInfo, SalesPerson, Each_Account_Name_List } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faSquarePlus } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';

const Paid: React.FC = () => {
  const history = useHistory();
  const { id, paid_invoices_data, set_paid_invoices_data } = useAppContext();
  const [Paidinfo, setPaidinfo] = useState<Paidinfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/paid_invoices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        set_paid_invoices_data(data);
        setPaidinfo(data['customer_data']);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (!id) {
      history.push('/');
    }
    setPaidinfo(paid_invoices_data['customer_data']);
  }, []);

  const handleAccountClick = (account: string) => {
    setSelectedAccount((prevAccount) => (prevAccount === account ? '' : account));
  };

  const handleInvoicePaidStatusChange = async (invoice: InvoiceDetail) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    try {
      const response = await fetch('http://127.0.0.1:8000/invoice_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: id,
          invoice_id: invoice.id,
          paid_status: !invoice.paid,
          paid_date: invoice.paid ? null : todayDate,
        }),
      });

      if (response.ok) {
        fetchData();
      } else {
        console.error('Failed to update paid status');
      }
    } catch (error) {
      console.error('Error updating paid status:', error);
    }
  };

  const filteredPaidInfo = Paidinfo.filter((account) =>
    account.account.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='flex w-screen bg-gray-100 h-screen justify-between  items-center'>
      <Sidebar current_page="Paid" />
      <HeadBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} pagename='Paid' />
      <div className="flex flex-col w-screen h-full items-center pt-20 pb-10 text-black space-y-8">
        <div className="container space-y-8 bg-gray-300 w-screen overflow-auto border border-gray-400 rounded-xl py-2">
          <div className="flex flex-col space-y-3">
            <div className="flex text-sm justify-around w-full font-bold">
              <div className="flex h-auto w-36 items-center justify-center underline">Account</div>
              <div className="flex flex-col w-36 items-center justify-center space-y-1">
                <div>Name</div>
                <div>(Phone Number)</div>
              </div>
              <div className="flex h-auto w-36 items-center justify-center">Number of Invoices</div>
              <div className="flex h-auto w-36 items-center justify-center">Paid Amount</div>
              <div className="flex h-auto w-36 items-center justify-center">Last Payment Date</div>
            </div>
            <div className="container w-full border border-gray-500"></div>
          </div>
          {filteredPaidInfo.map((account) => (
            <div key={account.id} className="cursor-pointer">
              <div className="flex flex-col h-32 justify-between">
                <div className="flex text-sm justify-around w-full">
                  <div
                    className="flex w-36 items-center justify-center font-bold underline"
                    onClick={() => handleAccountClick(account.account)}
                  >
                    {account.account}
                  </div>
                  <div className="flex flex-col w-36 items-center justify-center space-y-1">
                    <div className="flex flex-col h-20 overflow-y-auto no-scrollbar space-y-1">
                      {account.names.map((Name: Each_Account_Name_List) => (
                        <div key={Name.id}>
                          <div>{Name.name}</div>
                          <div>({Name.phone_number})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.number_of_invoices}</div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.amount_paid}</div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.last_payment_date}</div>
                </div>
                <div className="container w-full border border-gray-500"></div>
              </div>
              {selectedAccount === account.account && (
                <div className="flex flex-col space-y-4">
                  <table className="table-auto w-full border-collapse border border-gray-400">
                    <thead>
                      <tr>
                        <th className="text-center border border-gray-400 p-2">Ref No</th>
                        <th className="text-center border border-gray-400 p-2">Invoice Date</th>
                        <th className="text-center border border-gray-400 p-2">Paid Amount</th>
                        <th className="text-center border border-gray-400 p-2">Paid Date</th>
                        <th className="text-center border border-gray-400 p-2">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.invoice_details.map((invoice: InvoiceDetail) => (
                        <tr key={invoice.id}>
                          <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.paid_date}</td>
                          <td className="text-center border border-gray-400 p-2">
                            <input
                              type="checkbox"
                              checked={invoice.paid}
                              onChange={() => handleInvoicePaidStatusChange(invoice)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="container w-full border border-gray-500"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Paid;
