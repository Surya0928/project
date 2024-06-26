import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { Paidinfo, InvoiceDetail, CommentInfo, SalesPerson , Each_Account_Name_List} from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil , faSquarePlus} from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';


const Paid: React.FC = () => {
  const history = useHistory();
  const {user_id, username} =useAppContext();
  const [Paidinfo, setPaidinfo] = useState<Paidinfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [date, setdate] = useState<string | null>(null);
  const [Amount, setAmount] = useState<number | null>(null);
  const [Name, setName] = useState<string | null>(null);
  const [Num, setNum] = useState<string | null>(null);
  const [Sales_p, setSales_p] = useState<string>('Select Sales Person');
  const [Edit, setIsEdit] = useState(false);
  const [acc, setacc] = useState<string | null>(null);
  const [comsec, setcomsec] = useState(false);
  const [comacc, setcomacc] = useState<string>('');
  const [prev_com, setprevcom] = useState(false);
  const [comdata, setcomdata] = useState<CommentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sales, setsales] = useState<string[]>([]);
  const [follow_up_date, setfollow_up_date] = useState<string>('');
  

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
        setPaidinfo(data['customer_data']);        
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




  const handleAccountClick = (account: string) => {
    setSelectedAccount(prevAccount => prevAccount === account ? '' : account);
    
    // Find the account from Paidinfo variable
    const selectedAccount = Paidinfo.find(info => info.account === account);
    
    // If the account is found, get its comments
    if (selectedAccount) {
      const filteredComments = selectedAccount.comments;
      setcomdata(filteredComments);
      // Now you can use the filteredComments array as needed
    }
  };


  const handleInvoicePaidStatusChange = async (invoice: InvoiceDetail) => {
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
          user : user_id,
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
    <div className='flex w-screen justify-between  items-center'>
      <Sidebar current_page='Paid' />
      <HeadBar />
      <div className="flex flex-col w-screen h-full items-center pb-10 text-black space-y-8">
        <div className='pt-20 w-auto'>
        <input
          type="text"
          placeholder="Search the account"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '1000px', // Adjust width as needed
            border: '1px solid gray', // Set border color to gray
            borderRadius: '4px', // Optional: Add border radius for styling
            outline: 'none', // Prevent the input from getting highlighted when focused
            padding: '8px', // Optional: Add padding for better appearance
          }}
        />
        </div>
        <div className={`container space-y-8 bg-gray-300 w-screen overflow-auto border border-gray-400 rounded-xl py-2`}>
          <div className='flex flex-col space-y-3'>
            <div className="flex text-sm justify-around w-full font-bold">
              <div className="flex h-auto w-36 items-center justify-center underline">Account</div>
              <div className='flex flex-col w-36 items-center justify-center space-y-1'>
                <div>Name</div>
                <div>(Phone Number)</div>
              </div>
              <div className="flex h-auto w-36 items-center justify-center">Number of Invoices</div>
              <div className="flex h-auto w-36 items-center justify-center">Paid Amount</div>
              <div className="flex h-auto w-36 items-center justify-center">Last Payment Date</div>
            </div>
            <div className='container w-full border border-gray-500'></div>
          </div>
          {/* Display list of accounts */}
          {Paidinfo.map((account) => (
            <div key={account.id} className="cursor-pointer">
              <div className='flex flex-col h-32 justify-between'>
                <div className="flex text-sm justify-around w-full">
                  <div className="flex w-36 items-center justify-center font-bold underline" onClick={() => handleAccountClick(account.account)}>{account.account}</div>
                  <div className='flex flex-col w-36 items-center justify-center space-y-1'>
                  <div className='flex flex-col h-20 overflow-y-auto space-y-1'>
                    {account.names.map((Name: Each_Account_Name_List) => (
                      <div>
                        <div>
                            {Name.name}
                        </div>
                        <div>
                            ({Name.phone_number})
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.number_of_invoices}</div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.amount_paid}</div>
                  <div className="flex h-auto w-36 justify-center items-center">{account.last_payment_date}</div>
                </div>
                <div className='container w-full border border-gray-500'></div>
              </div>
              {/* Render invoice details if this account is selected */}
              {selectedAccount === account.account && (
                <div className='flex flex-col space-y-4'>
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
                  <div className='container w-full border border-gray-500'></div>
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
