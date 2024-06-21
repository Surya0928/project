import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';

interface Accountant {
  id: number;
  username: string;
  password: string;
  address: string;
  role: string;
}

interface NumberData {
  total: string;
  today: string;
  yesterday: string;
  last_seven_days: string;
  this_month: string;
}

interface AmountCollectedInvoiceDetails {
  account: string;
  invoice: string;
  payment_date: string;
  amount: string;
}

interface AmountCollectedAccountDetails {
  today: AmountCollectedInvoiceDetails[];
  yesterday: AmountCollectedInvoiceDetails[];
  last_seven_days: AmountCollectedInvoiceDetails[];
  this_month: AmountCollectedInvoiceDetails[];
}

interface AmountCollectedData {
  amount_collected: NumberData;
  account_details: AmountCollectedAccountDetails;
}

interface AccountsReachedInvoiceDetails {
  account: string;
  invoice: string;
  amount: string;
  remarks: string;
 sales_person: string,
 follow_up_date :string,
 promised_payment_date: string
}

interface AccountsReachedAccountDetails {
  today: AccountsReachedInvoiceDetails[];
  yesterday: AccountsReachedInvoiceDetails[];
  last_seven_days: AccountsReachedInvoiceDetails[];
  this_month: AccountsReachedInvoiceDetails[];
}

interface AccountsReachedData {
  accounts_reached: NumberData;
  account_details: AccountsReachedAccountDetails;
}




