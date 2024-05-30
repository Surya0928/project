import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { AccountInfo, InvoiceDetail, CommentInfo, SalesPerson } from '../models';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';


const To_DO: React.FC = () => {
  const history = useHistory();
  const {user_id, username} =useAppContext();
  const [accountInfo, setAccountInfo] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [Edit, setIsEdit] = useState(false);
  const [acc, setacc] = useState<string | null>(null);
  const [comdata, setcomdata] = useState<CommentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sales, setsales] = useState<string[]>([]);
  
  const [salesPersonMapping, setSalesPersonMapping] = useState<{ [key: number]: string }>({});

  const [invoiceSalesPersons, setInvoiceSalesPersons] = useState<{ [key: string]: string }>({});

  const handleSalesPersonChange = (event: React.ChangeEvent<HTMLSelectElement>, invoiceRefNo: string) => {
    console.log(invoiceSalesPersons)
    const { value } = event.target;
    // If the deselection option is selected (value is empty string), remove the salesperson for the invoice
    if (value === '') {
      setInvoiceSalesPersons(prevState => {
        const updatedState = { ...prevState };
        delete updatedState[invoiceRefNo];
        return updatedState;
      });
    } else {
      // Otherwise, update the salesperson for the invoice
      setInvoiceSalesPersons(prevState => ({
        ...prevState,
        [invoiceRefNo]: value
      }));
    }
  };
  
  const filteredAccounts = searchQuery
    ? accountInfo.filter((account) =>
        account.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.invoice_details.some((invoice) =>
          invoice.ref_no.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : accountInfo;


  const fetchData = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/to_do_invoices/', {
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
        setAccountInfo(data['customer_data']);
        setsales(data['sales'])
        const salesPersonmapping = data['sales_data'].reduce((acc: { [key: number]: string }, person: SalesPerson) => {
          acc[person.id] = person.name;
          return acc;
        }, {});
        setSalesPersonMapping(salesPersonmapping);
        
  
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

  useEffect(() => {
    if (selectedAccount) {
      const selectedAccountData = accountInfo.find((account: AccountInfo) => account.account === selectedAccount);
      if (selectedAccountData) {
        setcomdata(selectedAccountData.comments);
      }
    }
  }, [selectedAccount, accountInfo]);


  const handleAccountClick = (account: string) => {
    console.log(salesPersonMapping)
    setSelectedAccount(prevAccount => prevAccount === account ? '' : account);
    
    // Find the account from accountInfo variable
    const selectedAccount = accountInfo.find(info => info.account === account);
    
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
  
  const handleCommentPaidStatusChange = async (comment: CommentInfo) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    const todayDate = `${year}-${month}-${day}`;
  
    try {
      const response = await fetch('http://165.232.188.250:8080/comment_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: comment.id,
          paid_status: !comment.paid,
          paid_date: comment.paid ? null : todayDate,
        }),
      });
  
      console.log(comment.id, !comment.paid);
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
      <Sidebar current_page='To_Do' />
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
              <div className="flex h-auto w-32 items-center justify-center underline">Account</div>
              <div className='flex flex-col w-32 items-center justify-center space-y-1'>
                <div>Name</div>
                <div>(Phone Number)</div>
              </div>
              <div className="flex h-auto w-28 items-center justify-center">Total Due</div>
              <div className="flex h-auto w-28 items-center justify-center">Over Due</div>
              <div className="flex h-auto w-28 items-center justify-center">Invoices</div>
              <div className="flex h-auto w-28 items-center justify-center">Prom Amount</div>
              <div className="flex h-auto w-32 items-center justify-center">Prom Date</div>
            </div>
            <div className='container w-full border border-gray-500'></div>
          </div>
          {/* Display list of accounts */}
          {filteredAccounts.map((account) => (
            <div key={account.id} className="cursor-pointer">
              <div className='flex flex-col h-32 justify-between'>
                <div className="flex text-sm justify-around w-full">
                  <div className="flex w-32 items-center justify-center font-bold underline" onClick={() => handleAccountClick(account.account)}>{account.account}</div>
                  <div className='flex flex-col w-32 items-center justify-center space-y-1'>
                    <div>
                        {account.name}
                    </div>
                    <div>
                        {account.phone_number}
                    </div>
                  </div>
                  <div className="flex h-auto w-28 justify-center items-center">{account.total_due}</div>
                  <div className="flex h-auto w-28 justify-center items-center">{account.over_due}</div>
                  <div className="flex h-auto w-28 justify-center items-center">{account.invoices}</div>
                  <div className="flex h-auto w-28 justify-center items-center">
                      {account.promised_amount}
                  </div>
                  <div className='flex h-auto w-32 items-center justify-center'>                    
                        {account.promised_date}
                  </div>
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
                        <th className="text-center border border-gray-400 p-2">Due Date</th>
                        <th className="text-center border border-gray-400 p-2">Pending Amount</th>
                        <th className="text-center border border-gray-400 p-2">Days Passed</th>
                        <th className="text-center border border-gray-400 p-2">Paid</th>
                        <th className="text-center border border-gray-400 p-2">Sales_Person</th>
                      </tr>
                    </thead>
                    <tbody>
                      {account.invoice_details.map((invoice: InvoiceDetail) => (
                        <tr key={invoice.id}>
                          <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.due_on}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                          <td className="text-center border border-gray-400 p-2">{invoice.days_passed}</td>
                          <td className="text-center border border-gray-400 p-2">
                          <input
                            type="checkbox"
                            checked={invoice.paid}
                            onChange={() => handleInvoicePaidStatusChange(invoice)}
                          />
                          </td>
                          <td className="text-center border border-gray-400 p-2">
                            {Edit && acc===account.account ? (
                              <select value={invoiceSalesPersons[invoice.ref_no] || ''} onChange={(e) => handleSalesPersonChange(e, invoice.ref_no)} className='border border-gray-600 bg-gray-300'>
                                <option value="">{invoice.sales_person ? (salesPersonMapping[invoice.sales_person]) : ('Select Sales Person')}</option> {/* Deselection option */}
                                {sales.map((person, index) => (
                                  <option key={index} value={person}>{person}</option>
                                ))}
                              </select>

                              ) : (
                                salesPersonMapping[invoice.sales_person] || ''
                            )}
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="table-auto w-full border-collapse border border-gray-400">
                    <thead>
                      <tr>
                        <th className="text-center border border-gray-400 p-2">Optimal Due</th>
                        <th className="text-center border border-gray-400 p-2">Threshold Due</th>
                        <th className="text-center border border-gray-400 p-2">OverDue</th>
                      </tr>
                    </thead>
                    <tbody>
                        <tr >
                          <td className="text-center border border-gray-400 p-2">{account.optimal_due}</td>
                          <td className="text-center border border-gray-400 p-2">{account.threshold_due}</td>
                          <td className="text-center border border-gray-400 p-2">{account.over_due}</td>
                        </tr>
                    </tbody>
                  </table>
                  <table className="table-auto w-full border-collapse border border-gray-400">
                    <thead>
                      <tr>
                        <th className="text-center border border-gray-400 p-2">Date</th>
                        <th className="text-center border border-gray-400 p-2">Invoices</th>
                        <th className="text-center border border-gray-400 p-2">Remarks</th>
                        <th className="text-center border border-gray-400 p-2">Amount_Promised</th>
                        <th className="text-center border border-gray-400 p-2">Follow_up_date</th>
                        <th className="text-center border border-gray-400 p-2">Promised_date</th>
                        <th className="text-center border border-gray-400 p-2">Paid</th>
                        
                      </tr>
                    </thead>
                    <tbody>
                    {comdata.slice(-2).reverse().map((comment: CommentInfo) => (
                        <tr key={comment.id}>
                          <td className="text-center border border-gray-400 p-2">{comment.date}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.invoice_list}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.remarks}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.amount_promised}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.follow_up_date}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.promised_date}</td>
                          <td className="text-center border border-gray-400 p-2">
                          <input
                            type="checkbox"
                            checked={comment.paid}
                            onChange={() => handleCommentPaidStatusChange(comment)}
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

export default To_DO;
