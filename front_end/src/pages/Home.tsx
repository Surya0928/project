import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import { AccountInfo, InvoiceDetail, CommentInfo } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil , faSquarePlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';


const Home: React.FC = () => {
  const history = useHistory();
  const [accountInfo, setAccountInfo] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [date, setdate] = useState<string | null>(null);
  const [Amount, setAmount] = useState<number | null>(null);
  const [Name, setName] = useState<string | null>(null);
  const [Num, setNum] = useState<string | null>(null);
  const [Sales_p, setSales_p] = useState<string | null>(null);
  const [Edit, setIsEdit] = useState(false)
  const [acc, setacc] = useState<string | null>(null);
  const [comsec, setcomsec] = useState(false);
  const [comacc, setcomacc] = useState<string>('');
  const [prev_com, setprevcom] = useState(false)
  const [comdata, setcomdata] = useState<CommentInfo[]>([]);


  const fetchData = async () => {
    try {
      const response = await fetch('http://165.232.188.250:80800/invoices/');
      if (response.ok) {
        const data = await response.json();
        setAccountInfo(data);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
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

  const updateCommentSection = (account: string) => {
    setcomsec(!comsec);
    setcomacc(account);
    setSelectedAccount(account);
    console.log(account)
  };

  const backcomsec = (account: string) => {
    setprevcom(false)
    setRemarks('');
    setSelectedRefNumbers([]);
    setsales_date('');
    setsales_follow_msg('');
    setsales_follow_response('');
    setdate('');
    setprom_amount(0);
    setcomsec(false);
    setcomacc('');
    setSelectedAccount('');

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

  const updatePromisedAmount = (amount: number) => {
    setAmount(amount)
  };
  
  const updateName = (Name: string) => {
    setName(Name)
  };

  const updateNum = (Num: string) => {
    setNum(Num)
  };

  const updateSales_p = (Sales_p: string) => {
    setSales_p(Sales_p)
  };

  const handleAccountClick = (account: string) => {
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
    if (date || Amount !== null || Name || Num || Sales_p) {
      try {
        const response = await fetch('http://165.232.188.250:80800/update-customer/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account,
            promised_amount: Amount,
            promised_date: date,
            name: Name,
            sales_person: Sales_p,
            phone_number: Num
          }),
        });
      
        if (response.ok) {
          console.log('Promised details updated successfully');
        } else {
          console.error('Failed to update promised details');
        }
      } catch (error) {
        console.error('Error updating promised details:', error);
      }
      setAmount(null);
      setdate(null);
      setIsEdit(false);
      setName(null);
      setNum(null);
      setSales_p(null);
      fetchData();
    }
  };

  const [remarks, setRemarks] = useState<string>('');
  const handleRemarksChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRemarks(event.target.value);
  };

  const [prom_amount, setprom_amount] = useState<number>(0.00);
  const handleprom_amountsChange = (amount: number) => {
    setprom_amount(amount);
    setAmount(amount);
  };

  const [sales_follow_msg, setsales_follow_msg] = useState<string>('');
  const handlesalesmessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setsales_follow_msg(event.target.value);
  };

  const [sales_follow_response, setsales_follow_response] = useState<string>('');
  const handlesalesresponseChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setsales_follow_response(event.target.value);
  };

  const [sales_date, setsales_date] = useState<string>('');
  const handlesalesupdateChange = (date: string) => {
    setsales_date(date);
    setdate(date);
  };

  const [selectedRefNumbers, setSelectedRefNumbers] = useState<string[]>([]);
  const handleCheckboxChange = (refNo: string) => {
    setSelectedRefNumbers((prevSelectedRefNumbers) => {
      if (prevSelectedRefNumbers.includes(refNo)) {
        // If the reference number is already selected, remove it
        return prevSelectedRefNumbers.filter((number) => number !== refNo);
      } else {
        // If the reference number is not selected, add it
        return [...prevSelectedRefNumbers, refNo];
      }
    });
  };
  const selectedRefNumbersString = selectedRefNumbers.join(', ');

  const create_commentt = async (account: string, invoice_list: string, remarks: string, prom_amount: number, msg: string, resp: string, update: string) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if necessary
    // Add more logs to inspect the form elements and values
    if (account && invoice_list) {
      try {
        const response = await fetch('http://165.232.188.250:80800/create-comment/', {
          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoice : account,
            date : `${year}-${month}-${day}`,
            invoice_list : invoice_list,
            remarks : remarks,
            amount_promised: prom_amount,
            sales_follow_msg: msg,
            sales_follow_response : resp,
            promised_date: update,
            
          }),
        });
      
        if (response.ok) {
          console.log('Comment created successfully');
        } else {
          console.error('Failed to create comment');
        }
      } catch (error) {
        console.error('Error creating comment:', error);
      }
      
      fetchData();
      setprevcom(true);
      handleSubmit(account);

    }
  };

  const handlePaidStatusChange = async (comment: CommentInfo) => {
    try {
      const response = await fetch('http://165.232.188.250:80800/comment_paid/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: comment.id,
          paid_status: !comment.paid,
        }),
        
      });
      console.log(comment.id, !comment.paid)
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
      {/* <div className='fixed left-0 pt-12 top-0 h-screen w-20 bg-blue-500 '>
        <div className='container flex flex-col space-y-4 items-center justify-center'>
          <FontAwesomeIcon icon={faUser} className='w-5 h-5 text-blue-500 bg-black' />
        </div>
      </div> */}
      <div className="flex flex-col w-screen h-full items-center pb-10 text-black">
        <div id='comment_box' className={`fixed flex w-full h-full overflow-y-auto p-24 ${comsec ? 'opacity-100' : 'invisible'}`}>
          <div className='flex flex-col overflow-y-auto bg-white w-full h-full border border-black rounded-xl p-2 space-y-4'>
            <div className='flex h-12 w-full items-center justify-between'>
              <button className='border border-black rounded-xl p-2' onClick={() => backcomsec(selectedAccount)}>Cancel</button>
              <div className='flex space-x-4 w-auto h-auto items-center justify-center'>
                <button className='border border-black rounded-xl p-2' onClick={() => prevcomments()}>{prev_com ?("Back") : ("Previous Comments")}</button>

                {!prev_com && (<div>
                  {(comacc && remarks) ? (<button onClick={() => create_commentt(comacc, selectedRefNumbersString, remarks, prom_amount,sales_follow_msg, sales_follow_response, sales_date)} className='border border-black rounded-xl p-2' >Create</button>) : (<button className='border border-black rounded-xl p-2'>Create</button>)}
                </div>)}
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
                      <th className="text-center border border-gray-400 p-2">Sales_msg</th>
                      <th className="text-center border border-gray-400 p-2">Sales_response</th>
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
                        <td className="text-center border border-gray-400 p-2">{comment.sales_follow_msg}</td>
                        <td className="text-center border border-gray-400 p-2">{comment.sales_follow_response}</td>
                        <td className="text-center border border-gray-400 p-2">{comment.promised_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='flex flex-col w-full h-auto space-y-3'>
                <div className='font-bold text-xl'>Account : {selectedAccount}</div>
                <div className='container border border-black w-full h-80 p-2 space-y-2 overflow-y-auto'>
                  {accountInfo.map((account) => (
                    selectedAccount === account.account && (
                      <div key={account.id}>
                        {account.invoice_details.map((invoice: InvoiceDetail) => (
                          <div key={invoice.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={invoice.ref_no}
                              checked={selectedRefNumbers.includes(invoice.ref_no)}
                              onChange={() => handleCheckboxChange(invoice.ref_no)}
                            />
                            <label htmlFor={invoice.ref_no} className="ml-2">{invoice.ref_no}</label>
                          </div>
                        ))}
                      </div>
                    )
                  ))}
                </div>
                <div className='flex space-x-4'>
                  <div className='font-bold underline'>Selected Reference Numbers:</div>
                  <div>{selectedRefNumbersString}</div>
                </div>
                <div className='flex h-13 space-x-3 w-full items-center justify-between'>
                  <div className='font-bold underline'>Remarks:</div>
                  <textarea id='remarks' onChange={handleRemarksChange} value={remarks} className='w-10/12 pl-1 bg-white border border-black'></textarea>
                </div>
                <div className='flex h-13 space-x-3 w-full items-center justify-between'>
                  <div className='font-bold underline'>Amount_Promised:</div>
                  <input id='amount_promised' type='number' onChange={(e) => handleprom_amountsChange(Number(e.target.value))} className='bg-white w-10/12 pl-1 border border-black'></input>
                </div>
                <div className='flex h-13 space-x-3 w-full items-center justify-between'>
                  <div className='font-bold underline'>Sales Message:</div>
                  <textarea id='sales_message' onChange={handlesalesmessageChange} value={sales_follow_msg} className='w-10/12 bg-white pl-1 border border-black'></textarea>
                </div>
                <div className='flex h-13 space-x-3 w-full items-center justify-between'>
                  <div className='font-bold underline'>Sales Response:</div>
                  <textarea id='sales_response' onChange={handlesalesresponseChange} value={sales_follow_response} className='w-10/12 bg-white pl-1 border border-black'></textarea>
                </div>
                <div className='flex h-13 space-x-3 w-full items-center'>
                  <div className='font-bold underline'>Promised Date: </div>
                  <input className='h-7 w-32 border border-gray-300 text-black rounded-xl justify-center text-center' value={sales_date} onChange={(e) => handlesalesupdateChange(e.target.value)} type="date"/>
                </div>
                
              </div>
            )}
          </div>
        </div>
        <HeadBar />
        <div className={`container space-y-8 bg-gray-300 w-screen py-4 overflow-auto border border-gray-400 rounded-xl `} style={{ marginTop: '80px' }}>
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
              <div className='flex h-auto w-32 items-center justify-center'>Edit</div>
            </div>
            <div className='container w-full border border-gray-500'></div>
          </div>
          {/* Display list of accounts */}
          {accountInfo.map((account) => (
            <div key={account.id} className="cursor-pointer">
              <div className='flex flex-col h-32 justify-between'>
                <div className="flex text-sm justify-around w-full">
                  <div className="flex w-32 items-center justify-center font-bold underline" onClick={() => handleAccountClick(account.account)}>{account.account}</div>
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
                  <div className="flex h-auto w-28 justify-center items-center">{account.total_due}</div>
                  <div className="flex h-auto w-28 justify-center items-center">{account.over_due}</div>
                  <div className="flex h-auto w-28 justify-center items-center">{account.invoices}</div>
                  <div className="flex h-auto w-28 justify-center items-center">
                    {Edit && acc===account.account ? (
                      <input
                        className='h-7 w-28 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                        type="number"
                        name="promisedAmount"
                        onChange={(e) => updatePromisedAmount(Number(e.target.value))}
                        placeholder='Amount'
                      />
                    ) : (
                      account.promised_amount
                    )}
                  </div>
                  <div className='flex h-auto w-32 items-center justify-center'>
                    {Edit && acc===account.account ? (
                      <input
                        className='h-7 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                        type="date"
                        onChange={(e) => updatePromisedDate(e.target.value)}
                      />
                    ) : (
                      <div>                          
                        {account.promised_date ? (
                          <div>{account.promised_date}</div>
                        ) : (
                          <div>00-00-0000</div>
                        )}
                      </div>
                    )}
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
                        <th className="text-center border border-gray-400 p-2">Sales_Person</th>
                      </tr>
                    </thead>
                    <tbody>
                        <tr >
                          <td className="text-center border border-gray-400 p-2">{account.optimal_due}</td>
                          <td className="text-center border border-gray-400 p-2">{account.threshold_due}</td>
                          <td className="text-center border border-gray-400 p-2">{account.over_due}</td>
                          <td className="text-center border border-gray-400 p-2">
                            {Edit && acc===account.account ? (
                              <input
                                className=' h-7 w-36 border border-gray-500 bg-gray-300 rounded-xl justify-center text-center'
                                type="text"
                                onChange={(e) => updateSales_p(e.target.value)}
                              />
                              ) : (
                                account.sales_person
                            )}
                          </td>
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
                        <th className="text-center border border-gray-400 p-2">Sales_msg</th>
                        <th className="text-center border border-gray-400 p-2">Sales_response</th>
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
                          <td className="text-center border border-gray-400 p-2">{comment.sales_follow_msg}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.sales_follow_response}</td>
                          <td className="text-center border border-gray-400 p-2">{comment.promised_date}</td>
                          <td className="text-center border border-gray-400 p-2">
                          <input
                            type="checkbox"
                            checked={comment.paid}
                            onChange={() => handlePaidStatusChange(comment)}
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

export default Home;