const Manager: React.FC = () => {
  const history = useHistory();
  const { user_id, username } = useAppContext();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [selectedAccountant, setSelectedAccountant] = useState<string | null>(null);
  const [projected_collection_filter, setprojected_collection_filter] = useState<string>('all');
  
  const [total_outstanding, setTotalOutstanding] = useState<number>(0);
  const [total_over_due, setTotalOverDue] = useState<number>(0);
  const [projected_collection, setProjectedCollection] = useState<any>({
    projected_all_col: 0,
    projected_this_month_col: 0,
    projected_this_week_col: 0,
    projected_today_col: 0,
  });
  const [projected_amount, setProjectedAmount] = useState<number>(0);
  const [amount_collected, set_amount_collected] = useState<number>(0);
  const [accounts_reached, set_accounts_reached] = useState<number>(0);
  const [amount_collected_filter, setamount_collected_filter] = useState<string>('today');
  const [accounts_reached_filter, setaccounts_reached_filter] = useState<string>('today');
  const [amount_collected_data, setamount_collected_data] = useState<AmountCollectedData | null>(null);
  const [accounts_reached_data, setaccounts_reached_data] = useState<AccountsReachedData | null>(null);
  const [amount_collected_filtered_data, setamount_collected_filtered_data] = useState<AmountCollectedInvoiceDetails[]>([]);
  const [accounts_reached_filtered_data, setaccounts_reached_filtered_data] = useState<AccountsReachedInvoiceDetails[]>([]);
  const [toggle_amount_collected_data, set_toggle_amount_collected_data] = useState<boolean>(false)
  const [toggle_accounts_reached_data, set_toggle_accounts_reached_data] = useState<boolean>(false)


  const fetchAccountants = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/accountants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        setAccountants(data.accountants);
      } else {
        console.error('Failed to fetch accountants data');
      }
    } catch (error) {
      console.error('Error fetching accountants data:', error);
    }
  };

  const fetchSection1Data = async () => {
    try {
      if (!selectedAccountant) return;
      const response = await fetch('http://165.232.188.250:8080/manager_1/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountant: selectedAccountant }),
      });
      if (response.ok) {
        const data = await response.json();
        setTotalOutstanding(data.total_outstanding);
        setTotalOverDue(data.total_over_due);
        setProjectedCollection(data.projected_collection);
        setprojected_collection_filter('all');
        setProjectedAmount(data.projected_collection.projected_all_col);
      } else {
        console.error('Failed to fetch manager data');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };


  const fetchSection2Data = async () => {
    try {
      if (!selectedAccountant) return;
      const response = await fetch('http://165.232.188.250:8080/manager_2/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountant: selectedAccountant }),
      });
      if (response.ok) {
        const data: AccountsReachedData = await response.json();
        setaccounts_reached_data(data);
        set_accounts_reached(parseFloat(data.accounts_reached.today)); // Convert to number if needed
        setaccounts_reached_filtered_data(data.account_details.today);
      } else {
        console.error('Failed to fetch manager data');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };


  const fetchSection3Data = async () => {
    try {
      if (!selectedAccountant) return;
      const response = await fetch('http://165.232.188.250:8080/manager_3/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountant: selectedAccountant }),
      });
      if (response.ok) {
        const data: AmountCollectedData = await response.json();
        setamount_collected_data(data);
        set_amount_collected(parseFloat(data.amount_collected.today)); // Convert to number if needed
        setamount_collected_filtered_data(data.account_details.today);
      } else {
        console.error('Failed to fetch manager data');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };
  

  useEffect(() => {
    if (!user_id) {
      history.push('/');
    }
    fetchAccountants();
  }, [user_id, history]);

  const handleAccountantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value)
    setSelectedAccountant(e.target.value);
  };

  const Enter_Button = () => {
    fetchSection1Data()
    fetchSection2Data()
    fetchSection3Data()
  };

  const handleProjectedCollectionFilterChange = (filter: string) => {
    setprojected_collection_filter(filter);
    switch (filter) {
      case 'all':

        setProjectedAmount(projected_collection.projected_all_col);        
        break;
      case 'this_month':
        setProjectedAmount(projected_collection.projected_this_month_col);
        break;
      case 'this_week':
        setProjectedAmount(projected_collection.projected_this_week_col);
        break;
      case 'today':
        setProjectedAmount(projected_collection.projected_today_col);
        break;
      default:
        break;
    }
  };

  const handleAmountCollectedFilterChange = (filter: string) => {
    setamount_collected_filter(filter);
    if (!amount_collected_data) return;
  
    let filteredData: AmountCollectedInvoiceDetails[] = [];
    let collectedAmount: number = 0;
  
    switch (filter) {
      case 'today':
        collectedAmount = parseFloat(amount_collected_data.amount_collected.today);
        filteredData = amount_collected_data.account_details.today;
        break;
      case 'yesterday':
        collectedAmount = parseFloat(amount_collected_data.amount_collected.yesterday);
        filteredData = amount_collected_data.account_details.yesterday;
        break;
      case 'last_7_days':
        collectedAmount = parseFloat(amount_collected_data.amount_collected.last_seven_days);
        filteredData = amount_collected_data.account_details.last_seven_days;
        break;
      case 'this_month':
        collectedAmount = parseFloat(amount_collected_data.amount_collected.this_month);
        filteredData = amount_collected_data.account_details.this_month;
        break;
      default:
        break;
    }
  
    set_amount_collected(collectedAmount);
    setamount_collected_filtered_data(filteredData);
  };

  const handleAccountsReachedFilterChange = (filter: string) => {
    setaccounts_reached_filter(filter);
    if (!accounts_reached_data) return;
  
    let filteredData: AccountsReachedInvoiceDetails[] = [];
    let collectedAmount: number = 0;
  
    switch (filter) {
      case 'today':
        collectedAmount = parseFloat(accounts_reached_data.accounts_reached.today);
        filteredData = accounts_reached_data.account_details.today;
        break;
      case 'yesterday':
        collectedAmount = parseFloat(accounts_reached_data.accounts_reached.yesterday);
        filteredData = accounts_reached_data.account_details.yesterday;
        break;
      case 'last_7_days':
        collectedAmount = parseFloat(accounts_reached_data.accounts_reached.last_seven_days);
        filteredData = accounts_reached_data.account_details.last_seven_days;
        break;
      case 'this_month':
        collectedAmount = parseFloat(accounts_reached_data.accounts_reached.this_month);
        filteredData = accounts_reached_data.account_details.this_month;
        break;
      default:
        break;
    }
  
    set_accounts_reached(collectedAmount);
    setaccounts_reached_filtered_data(filteredData);
  };
  
  const section2_data = () => {
    if (accounts_reached > 0) {
      set_toggle_accounts_reached_data(!toggle_accounts_reached_data);
    }
    
  };

  const section3_data = () => {
    if (amount_collected > 0) {
      set_toggle_amount_collected_data(!toggle_amount_collected_data);
    }
    
  };
  


  return (
    <div className='flex flex-col items-center overflow-y-auto w-screen h-screen p-14 space-y-20'>
      <div className='flex space-x-4 items-center justify-center'>
        <div className='font-semibold'>Select Accountant:</div>
        <select
          value={selectedAccountant || ''}
          onChange={handleAccountantChange}
          className='px-2 py-1 border border-gray-300 bg-white rounded'
        >
          <option value='' disabled>
            Select an accountant
          </option>
          {accountants.map((accountant) => (
            <option key={accountant.id} value={accountant.id}>
              {accountant.username}
            </option>
          ))}
        </select>
        <button
          onClick={() => Enter_Button()}
          className='px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-700'
        >
          Enter
        </button>
      </div>
      <div id='section-1' className='w-full flex flex-col items-center space-y-4 border border-gray-500 p-5 rounded-xl'>
        <div className='flex space-x-4'>
          <button
            onClick={() => handleProjectedCollectionFilterChange('all')}
            className={`px-4 py-1 rounded ${
              projected_collection_filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleProjectedCollectionFilterChange('this_month')}
            className={`px-4 py-1 rounded ${
              projected_collection_filter === 'this_month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handleProjectedCollectionFilterChange('this_week')}
            className={`px-4 py-1 rounded ${
              projected_collection_filter === 'this_week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleProjectedCollectionFilterChange('today')}
            className={`px-4 py-1 rounded ${
              projected_collection_filter === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Today
          </button>
        </div>
        <div className='flex justify-around space-x-5'>
          <div className='container w-96 text-center py-2 border border-gray-500 rounded-xl'>
            Total Outstanding : {total_outstanding}
          </div>
          <div className='container w-96 text-center py-2 border border-gray-500 rounded-xl'>
            Total Overdue : {total_over_due}
          </div>
          <div className='container w-96 text-center py-2 border border-gray-500 rounded-xl'>
            Projected Collections : {projected_amount}
          </div>
        </div>
      </div>
      <div id='section-2' className='w-full flex flex-col items-center space-y-4 border border-gray-500 p-5 rounded-xl'>
        <div className='flex space-x-4'>
          <button
            onClick={() => handleAccountsReachedFilterChange('today')}
            className={`px-4 py-1 rounded ${
              accounts_reached_filter === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleAccountsReachedFilterChange('yesterday')}
            className={`px-4 py-1 rounded ${
              accounts_reached_filter === 'yesterday' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleAccountsReachedFilterChange('last_7_days')}
            className={`px-4 py-1 rounded ${
              accounts_reached_filter === 'last_7_days' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleAccountsReachedFilterChange('this_month')}
            className={`px-4 py-1 rounded ${
              accounts_reached_filter === 'this_month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
        <div className='flex justify-around space-x-5'>
          <div className={`container w-96 text-center py-2 ${accounts_reached > 0 ? 'hover:bg-green-400' : ''}  rounded-xl cursor-pointer ${toggle_accounts_reached_data && accounts_reached > 0 ? ' bg-gray-300' : 'bg-blue-500 text-white'}`} onClick={() => section2_data()}>
            Accounts Reached : {accounts_reached}
          </div>
        </div>
        {toggle_accounts_reached_data && accounts_reached > 0 && (
          <table className="table-auto w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="text-center border border-gray-400 p-2">Account</th>
                <th className="text-center border border-gray-400 p-2">Invoices</th>
                <th className="text-center border border-gray-400 p-2">Amount</th>
                <th className="text-center border border-gray-400 p-2">Remarks</th>
                <th className="text-center border border-gray-400 p-2">Sales person</th>
                <th className="text-center border border-gray-400 p-2">Follow Up Date</th>
                <th className="text-center border border-gray-400 p-2">Promised Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {accounts_reached_filtered_data.map((item, index) => (
                <tr key={index}>
                  <td className="text-center border border-gray-400 p-2">{item.account}</td>
                  <td className="text-center border border-gray-400 p-2">{item.invoice}</td>
                  <td className="text-center border border-gray-400 p-2">{item.amount}</td>
                  <td className="text-center border border-gray-400 p-2">{item.remarks}</td>
                  <td className="text-center border border-gray-400 p-2">{item.sales_person}</td>
                  <td className="text-center border border-gray-400 p-2">{item.follow_up_date}</td>
                  <td className="text-center border border-gray-400 p-2">{item.promised_payment_date}</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
      <div id='section-3' className='w-full flex flex-col items-center space-y-4 border border-gray-500 p-5 rounded-xl'>
        <div className='flex space-x-4'>
          <button
            onClick={() => handleAmountCollectedFilterChange('today')}
            className={`px-4 py-1 rounded ${
              amount_collected_filter === 'today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleAmountCollectedFilterChange('yesterday')}
            className={`px-4 py-1 rounded ${
              amount_collected_filter === 'yesterday' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => handleAmountCollectedFilterChange('last_7_days')}
            className={`px-4 py-1 rounded ${
              amount_collected_filter === 'last_7_days' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleAmountCollectedFilterChange('this_month')}
            className={`px-4 py-1 rounded ${
              amount_collected_filter === 'this_month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
        <div className='flex justify-around space-x-5'>
          <div className={`container w-96 text-center py-2 ${amount_collected > 0 ? 'hover:bg-green-400' : ''}  rounded-xl cursor-pointer ${toggle_amount_collected_data && amount_collected>0 ? ' bg-gray-300' : 'bg-blue-500 text-white'}`} onClick={() => section3_data()}>
            Amount Collected : {amount_collected}
          </div>
        </div>
        {toggle_amount_collected_data && amount_collected > 0 && (
          <table className="table-auto w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="text-center border border-gray-400 p-2">Account</th>
                <th className="text-center border border-gray-400 p-2">Invoice</th>
                <th className="text-center border border-gray-400 p-2">Paid Date</th>
                <th className="text-center border border-gray-400 p-2">Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              {amount_collected_filtered_data.map((item, index) => (
                <tr key={index}>
                  <td className="text-center border border-gray-400 p-2">{item.account}</td>
                  <td className="text-center border border-gray-400 p-2">{item.invoice}</td>
                  <td className="text-center border border-gray-400 p-2">{item.payment_date}</td>
                  <td className="text-center border border-gray-400 p-2">{item.amount}</td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </div>
  );
};

export default Manager;
