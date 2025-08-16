import React, { useState, useEffect } from 'react';
import Loading_Comp from '../../components/Loading';
import Accountant_Side_Bar from '../../components/Accountant_Components/Accountant_Side_Bar';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../../components/app_variables';
import Accountant_Head_Bar from '../../components/Accountant_Components/Accountant_Head_Bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpWideShort, faArrowDownShortWide } from '@fortawesome/free-solid-svg-icons';
import AccountantCustomerInfo from '../../components/Accountant_Components/Accountant_Customer_Info';

interface NameAndNumber {
  id: number;
  name: string;
  phone_number: string;
}

interface SalesPerson {
  id:number;
  name: string;
}

interface Customer {
  id: number;
  customer_name: string;
  invoices: number;
  credit_period: number;
  over_due: number;
  total_balance: number;
  ar_accountant: number;
  names: NameAndNumber[];
}

const formatNumberToINR = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });
};

const Accountant_Customers: React.FC = () => {
  const history = useHistory();
  const { id } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hovering, setHovering] = useState(false);
  const [sales_data, set_sales_data] = useState<SalesPerson[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>()

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'customer_name', 'invoices', 'credit_period', 'over_due', 'total_balance'
  ]);
  const [allColumns] = useState<string[]>([
    'customer_name', 'invoices', 'credit_period', 'over_due', 'total_balance'
  ]);
  const [temporaryVisibleColumns, setTemporaryVisibleColumns] = useState<string[]>([]);
  const [temporaryHiddenColumns, setTemporaryHiddenColumns] = useState<string[]>([]);
  const [showColumnPopup, setShowColumnPopup] = useState<boolean>(false);
  

  const [filterField, setFilterField] = useState<string>('customer_name');
  const [filterOperator, setFilterOperator] = useState<string>('=');
  const [filterValue, setFilterValue] = useState<string>('');
  const [show_customer_popup, set_show_customer_popup] = useState<boolean>(false)

  const get_customers = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://159.89.160.186:8000/accountant_customer_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
        set_sales_data(data.sales_persons)
        setLoading(false)
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 1 second
      get_customers();
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.over_due - b.over_due;
    } else {
      return b.over_due - a.over_due;
    }
  });

  const applyUserFilter = (customer: { [x: string]: any; }) => {
    if (filterValue === '') return true;

    const fieldValue = customer[filterField];
    const lowerCaseFilterValue = filterValue.toLowerCase();
    
    if (fieldValue === undefined) return false;

    if (typeof fieldValue === 'string') {
      const lowerCaseFieldValue = fieldValue.toLowerCase();
      
      switch (filterOperator) {
        case '=':
          return lowerCaseFieldValue.includes(lowerCaseFilterValue);
        default:
          return false;
      }
    }

    const numericFieldValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue);
    const numericFilterValue = parseFloat(filterValue);
    
    switch (filterOperator) {
      case '=':
        return numericFieldValue === numericFilterValue;
      case '>':
        return numericFieldValue > numericFilterValue;
      case '<':
        return numericFieldValue < numericFilterValue;
      case '>=':
        return numericFieldValue >= numericFilterValue;
      case '<=':
        return numericFieldValue <= numericFilterValue;
      default:
        return true;
    }
  };

  const filteredCustomers = sortedCustomers
    .filter((customer) => customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(applyUserFilter);

    const handleColumnDrag = (event: React.DragEvent<HTMLDivElement>, column: string) => {
      event.dataTransfer.setData('text/plain', column);
    };
    
    const handleColumnDrop = (event: React.DragEvent<HTMLDivElement>, destination: string) => {
      event.preventDefault();
      const column = event.dataTransfer.getData('text/plain');
    
      if (destination === 'visible' && !temporaryVisibleColumns.includes(column)) {
        setTemporaryVisibleColumns([...temporaryVisibleColumns, column]);
        setTemporaryHiddenColumns(temporaryHiddenColumns.filter((col) => col !== column));
      } else if (destination === 'hidden' && !temporaryHiddenColumns.includes(column)) {
        setTemporaryHiddenColumns([...temporaryHiddenColumns, column]);
        setTemporaryVisibleColumns(temporaryVisibleColumns.filter((col) => col !== column));
      }
    };
    
  
  const toggleColumnPopup = () => {
    if (showColumnPopup) {
      // Reset to original state when closing
      setTemporaryVisibleColumns(visibleColumns);
      setTemporaryHiddenColumns(allColumns.filter(col => !visibleColumns.includes(col)));
    } else {
      // Initialize temporary state when opening
      setTemporaryVisibleColumns(visibleColumns);
      setTemporaryHiddenColumns(allColumns.filter(col => !visibleColumns.includes(col)));
    }
    setShowColumnPopup(!showColumnPopup);
  };
  
  const handleSaveColumns = () => {
    setVisibleColumns(temporaryVisibleColumns);
    setShowColumnPopup(false);
  };
  

  return (
    <div className='font-sans flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Accountant_Side_Bar current_page="All_Customers"/>
      <div className='flex flex-col w-full h-screen'>
        <Accountant_Head_Bar />
        {show_customer_popup ? (
          <div className='w-full h-full overflow-y-auto py-2'>{show_customer_popup && selectedCustomer && (<AccountantCustomerInfo customer_name={selectedCustomer.customer_name}  sales_data={sales_data} onClose={() => {set_show_customer_popup(false); setSelectedCustomer(null)}}/>)}</div>
        ) : (
          <div className='h-full overflow-y-auto no-scrollbar w-full flex flex-col py-6 space-y-6'>
            {/* Header Section */}
            <div className='flex w-full h-auto items-center justify-between px-10'>
              <div className='text-4xl font-bold'>Customers</div>
              <div className='flex items-center space-x-4'>
                <input
                  type='text'
                  placeholder='Search Customers...'
                  value={searchQuery}
                  onChange={handleSearch}
                  className='px-4 py-2 border border-gray-300 rounded-md'
                />
                <button
                  onClick={toggleColumnPopup}
                  className='px-4 py-2 bg-blue-500 text-white rounded-md'
                >
                  Edit Columns
                </button>
              </div>
            </div>

            {/* User Filter and Row Count */}
            <div className='flex w-full h-auto items-center justify-between px-10'>
              <div className='flex h-full items-center'>
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-md'
                >
                  {visibleColumns
                    .map((column) => (
                      <option key={column} value={column}>
                        {column.toLowerCase()}
                      </option>
                    ))}
                </select>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className='mx-2 px-4 py-2 border border-gray-300 rounded-md'
                >
                  <option value='='>=</option>
                  <option value='>'>{'>'}</option>
                  <option value='<'>{'<'}</option>
                  <option value='>='>{'>='}</option>
                  <option value='<='>{'<='}</option>
                </select>
                <input
                  type='text'
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder='Enter value'
                  className='px-4 py-2 border border-gray-300 rounded-md'
                />
              </div>
              {/* Row Count Display */}
              <div className='text-lg text-gray-600'>
                Number of Customers: {filteredCustomers.length}
              </div>
            </div>

            {/* Table Section */}
            <table className='w-full overflow-x-auto border border-gray-300'>
              <thead>
                <tr>
                  {visibleColumns.includes('customer_name') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      CUSTOMER NAME
                    </th>
                  )}
                  {visibleColumns.includes('invoices') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      INVOICES
                    </th>
                  )}
                  {visibleColumns.includes('credit_period') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      CREDIT PERIOD
                    </th>
                  )}
                  {visibleColumns.includes('over_due') && (
                    <th
                      className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400 flex items-center cursor-pointer'
                      onClick={handleSort} // Add click handler for sorting
                    >
                      OVER DUE
                      <span 
                        className="ml-2"
                        onMouseEnter={() => setHovering(true)}
                        onMouseLeave={() => setHovering(false)}
                      >
                        {hovering ? (
                          sortOrder === 'asc' ? (
                            <FontAwesomeIcon icon={faArrowDownShortWide} className="text-gray-300" />
                          ) : (
                            <FontAwesomeIcon icon={faArrowUpWideShort} className="text-gray-300" />
                          )
                        ) : (
                          sortOrder === 'asc' ? (
                            <FontAwesomeIcon icon={faArrowUpWideShort} className="text-gray-500" />
                          ) : (
                            <FontAwesomeIcon icon={faArrowDownShortWide} className="text-gray-500" />
                          )
                        )}
                      </span>
                    </th>
                  )}
                  {visibleColumns.includes('total_balance') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      TOTAL BALANCE
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    onClick={() => {set_show_customer_popup(true); setSelectedCustomer(customer)}}
                    className={`cursor-pointer ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    {visibleColumns.includes('customer_name') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {customer.customer_name}
                      </td>
                    )}
                    {visibleColumns.includes('invoices') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {customer.invoices}
                      </td>
                    )}
                    {visibleColumns.includes('credit_period') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {customer.credit_period} days
                      </td>
                    )}
                    {visibleColumns.includes('over_due') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {formatNumberToINR(customer.over_due)}
                      </td>
                    )}
                    {visibleColumns.includes('total_balance') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {formatNumberToINR(customer.total_balance)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Column Selection Popup */}
      {showColumnPopup && (
        <div className='fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center'>
          <div className='bg-white p-6 rounded-md shadow-md w-1/2'>
            <h2 className='text-lg font-semibold mb-4'>Customize Table Columns</h2>
            <div className='flex'>
              <div
                className='w-1/2 border border-gray-300 rounded-md p-4'
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleColumnDrop(e, 'visible')}
              >
                <h3 className='text-lg font-semibold'>Visible Columns</h3>
                {temporaryVisibleColumns.map((column) => (
                  <div
                    key={column}
                    draggable
                    onDragStart={(e) => handleColumnDrag(e, column)}
                    className='bg-gray-200 p-2 my-2 rounded-md cursor-pointer'
                  >
                    {column.toUpperCase()}
                  </div>
                ))}
              </div>
              <div
                className='w-1/2 border border-gray-300 rounded-md p-4 ml-4'
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleColumnDrop(e, 'hidden')}
              >
                <h3 className='text-lg font-semibold'>Hidden Columns</h3>
                {allColumns
                  .filter((column) => !temporaryVisibleColumns.includes(column))
                  .map((column) => (
                    <div
                      key={column}
                      draggable
                      onDragStart={(e) => handleColumnDrag(e, column)}
                      className='bg-gray-200 p-2 my-2 rounded-md cursor-pointer'
                    >
                      {column.toUpperCase()}
                    </div>
                  ))}
              </div>
            </div>
            <div className='flex justify-end mt-4'>
              <button
                onClick={() => setShowColumnPopup(false)}
                className='px-4 py-2 bg-red-500 text-white rounded-md mr-2'
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColumns}
                className='px-4 py-2 bg-green-500 text-white rounded-md'
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accountant_Customers;
