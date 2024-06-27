import React, { useState, useEffect, ChangeEvent } from 'react';
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
  invoices: string;
  date: string;
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

export interface Each_Account_Name_List {
  id: number;
  invoice: string;
  name: string;
  phone_number : string;
}

interface DifficultAccountDetails {
  account: string,
  names: Each_Account_Name_List[],
  number_of_comments: number,
  amount_over_due: number,
  days_overdue: number
}

interface DifficultAccounts {
  number_of_customers : number;
  customers_to_include : DifficultAccountDetails[];
}

type Filter = {
  id: number;
  condition: string;
  count: string;
  conjunction: string;
};

const initialFilter: Filter = {
  id: 1,
  condition: '',
  count: '',
  conjunction: '',
};



const options = ["No Response", "Requested Call Back", "Other"];

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
  const [difficult_accounts, set_difficult_accounts] = useState<number>(0);
  const [difficult_accounts_data, set_difficult_accounts_data] = useState<DifficultAccountDetails[]>([]);
  const [amount_collected_filter, setamount_collected_filter] = useState<string>('today');
  const [accounts_reached_filter, setaccounts_reached_filter] = useState<string>('today');
  const [amount_collected_data, setamount_collected_data] = useState<AmountCollectedData | null>(null);
  const [accounts_reached_data, setaccounts_reached_data] = useState<AccountsReachedData | null>(null);
  const [amount_collected_filtered_data, setamount_collected_filtered_data] = useState<AmountCollectedInvoiceDetails[]>([]);
  const [accounts_reached_filtered_data, setaccounts_reached_filtered_data] = useState<AccountsReachedInvoiceDetails[]>([]);
  const [toggle_amount_collected_data, set_toggle_amount_collected_data] = useState<boolean>(false)
  const [toggle_accounts_reached_data, set_toggle_accounts_reached_data] = useState<boolean>(false)
  const [toggle_difficult_accounts_data, set_toggle_difficult_accounts_data] = useState<boolean>(false)


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
        setaccounts_reached_filter('today')
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
        setamount_collected_filter('today')
      } else {
        console.error('Failed to fetch manager data');
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };

  const fetchSection4Data = async () => {
    try {
      if (!selectedAccountant) return;
      const response = await fetch('http://165.232.188.250:8080/manager_4/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountant: selectedAccountant, data: filters }),
      });
      if (response.ok) {
        const data: DifficultAccounts = await response.json();
        set_difficult_accounts(data.number_of_customers)
        set_difficult_accounts_data(data.customers_to_include)
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
    setFilters([initialFilter])
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
  
  const section4_data = () => {
    if (difficult_accounts > 0) {
      set_toggle_difficult_accounts_data(!toggle_difficult_accounts_data);
    }
    
  };
  const [filters, setFilters] = useState<Filter[]>([initialFilter]);

  const handleFilterChange = (id: number, field: keyof Filter, value: string) => {
    const newFilters = filters.map(filter =>
      filter.id === id ? { ...filter, [field]: value } : filter
    );
    setFilters(newFilters);
  };

  const addFilter = () => {
    const lastFilter = filters[filters.length - 1];

    // Check if the previous filter has condition and count filled
    if (lastFilter.condition !== '' && lastFilter.count !== '') {
      // Add conjunction dropdown for the previous filter
      const updatedFilters = filters.map(filter =>
        filter.id === lastFilter.id ? { ...filter, conjunction: 'AND' } : filter
      );

      // Add a new filter
      setFilters([
        ...updatedFilters,
        { id: lastFilter.id + 1, condition: '', count: '', conjunction: '' }
      ]);
    }
  };

  const removeFilter = () => {
    if (filters.length > 1) {
      const updatedFilters = filters.slice(0, -1); // Remove the last filter
      setFilters(updatedFilters);
    }
  };

  const canAddFilter = () => {
    const lastFilter = filters[filters.length - 1];
    return lastFilter.condition !== '' && lastFilter.count !== '' && filters.length < 3;
    
  };

  const canRemoveFilter = () => {
    return filters.length > 1;
  };

  const renderFilter = (filter: Filter, index: number) => {
    // Get the selected conditions to exclude them from the options
    const selectedConditions = filters.map(f => f.condition);
    const availableOptions = options.filter(option => !selectedConditions.includes(option) || option === filter.condition);

    return (
      <div key={filter.id} className="flex space-x-2 items-center mb-4">
        <div>If</div>
        <select
          value={filter.condition}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange(filter.id, 'condition', e.target.value)}
          className="border border-gray-300 p-2 mr-2"
        >
          <option value="" disabled>Select Condition</option>
          {availableOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div>is greater than</div>
        <input
          type="number"
          value={filter.count}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFilterChange(filter.id, 'count', e.target.value)}
          className="border border-gray-300 w-20 p-2 mr-2"
        />
        <div>times</div>
        {index !== 2 && (
          <select
            value={filter.conjunction}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange(filter.id, 'conjunction', e.target.value)}
            className="border border-gray-300 p-2 mr-2"
          >
            <option value="" disabled>Select Option</option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        )}
      </div>
    );
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
          <option value='all'>All</option> {/* Add this option */}
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
                <th className="text-center border border-gray-400 p-2">Date</th>
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
                  <td className="text-center border border-gray-400 p-2">{item.invoices}</td>
                  <td className="text-center border border-gray-400 p-2">{item.date}</td>
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
      <div id='section-4' className="w-full flex flex-col items-center space-y-4 border border-gray-500 p-5 rounded-xl">
        <div className="flex flex-col space-y-4 bg-white pb-4 px-8  rounded shadow-md w-full max-w-2xl">
          <div className='text-center font-bold text-3xl'>Filter</div>
          {filters.map((filter, index) => renderFilter(filter, index))}
          <div className="flex justify-between items-center">
              <button
                onClick={addFilter}
                disabled={!canAddFilter()}
                className="bg-blue-500 text-white p-2 rounded"
              >
                Add Filter
              </button>
              <button className='bg-blue-500 text-white p-2 rounded' onClick={() => fetchSection4Data()}>
                Get Accounts
              </button>
              {canRemoveFilter() && (
              <button
                onClick={removeFilter}
                className="bg-red-500 text-white p-2 rounded"
              >
                Remove Filter
              </button>
              )}


          </div>
        </div>
        <div className='flex justify-around space-x-5'>
          <div className={`container w-96 text-center py-2 ${difficult_accounts > 0 ? 'hover:bg-green-400' : ''}  rounded-xl cursor-pointer ${toggle_difficult_accounts_data && difficult_accounts>0 ? ' bg-gray-300' : 'bg-blue-500 text-white'}`} onClick={() => section4_data()}>
            Difficult Accounts : {difficult_accounts}
          </div>
        </div>
        {toggle_difficult_accounts_data && difficult_accounts > 0 && (
          <table className="table-auto w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th className="text-center border border-gray-400 p-2">Account</th>
                <th className="text-center border border-gray-400 p-2">
                  <div>Name</div>
                  <div>(Phone Number)</div>
                </th>
                <th className="text-center border border-gray-400 p-2">Number of Comments </th>
                <th className="text-center border border-gray-400 p-2">Amount Overdue</th>
                <th className="text-center border border-gray-400 p-2">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {difficult_accounts_data.map((item, index) => (
                <tr key={index}>
                  <td className="text-center border border-gray-400 p-2">{item.account}</td>
                  <td className="flex flex-col h-16 overflow-y-auto justify-center items-center text-center border border-gray-400 p-2">
                    {item.names.map((Name: Each_Account_Name_List) => (
                      <div>
                        <div>
                            {Name.name}
                        </div>
                        <div>
                            ({Name.phone_number})
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="text-center border border-gray-400 p-2">{item.number_of_comments}</td>
                  <td className="text-center border border-gray-400 p-2">{item.amount_over_due}</td>
                  <td className="text-center border border-gray-400 p-2">{item.days_overdue}</td>
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
