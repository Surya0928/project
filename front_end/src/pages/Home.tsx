import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { AccountInfo, InvoiceDetail, CommentInfo, SalesPerson, Each_Account_Name_List } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil , faSquarePlus} from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';


const Home: React.FC = () => {
  const history = useHistory();
  const {id, all_invoices_data, set_all_invoices_data} =useAppContext();
  const [accountInfo, setAccountInfo] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [date, setdate] = useState<string | null>(null);
  const [Name, setName] = useState<string | null>(null);
  const [Num, setNum] = useState<string | null>(null);
  const [Sales_p, setSales_p] = useState<string>('Select Sales Person');
  const [Edit, setIsEdit] = useState(false);
  const [acc, setacc] = useState<string>('');
  const [comsec, setcomsec] = useState(false);
  const [comacc, setcomacc] = useState<string>('');
  const [prev_com, setprevcom] = useState(false);
  const [comdata, setcomdata] = useState<CommentInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sales, setsales] = useState<string[]>([]);
  const [follow_up_date, setfollow_up_date] = useState<string>('');
  const [followUpTime, setFollowUpTime] = useState(''); 
  const [comment_status_date, setcomment_status_date] = useState<string>('');
  
  
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
  
  const handleSales_PChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSales_p(event.target.value)
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
      const response = await fetch('http://159.89.160.186/api/invoices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id
        }),
        
      })
      if (response.ok) {
        setIsEdit(false);
        const data = await response.json();
        set_all_invoices_data(data)
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
    {!id && (
      history.push('/')
    )}
    fetchData()
    setIsEdit(false);
        setAccountInfo(all_invoices_data['customer_data']);
        setsales(all_invoices_data['sales'])
        const salesPersonmapping = all_invoices_data['sales_data'].reduce((acc: { [key: number]: string }, person: SalesPerson) => {
          acc[person.id] = person.name;
          return acc;
        }, {});
        setSalesPersonMapping(salesPersonmapping);
    
    
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const selectedAccountData = accountInfo.find((account: AccountInfo) => account.account === selectedAccount);
      if (selectedAccountData) {
        setcomdata(selectedAccountData.comments);
      }
    }
  }, [selectedAccount, accountInfo]);

  const updateCommentSection = (account: string) => {
    setcomsec(!comsec);
    setcomacc(account);
    setSelectedAccount(account);
    console.log(account)
  };

  const backcomsec = (account: string) => {
    setTotalPendingAmount(0);
    setSelectedOption('Select Response');
    setRemarks('');
    setSelectedRefNumbers([]);
    setpromised_date('');
    setdate('');
    setprom_amount(0);
    setpaid_amount(0);
    setcomacc('');
    setSelectedAccount('');
    setfollow_up_date('');
    setcomment_status_date('');
    setFollowUpTime('');
    setassigntosales(false);
    setSales_p('');
    set_invoices_paid(false);
    setcomment_status_date('');
    setprevcom(false)
    setcomsec(false);

  };

  const prevcomments = () => {
    setprevcom(!prev_com);
  };

  const handleEditClick = (account: string) => {
    setIsEdit(!Edit);
    setprevcom(false);
    setacc(account)

  };

  const updatePromisedDate = (date: string) => {
    setdate(date)
  };

  const updateName = (Name: string) => {
    setName(Name)
  };

  const [credit_period, setcredit_period] = useState<number | null>(null)
  const updatecredit_period = (credit_period: number | null) => {
    setcredit_period(credit_period)
  };

  const updateNum = (Num: string) => {
    setNum(Num)
  };

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



  const handleSubmit = async (account: string) => {
    console.log('Form submitted');
    // Add more logs to inspect the form elements and values
    if (Name || credit_period || Num || Object.keys(invoiceSalesPersons).length > 0) {
      try {
        let customerUpdateSuccess = false;
  
        // Update customer details
        const response = await fetch('http://159.89.160.186/api/create_customer_name/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoice: account,
            user: id,
            name: Name || null,
            phone_number: Num || null,
            credit_period: credit_period,
          }),
        });
  
        if (response.ok) {
          console.log('Promised details updated successfully');
          customerUpdateSuccess = true;
        } else {
          console.error('Failed to update promised details');
        }
  
        // If invoiceSalesPersons is not empty, update sales persons for invoices
        if (Object.keys(invoiceSalesPersons).length > 0) {
          const salesData = Object.entries(invoiceSalesPersons);
          const salesResponse = await fetch('http://159.89.160.186/api/invoice_sales_p/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id : id,
              sales_Data: salesData
            }),
          });
          if (salesResponse.ok) {
            console.log('Sales persons for invoices updated successfully');
          } else {
            console.error('Failed to update sales persons for invoices');
          }
        }
  
        // If customer update was successful, proceed with other actions
        if (customerUpdateSuccess) {
          setdate(null);
          setIsEdit(false);
          setName(null);
          setNum(null);
          setInvoiceSalesPersons({});
          fetchData();
        }
      } catch (error) {
        console.error('Error updating promised details:', error);
      }
    }
  };
  
  const [remarks, setRemarks] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('Select Response');

  const handleRemarksChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedOption(value);

    if (value === "No Response") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setfollow_up_date(formattedDate);
      console.log(formattedDate); // Log the formatted date directly
      setpromised_date('');
      setprom_amount(0.00)
      
      set_invoices_paid(false)
    }
    if (value === "Requested Call Back") {
      set_invoices_paid(false);
    }
    if (value !== 'No Response') {
      setfollow_up_date('')
    setFollowUpTime('');;
    }
  };


  const [prom_amount, setprom_amount] = useState<number>(0.00);
  const handleprom_amountsChange = (amount: number) => {
    setprom_amount(amount);
  };

  const [paid_amount, setpaid_amount] = useState<number>(0.00);
  const handlepaid_amountsChange = (amount: number) => {
    setpaid_amount(amount);
  };

  const [promised_date, setpromised_date] = useState<string>('');
  const handlepromised_updateChange = (date: string) => {
    setpromised_date(date);
    setdate(date);
  };
  
  const handlefollowupdateChange = (date: string) => {
    setfollow_up_date(date);
  };

  const handlecommentpaiddateChange = (date: string) => {
    setcomment_status_date(date);
  };

  const [invoices_paid, set_invoices_paid] = useState<boolean>(false);
  const handleinvoices_paidstatus = () => {
    if (selectedRefNumbers.length > 0) {
      if (invoices_paid == false) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate());
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        setcomment_status_date(`${year}-${month}-${day}`);
      } else {
        setcomment_status_date('')
      }
      set_invoices_paid(!invoices_paid);
      setprom_amount(0.00);
    }
  };

  const [selectedRefNumbers, setSelectedRefNumbers] = useState<string[]>([]);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const handleCheckboxChange = (refNo: string, pendingAmount: number) => {
    console.log(pendingAmount)
    setSelectedRefNumbers((prevSelectedRefNumbers) => {
      if (prevSelectedRefNumbers.includes(refNo)) {
        // If the reference number is already selected, remove it and subtract the amount
        setTotalPendingAmount(() => {
          const updatedTotal = Number(totalPendingAmount) - Number(pendingAmount);
          return parseFloat(updatedTotal.toFixed(2));
        });
        return prevSelectedRefNumbers.filter((number) => number !== refNo);
      } else {
        // If the reference number is not selected, add it and add the amount
        setTotalPendingAmount(() => {
          const updatedTotal = Number(totalPendingAmount) + Number(pendingAmount);
          return parseFloat(updatedTotal.toFixed(2));
        });
        return [...prevSelectedRefNumbers, refNo];
      }
    });
  };
  
  const [assigntosales, setassigntosales] = useState<boolean>(false)
  const handleAssigntsales = () => {
    setassigntosales(!assigntosales);
  };
  const selectedRefNumbersString = selectedRefNumbers.join(', ');

  const create_commentt = async (account: string, invoice_list: string, remarks: string, prom_amount: number, follow_up_date:string, sales:string, paymentdate: string, invoices_paid: boolean, followUpTime: string, comment_status_date: string, invoices_paid_amount : number) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    // Add more logs to inspect the form elements and values
    const salesPersonKey = Object.keys(salesPersonMapping)
    .find((key) => salesPersonMapping[Number(key)] === sales);
    if (selectedOption && selectedOption !== 'other') {
      remarks = `${selectedOption}. ${remarks}`;
    }
    if (selectedOption && selectedOption == 'No Response' || selectedOption == 'Requested Call Back') {
      prom_amount = 0.00
    }

    if (account) {
      try {
        const response = await fetch('http://159.89.160.186/api/create-comment/', {
          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user : id,
            invoice : account,
            date : `${year}-${month}-${day}`,
            invoice_list : invoice_list || null,
            remarks : remarks || selectedOption,
            amount_promised: prom_amount || totalPendingAmount || 0.00,
            sales_person: salesPersonKey || null,
            follow_up_date: follow_up_date || null,
            follow_up_time: followUpTime || null,
            promised_date: paymentdate || null,
            invoices_paid: invoices_paid,
            invoices_paid_date: comment_status_date || null,
            invoices_paid_amount : invoices_paid_amount || totalPendingAmount || 0.00,
          }),
        });
      
        if (response.ok) {
          console.log('Comment created successfully');
          backcomsec(account)
        } else {
          console.error('Failed to create comment');
        }
      } catch (error) {
        console.error('Error creating comment:', error);
      }
      
      handleSubmit(account);

    }
  };

  const handleInvoicePaidStatusChange = async (invoice: InvoiceDetail) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    const todayDate = `${year}-${month}-${day}`;
  
    try {
      const response = await fetch('http://159.89.160.186/api/invoice_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user : id,
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
    <div className='flex w-screen bg-gray-100 h-screen justify-between  items-center'>
        <Sidebar current_page='Home' />
        <HeadBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} pagename='Home' />
        <div className="flex pl-3 flex-col w-full h-full items-center pt-20 pb-10 text-black space-y-8">
          <div id='comment_box' className={`fixed flex w-auto h-full overflow-y-auto no-scrollbar p-24 ${comsec ? 'opacity-100' : 'invisible'}`}>
            <div className='flex flex-col overflow-y-auto no-scrollbar bg-white w-full h-full border border-black rounded-xl p-2 space-y-4'>
              <div className='flex h-12 w-full items-center justify-between'>
                <button className='border border-black rounded-xl p-2' onClick={() => backcomsec(selectedAccount)}>Cancel</button>
                <div className='flex space-x-4 w-auto h-auto items-center justify-center'>
                  <button className='border border-black rounded-xl p-2' onClick={() => prevcomments()}>{prev_com ?("Back") : ("Previous Comments")}</button>

                </div>
              </div>
              {prev_com ? 
                (
                <div className='flex w-full h-auto'>
                  <table className="table-auto w-full border-collapse border border-gray-400">
                    <thead>
                      <tr>
                        <th className="text-center border border-gray-400 p-2">Date</th>
                        <th className="text-center border border-gray-400 p-2">Invoices</th>
                        <th className="text-center border border-gray-400 p-2">Remarks</th>
                        <th className="text-center border border-gray-400 p-2">Amount_Promised</th>
                        <th className="text-center border border-gray-400 p-2">Follow_up_date</th>
                        <th className="text-center border border-gray-400 p-2">Promised_date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comdata.map((comment: CommentInfo) => (
                        <tr key={comment.id}>
                          <td className="text-center border border-gray-400 p-2">{comment.date}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.invoice_list}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.remarks}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.amount_promised}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.follow_up_date}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.promised_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='flex flex-col w-full h-auto space-y-3'>
                  {accountInfo.map((account) => (
                  selectedAccount === account.account && (
                    <div className='font-bold text-xl flex'><div>Account : {selectedAccount}, Total_Due: {account.total_due} </div></div>
                  )))}
                  <div className='container border border-black w-full h-80 p-2 space-y-2 overflow-y-auto no-scrollbar'>
                    {accountInfo.map((account) => (
                      selectedAccount === account.account && (
                        <div key={account.id}>

                            <table className="table-auto w-full border-collapse border border-gray-400">
                              <thead>
                                <tr>
                                  <th className="text-center border border-gray-400 p-2">Select</th>
                                  <th className="text-center border border-gray-400 p-2">Ref No</th>
                                  <th className="text-center border border-gray-400 p-2">Date</th>
                                  <th className="text-center border border-gray-400 p-2">Days Passed</th>
                                  <th className="text-center border border-gray-400 p-2">Pending</th>
                                  <th className="text-center border border-gray-400 p-2">Sales Person</th>

                                </tr>
                              </thead>
                              <tbody>
                              {account.invoice_details.map((invoice: InvoiceDetail) => (
                                <tr key={invoice.id}>
                                <td className="text-center border border-gray-400 p-2">
                                  <input
                                    type="checkbox"
                                    id={invoice.ref_no}
                                    checked={selectedRefNumbers.includes(invoice.ref_no)}
                                    onChange={() => handleCheckboxChange(invoice.ref_no, invoice.pending)}
                                  />
                                </td>
                                <td className="text-center border border-gray-400 p-2">{invoice.ref_no}</td>
                                <td className="text-center border border-gray-400 p-2">{invoice.date}</td>
                                <td className="text-center border border-gray-400 p-2">{invoice.days_passed}</td>
                                <td className="text-center border border-gray-400 p-2">{invoice.pending}</td>
                                <td className="text-center border border-gray-400 p-2">{salesPersonMapping[invoice.sales_person]}</td>
                                </tr>
                              ))}
                              </tbody>
                            </table>
                          
                        </div>
                      )
                    ))}
                  </div>
                  <div className='flex space-x-4'>
                    <div className='font-bold underline'>Selected Reference Numbers:</div>
                    <div>{selectedRefNumbersString}</div>
                  </div>
                  <div className='flex h-13 space-x-3 w-full items-center'>
                    <div className='font-bold underline'>Remarks:</div>
                    <select id='remarks' onChange={handleRemarksChange} value={selectedOption} className='bg-white border border-black'>
                      <option value="Select Response" disabled>Select Response</option>
                      <option value="No Response">No Response</option>
                      <option value="Requested Call Back">Requested Call Back</option>
                      <option value="other">Other</option>
                    </select>
                    {selectedOption != 'Select Response' && (
                      <textarea
                        id='remarks'
                        onChange={(event) => setRemarks(event.target.value)}
                        className='w-10/12 pl-1 bg-white border border-black'
                        placeholder="Enter other remarks..."
                      />
                    )}
                  </div>
                  <div className='flex h-13 space-x-3 w-64 items-center justify-between'>
                    <div className='font-bold underline'>Amount_Promised:</div>
                    <input disabled = {(selectedOption != 'other') || selectedRefNumbers.length === 0} id='amount_promised' placeholder={`${totalPendingAmount}`} type='number' onChange={(e) => handleprom_amountsChange(Number(e.target.value))} className='bg-white w-10/12 pl-1 border border-black'></input>
                  </div>
                  <div className='flex h-13 space-x-3 w-full items-center'>
                    <div className='font-bold underline'>Follow_up Date: </div>
                    {selectedOption=='No Response' ? <div>{follow_up_date}</div>: (
                      <input className='h-7 w-32 border border-gray-300 text-black rounded-xl justify-center text-center' disabled={invoices_paid == true} value={follow_up_date} onChange={(e) => handlefollowupdateChange(e.target.value)} type="date"/>
                    )}
                    <div className='font-bold underline'>Follow_up Time: </div>
                    <input 
                      type="time" 
                      value={followUpTime} 
                      onChange={(e) => setFollowUpTime(e.target.value)} 
                      placeholder="Follow Up Time" 
                    />
                  </div>
                  <div className='flex h-13 space-x-3 w-full items-center' >
                    <div className='font-bold underline'>Assign To Sales Person: </div>
                    <input
                      type="checkbox"
                      checked={assigntosales}
                      onChange={() => handleAssigntsales()}
                      disabled = {(selectedOption === 'No Response' || selectedOption === 'Requested Call Back') || invoices_paid == true}
                    />
                    {assigntosales && (
                    <select value={Sales_p} onChange={(e) => handleSales_PChange(e)} className='w-48 pl-1 bg-white border border-black'>
                      <option value="">Select Sales Person</option> {/* Deselection option */}
                      {sales.map((person, index) => (
                        <option key={index} value={person}>{person}</option>
                      ))}
                    </select>
                    )}
                  </div>

                  <div className='flex h-13 space-x-3 w-full items-center'>
                    <div className='font-bold underline'>Promised Payment Date: </div>
                    <input className='h-7 w-32 border border-gray-300 text-black rounded-xl justify-center text-center' disabled = {selectedOption === 'No Response' || invoices_paid == true} value={promised_date} onChange={(e) => handlepromised_updateChange(e.target.value)} type="date"/>
                  </div>
                  
                  <div className='flex h-13 space-x-3 w-full items-center' >
                    <div className='font-bold underline'>Paid:</div>
                    <input
                      type="checkbox"
                      checked={invoices_paid}
                      onChange={() => handleinvoices_paidstatus()}
                    />
                    {invoices_paid && ( <input className='h-7 w-32 border border-gray-300 text-black rounded-xl justify-center text-center' value={comment_status_date} onChange={(e) => handlecommentpaiddateChange(e.target.value)} type="date"/>)}
                    {invoices_paid && ( <input disabled = {selectedRefNumbers.length === 0} id='paid_amount' placeholder={`${totalPendingAmount}`} type='number' onChange={(e) => handlepaid_amountsChange(Number(e.target.value))} className='bg-white w-40 pl-1 border border-black'></input>)}
                  </div>

                  {!prev_com && (<div>
                    {(comacc && (selectedOption != 'Select Response') && (selectedRefNumbers.length>0) && (invoices_paid || follow_up_date || promised_date)) ? (<button onClick={() => create_commentt(comacc, selectedRefNumbersString, remarks, prom_amount,follow_up_date, Sales_p, promised_date, invoices_paid, followUpTime, comment_status_date, paid_amount)} className='rounded-xl p-2 bg-blue-500 text-white' >Submit</button>) : (<button className='border border-black rounded-xl p-2'>Submit</button>)}
                  </div>)}
                  
                </div>
              )}
            </div>
          </div> 

          <div className={`container space-y-8 bg-gray-300 w-screen overflow-auto border border-gray-400 rounded-xl py-2`}>
            <div className='flex flex-col space-y-3'>
              <div className="flex text-sm justify-around w-full font-bold">
                <div className="flex h-auto w-32 items-center justify-center underline">Account</div>
                <div className='flex flex-col w-32 items-center justify-center space-y-1'>
                  <div>Name</div>
                  <div>(Phone Number)</div>
                </div>
                <div className="flex h-auto w-28 items-center justify-center">Credit Period</div>
                <div className="flex h-auto w-28 items-center justify-center">Total Due</div>
                <div className="flex h-auto w-28 items-center justify-center">Over Due</div>
                <div className="flex h-auto w-28 items-center justify-center">Invoices</div>
                <div className="flex h-auto w-28 items-center justify-center">Prom Amount</div>
                <div className="flex h-auto w-32 items-center justify-center">Prom Date</div>
                <div className='flex h-auto w-32 items-center justify-center'>Edit</div>
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
                      {!Edit && (
                        <div className='flex flex-col h-24 overflow-y-auto no-scrollbar space-y-3'>
                          {account.names.map((Name: Each_Account_Name_List) => (
                            <div >
                              <div>
                                  {Name.name}
                              </div>
                              <div>
                                  ({Name.phone_number})
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {Edit && acc === account.account && (
                        <div className='flex flex-col items-center justify-center space-y-2 h-auto'>
                          <input
                            className='w-28 h-7 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                            type="text"
                            onChange={(e) => updateName(e.target.value)}
                            placeholder='Name'
                          />
                          <input
                            className=' h-7 w-36 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                            type="text"
                            maxLength={10}
                            onChange={(e) => updateNum(e.target.value)}
                            placeholder='Phone Number'
                          />
                        </div>
                      )}

                    </div>
                    <div className="flex h-auto w-28 justify-center items-center">
                      {Edit && acc === account.account ? (
                        <div>
                          <input
                            className='w-28 h-7 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                            type="number"
                            onChange={(e) => updatecredit_period(Number(e.target.value))}
                            placeholder='credit'
                          />
                        </div>
                        ) : (
                        <div>{account.credit_period}</div>
                      )}
                      </div>
                    <div className="flex h-auto w-28 justify-center items-center">{account.total_due}</div>
                    <div className="flex h-auto w-28 justify-center items-center">{account.over_due}</div>
                    <div className="flex h-auto w-28 justify-center items-center">{account.invoices}</div>
                    <div className="flex h-auto w-28 justify-center items-center">
                        {account.promised_amount}
                    </div>
                    <div className='flex h-auto w-32 items-center justify-center'>
                        <div>                          
                          {account.promised_date ? (
                            <div>{account.promised_date}</div>
                          ) : (
                            <div>00-00-0000</div>
                          )}
                        </div>
                    </div>
                    <div className='w-32 flex justify-center items-center'>
                      {Edit && acc===account.account ? (
                        <div className='text-md flex flex-col  justify-center items-center space-y-1'>
                          <div onClick={() => handleEditClick(account.account)}>Cancel</div>
                          <div onClick={() => handleSubmit(account.account)}>Confirm</div>
                        </div>
                        ) : (
                          <div className='flex w-16 justify-between'>
                            <FontAwesomeIcon icon={faPencil} className='w-5 h-6' onClick={() => handleEditClick(account.account)}/>
                            <FontAwesomeIcon icon={faSquarePlus} className='w-6 h-6' onClick={() => updateCommentSection(account.account)}/>
                          </div>
                      )}
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

export default Home;
