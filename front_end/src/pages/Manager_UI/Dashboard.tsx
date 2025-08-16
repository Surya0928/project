import React, { useState, useEffect, ChangeEvent } from 'react';
import Loading_Comp from '../../components/Loading';
import Manager_Side_Bar from '../../components/Manager_Components/Manager_Side_Bar';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../../components/app_variables';
import ManagerHeadBar from '../../components/Manager_Components/Manager_Head_Bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPersonCirclePlus, faPencil, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

interface Top_Debtors {
  customer_name : string,
  age : number,
  over_due_invoices : number,
  over_due_amount : number
}

interface Accountant {
  id: number;
  username: string;
}

interface Amount_Filters {
  [key: string]: number;
}

interface Dashboard {
  customers : number,
  invoices : number,
  over_due : number,
  total_balance : number,
  customers_reached : Amount_Filters,
  expected_payments : Amount_Filters,
  amounts_received : Amount_Filters,
  top_debtors: Top_Debtors[],
  accountants: Accountant[]
}

const formatNumberToINR = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });
};

const Manager_DashBoard: React.FC = () => {
  const history = useHistory();
  const { id } = useAppContext();
  const [selectedAccountant, setSelectedAccountant] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customers_reached_filter, set_customers_reached_filter] = useState<string>('All');
  const [customers_reached, set_customers_reached] = useState<string>(formatNumberToINR(0));
  const [expected_payments_filter, set_expected_payments_filter] = useState<string>('All');
  const [expected_payments, set_expected_payments] = useState<string>(formatNumberToINR(0));
  const [amount_received_filter, set_amount_received_filter] = useState<string>('All');
  const [amount_received, set_amount_received] = useState<string>(formatNumberToINR(0));
  const [dashboard_data, set_dashboard_data] = useState<Dashboard>();
  const [accountants, setAccountants] = useState<Accountant[]>([]);

  const handleCustomersReachedFilterChange = (filter: string) => {
    set_customers_reached_filter(filter);
    set_customers_reached(dashboard_data? String(dashboard_data['customers_reached'][filter]) : '0');
  };

  const handleProjectedCollectionFilterChange = (filter: string) => {
    set_expected_payments_filter(filter);
    set_expected_payments(dashboard_data? (formatNumberToINR(dashboard_data['expected_payments'][filter])) : (formatNumberToINR(0)))
  };

  const handleAmountReceivedFilterChange = (filter: string) => {
    set_amount_received_filter(filter);
    set_amount_received(dashboard_data? (formatNumberToINR(dashboard_data['amounts_received'][filter])) : (formatNumberToINR(0)))
    
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    console.log('Fetching dashboard data for manager ID:', id, 'and accountant ID:', selectedAccountant);
    try {
      const response = await fetch('http://159.89.160.186/manager_dashboard_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manager_id: id,
          accountant_id: selectedAccountant
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
  
        set_dashboard_data(data)
        setAccountants(data['accountants']);
        set_customers_reached(data['customers_reached']['All'])
        set_amount_received(formatNumberToINR(data['amounts_received']['All']))
        set_expected_payments(formatNumberToINR(data['expected_payments']['All']))
        
      } else {
        console.error('Error fetching dashboard data:', response.statusText);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      fetchDashboardData() // Set loading to false after 3 seconds
    }, 1000);
    // fetchDashboardData()
  }, []);

  useEffect(() => {
  if (selectedAccountant !== null) {
    fetchDashboardData();
  }
}, [selectedAccountant]);

  const handleAccountantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedAccountant(value ? parseInt(value) : null);
    console.log('Selected Accountant ID:', value);
  };
  
  return (
    <div className='flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Manager_Side_Bar current_page='DashBoard' />
      <div className='flex flex-col w-full h-screen'>
        <ManagerHeadBar />
        <div className='h-full overflow-y-auto no-scrollbar bg-gray-100 w-full flex flex-col px-10 py-6 space-y-6'>
          <div className='flex w-full justify-end items-center'>
            <select
                  value={selectedAccountant || ''}
                  onChange={handleAccountantChange}
                  className='px-4 py-2 bg-white border border-gray-500 rounded-md'
                >
                  <option value=''>All Accountants</option>
                  {accountants.map((accountant) => (
                    <option key={accountant.id} value={accountant.id}>
                      {accountant.username}
                    </option>
                  ))}
                </select>
          </div>
          {dashboard_data && dashboard_data.customers < 1 && (<div className='flex flex-col container bg-white w-full px-10 py-6 rounded-lg space-y-4'>
            <div className='text-3xl text-gray-700'>
              Vasool.ai
            </div>
            <div className='flex font-light tracking-wide text-md flex-col'>
              <div >New to Vasool?</div>
              <div >Connect to your Tally Prime account now to start invoicing.</div>
            </div>
            <div className='flex w-40 items-center justify-center text-white rounded-lg py-2 bg-gradient-to-r from-blue-400 to-purple-600 cursor-pointer' onClick={()=>history.push('/manager/instructions')}>
              Connect Now
            </div>
          </div>)}
          <div className='flex w-full px-10 justify-around'>
            <div className='flex flex-col w-1/5 h-32 py-2 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='text-3xl'>Total A/R Balance</div>
              <div className='text-2xl'>{dashboard_data? (formatNumberToINR(dashboard_data.total_balance)) : formatNumberToINR(0.00)}</div>
            </div>
            <div className='flex flex-col w-1/5 h-32 py-2 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='text-3xl'>Overdue</div>
              <div className='text-2xl'>{dashboard_data? (formatNumberToINR(dashboard_data.over_due)) : formatNumberToINR(0.00)}</div>
            </div>
            <div className='flex flex-col w-1/5 h-32 py-2 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='text-3xl'>No Of Customers</div>
              <div className='text-2xl'>{dashboard_data? dashboard_data.customers : 0}</div>
            </div>
            <div className='flex flex-col w-1/5 h-32 py-2 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='text-3xl'>No Of Invoices</div>
              <div className='text-2xl'>{dashboard_data? dashboard_data.invoices : 0}</div>
            </div>
          </div>
          <div className='flex w-full px-10 justify-around'>
            <div className='flex flex-col w-3/10 h-44 py-3 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='flex space-x-4'>
                <button
                  onClick={() => handleProjectedCollectionFilterChange('All')}
                  className={`px-4 py-1 rounded ${
                    expected_payments_filter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleProjectedCollectionFilterChange('This_Month')}
                  className={`px-4 py-1 rounded ${
                    expected_payments_filter === 'This_Month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleProjectedCollectionFilterChange('This_Week')}
                  className={`px-4 py-1 rounded ${
                    expected_payments_filter === 'This_Week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleProjectedCollectionFilterChange('Today')}
                  className={`px-4 py-1 rounded ${
                    expected_payments_filter === 'Today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Today
                </button>
              </div>
              <div className='text-3xl'>Expected Payments</div>
              <div className='text-2xl'>{expected_payments}</div>
            </div>
            <div className='flex flex-col w-3/10 h-44 py-3 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='flex space-x-4'>
                <button
                  onClick={() => handleAmountReceivedFilterChange('All')}
                  className={`px-4 py-1 rounded ${
                    amount_received_filter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleAmountReceivedFilterChange('This_Month')}
                  className={`px-4 py-1 rounded ${
                    amount_received_filter === 'This_Month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleAmountReceivedFilterChange('This_Week')}
                  className={`px-4 py-1 rounded ${
                    amount_received_filter === 'This_Week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleAmountReceivedFilterChange('Today')}
                  className={`px-4 py-1 rounded ${
                    amount_received_filter === 'Today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Today
                </button>
              </div>
              <div className='text-3xl'>Amount Recieved</div>
              <div className='text-2xl'>{amount_received}</div>
            </div>
            <div className='flex flex-col w-3/10 h-44 py-3 rounded-lg px-5 bg-white items-center justify-center space-y-6'>
              <div className='flex space-x-4'>
                <button
                  onClick={() => handleCustomersReachedFilterChange('All')}
                  className={`px-4 py-1 rounded ${
                    customers_reached_filter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleCustomersReachedFilterChange('This_Month')}
                  className={`px-4 py-1 rounded ${
                    customers_reached_filter === 'This_Month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => handleCustomersReachedFilterChange('This_Week')}
                  className={`px-4 py-1 rounded ${
                    customers_reached_filter === 'This_Week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => handleCustomersReachedFilterChange('Today')}
                  className={`px-4 py-1 rounded ${
                    customers_reached_filter === 'Today' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Today
                </button>
              </div>
              <div className='text-3xl'>Customers Reached</div>
              <div className='text-2xl'>{customers_reached}</div>
            </div>
          </div>
          {dashboard_data && (
            <div className='flex flex-col container bg-white w-full px-10 py-6 rounded-lg space-y-6'>
            <div className='text-xl text-gray-700'>
              Top Debtors
            </div>
            <table className='w-full'>
              <thead>
                <tr>
                  <th className='w-1/12 text-left text-sm font-light text-gray-400 border-b border-gray-300 pl-2 pb-2'>AGE</th>
                  <th className='w-5/12 text-left text-sm font-light text-gray-400 border-b border-gray-300 pl-2 pb-2'>CUSTOMER NAME</th>
                  <th className='w-3/12 text-left text-sm font-light text-gray-400 border-b border-gray-300 pl-2 pb-2'>OVERDUE INVOICES</th>
                  <th className='w-3/12 text-left text-sm font-light text-gray-400 border-b border-gray-300 pl-2 pb-2'>OVERDUE AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {dashboard_data?.top_debtors.map((customer, index)=> (
                <tr>
                  <td className='w-1/12 text-left text-sm font-light text-gray-600 px-2 py-3'>{customer.age} days</td>
                  <td className='w-5/12 text-left text-sm font-light text-gray-600 px-2 py-3'>{customer.customer_name}</td>
                  <td className='w-3/12 text-left text-sm font-light text-gray-600 px-2 py-3'>{customer.over_due_invoices}</td>
                  <td className='w-3/12 text-left text-sm font-light text-gray-600 px-2 py-3'>{formatNumberToINR(customer.over_due_amount)}</td>
                </tr>
              ))}
              </tbody>
            </table>
            <div className='text-blue-500 cursor-pointer' onClick={()=>(history.push('/manager/customers'))}>
              View More
            </div>
            
            </div>
        )}
        </div>
      </div>
        
    </div>
  );
};

export default Manager_DashBoard;
