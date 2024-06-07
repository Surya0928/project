import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { DataByDate,Data_by_Day, AccountInfo, InvoiceDetail, CommentInfo, SalesPerson } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil , faSquarePlus} from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';


const To_DO: React.FC = () => {
  const history = useHistory();
  const {user_id, username} =useAppContext();
  const [accountInfo, setAccountInfo] = useState<AccountInfo[]>([]);
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
  const [fullData, setFullData] = useState<DataByDate>({});
  const [followUpTime, setFollowUpTime] = useState<string>(''); 
  
  
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
        setFullData(data['full_data']);
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


  const updateCommentSection = (account: string, date: string) => {
    setcomsec(!comsec);
    setcomacc(account);
    setSelectedAccount(account);
    const selectedAccount = fullData[date].find(info => info.account === account);
    // console.log(selectedAccount?.comments)
    
    // If the account is found, get its comments
    if (selectedAccount) {
      const filteredComments = selectedAccount?.comments;
      // console.log(filteredComments, 1)
      setcomdata(filteredComments);
      // Now you can use the filteredComments array as needed
    }
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
    setcomacc('');
    setSelectedAccount('');
    setfollow_up_date('');
    setFollowUpTime('');
    setassigntosales(false);
    setSales_p('');
    setprevcom(false)
    setcomsec(false);
  };

  const prevcomments = () => {
    setprevcom(!prev_com);
  };
  
  const updateName = (Name: string) => {
    setName(Name)
  };

  const updateNum = (Num: string) => {
    setNum(Num)
  };

  const handleAccountClick = (account: string, date : string) => {
    // console.log(salesPersonMapping)
    setSelectedAccount(prevAccount => prevAccount === account ? '' : account);
    
    // Find the account from accountInfo variable
    const selectedAccount = fullData[date].find(info => info.account === account);
    // console.log(selectedAccount?.comments)
    
    // If the account is found, get its comments
    if (selectedAccount) {
      const filteredComments = selectedAccount?.comments;
      // console.log(filteredComments, 1)
      setcomdata(filteredComments);
      // Now you can use the filteredComments array as needed
    }
  };



  const handleSubmit = async (account: string) => {
    console.log('Form submitted');
    // Add more logs to inspect the form elements and values
    if (date || Amount !== null || Name || Num || Object.keys(invoiceSalesPersons).length > 0) {
      try {
        let customerUpdateSuccess = false;
  
        // Update customer details
        const response = await fetch('http://165.232.188.250:8080/update-customer/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account,
            user: user_id,
            promised_amount: Amount,
            promised_date: date || null,
            name: Name,
            phone_number: Num
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
          const salesResponse = await fetch('http://165.232.188.250:8080/invoice_sales_p/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id : user_id,
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
          setAmount(null);
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
      setTotalPendingAmount(0)
      setprom_amount(0.00)
      
      set_invoices_paid(false)
    }
    if (value === "Requested Call Back") {
      setTotalPendingAmount(0);
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
    setAmount(amount);
  };

  const [promised_date, setpromised_date] = useState<string>('');
  const handlepromised_updateChange = (date: string) => {
    setpromised_date(date);
    setdate(date);
  };
  
  const handlefollowupdateChange = (date: string) => {
    setfollow_up_date(date);
  };

  const [invoices_paid, set_invoices_paid] = useState<boolean>(false);
  const handleinvoices_paidstatus = () => {
    if (selectedRefNumbers.length > 0) {
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

  const create_commentt = async (account: string, invoice_list: string, remarks: string, prom_amount: number, follow_up_date:string, sales:string, paymentdate: string, invoices_paid: boolean, followUpTime: string) => {
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
        const response = await fetch('http://165.232.188.250:8080/create-comment/', {
          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user : user_id,
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
          }),
        });
      
        if (response.ok) {
          console.log('Comment created successfully');
          setTotalPendingAmount(0);
          setSelectedOption('Select Response');
          setRemarks('');
          setSelectedRefNumbers([]);
          setpromised_date('');
          setdate('');
          setprom_amount(0);
          setcomacc('');
          setSelectedAccount('');
          setfollow_up_date('')
          setFollowUpTime('');
          setassigntosales(false);
          setSales_p('');
          fetchData();
          setcomsec(false);
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
    <div className='flex w-screen justify-between  items-center'>
      <Sidebar current_page='To_Do' />
      <HeadBar />
      <div className="flex flex-col w-screen h-full items-center pb-10 text-black space-y-8">
        <div id='comment_box' className={`fixed flex w-full h-full overflow-y-auto p-24 ${comsec ? 'opacity-100' : 'invisible'}`}>
          <div className='flex flex-col overflow-y-auto bg-white w-full h-full border border-black rounded-xl p-2 space-y-4'>
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
              {Object.entries(fullData).map(([date, accounts]) => (
                <div id={date}>
                  {accounts.map((account : AccountInfo) => (
                  selectedAccount === account.account && (
                    <div className='font-bold text-xl flex'><div>Account : {selectedAccount} </div>{account.name && ( <div>, Name : {account.name}</div>)} {account.phone_number && (<div>, Number: {account.phone_number}</div>)}<div>, Total_Due: {account.total_due}</div></div>
                  )))}
                </div>
              ))}
                <div className='container border border-black w-full h-80 p-2 space-y-2 overflow-y-auto'>
                {Object.entries(fullData).map(([date, accounts]) => (
                  <div id={date}>
                    {accounts.map((account : AccountInfo) => (
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
                    disabled = {selectedOption === ('No Response' || 'Requested Call') || selectedRefNumbers.length == 0}
                  />
                </div>

                {!prev_com && (<div>
                  {(comacc && (selectedOption != 'Select Response') && (selectedRefNumbers.length>0) && (invoices_paid || follow_up_date || promised_date)) ? (<button onClick={() => create_commentt(comacc, selectedRefNumbersString, remarks, prom_amount,follow_up_date, Sales_p, promised_date, invoices_paid, followUpTime)} className='rounded-xl p-2 bg-blue-500 text-white' >Submit</button>) : (<button className='border border-black rounded-xl p-2'>Submit</button>)}
                </div>)}
                
              </div>
            )}
          </div>
        </div> 

        
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
        {Object.entries(fullData).map(([date, accounts]) => (

          <div>
            <div className='flex flex-col w-auto h-auto space-y-4'>
              <div className='pl-2 text-xl font-bold'>{date}</div>
              <div className={`container space-y-8 bg-gray-300 w-screen overflow-auto border border-gray-400 rounded-xl py-2`}>
                <div className='flex flex-col space-y-3'>
                  <div className="flex text-sm justify-around w-full font-bold">
                    <div className="flex h-auto w-32 items-center justify-center underline">Account</div>
                    <div className='flex flex-col w-32 items-center justify-center space-y-1'>
                      <div>Name</div>
                      <div>(Phone Number)</div>
                    </div>
                    <div className="flex h-auto w-32 items-center justify-center">Selected Invoices</div>
                    <div className="flex h-auto w-28 items-center justify-center">Invoice Amount</div>
                    <div className="flex h-auto w-28 items-center justify-center">Follow Up Date</div>
                    <div className="flex h-auto w-28 items-center justify-center">Prom Date</div>
                    <div className="flex h-auto w-32 items-center justify-center">Sales Person</div>
                    <div className='flex h-auto w-28 items-center justify-center'>Edit</div>
                  </div>
                  <div className='container w-full border border-gray-500'></div>
                </div>
                {/* Display list of accounts */}
                {accounts.map((account : Data_by_Day) => (
                  <div key={account.id} className="cursor-pointer">
                    <div className='flex flex-col h-32 justify-between'>
                      <div className="flex text-sm justify-around w-full">
                        <div className="flex w-32 items-center justify-center font-bold underline" onClick={() => handleAccountClick(account.account, date)}>{account.account}</div>
                        <div className='flex flex-col w-32 items-center justify-center space-y-1'>
                          <div>
                            {Edit && acc===account.account ? (
                              <input
                                className='w-28 h-7 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                                type="text"
                                onChange={(e) => updateName(e.target.value)}
                                placeholder='Name'
                              />
                            ) : (
                              account.name
                            )}
                          </div>
                          <div>
                            {Edit && acc===account.account ? (
                              <input
                                className=' h-7 w-36 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                                type="text"
                                maxLength={10}
                                onChange={(e) => updateNum(e.target.value)}
                                placeholder='Phone Number'
                              />
                            ) : (
                              account.phone_number
                            )}
                          </div>
                        </div>
                        <div className="flex h-auto w-32 justify-center items-center">{account.invoice_list}</div>
                        <div className="flex h-auto w-28 justify-center items-center">{account.promised_amount}</div>
                        <div className="flex h-auto w-28 justify-center items-center">{account.follow_up_date}</div>
                        <div className="flex h-auto w-28 justify-center items-center">
                            {account.promised_date}
                        </div>
                        <div className='flex h-auto w-32 items-center justify-center'>
                            {account.sales_person}
                        </div>
                        <div className='w-28 flex justify-center items-center'>
                              <FontAwesomeIcon icon={faSquarePlus} className='w-6 h-6' onClick={() => updateCommentSection(account.account, date)}/>
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
        ))}
      </div>
    </div>
  );
};

export default To_DO;
