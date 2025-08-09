import React, { useState, useEffect } from 'react';
import Loading_Comp from '../../components/Loading';
import Accountant_Side_Bar from '../../components/Accountant_Components/Accountant_Side_Bar';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../../components/app_variables';
import Accountant_Head_Bar from '../../components/Accountant_Components/Accountant_Head_Bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpWideShort, faArrowDownShortWide } from '@fortawesome/free-solid-svg-icons';
import AccountantInvoiceInfo from '../../components/Accountant_Components/Accountant_Invoice_Info';

interface SalesPerson {
  id:number;
  name: string;
}

interface Invoice {
  id: number,
  ar_accountant: number,
  customer_name: string,
  date: string,
  ref_no: string,
  pending: number,
  paid_date: string | null,
  sales_person: string | null
}


const formatNumberToINR = (num: number) => {
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  });
};

const Paid_Accountant_Invoices: React.FC = () => {
  const history = useHistory();
  const { id } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [invoice, setinvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountant, setSelectedAccountant] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [sales_data, set_sales_data] = useState<SalesPerson[]>([]);

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'customer_name', 'ref_no', 'date', 'pending', 'paid_date','sales_person'
  ]);
  const [allColumns] = useState<string[]>([
    'customer_name', 'ref_no', 'date', 'pending', 'paid_date', 'sales_person'
  ]);
  const [temporaryVisibleColumns, setTemporaryVisibleColumns] = useState<string[]>([]);
  const [temporaryHiddenColumns, setTemporaryHiddenColumns] = useState<string[]>([]);
  const [showColumnPopup, setShowColumnPopup] = useState<boolean>(false);
  

  const [filterField, setFilterField] = useState<string>('customer_name');
  const [filterOperator, setFilterOperator] = useState<string>('=');
  const [filterValue, setFilterValue] = useState<string>('');

  const get_invoices = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/accountant_paid_invoice_data/', {
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
        setinvoices(data.invoices);
        set_sales_data(data.sales_persons);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // Ensure loading is set to false after the API call
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      get_invoices();
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const sortedInvoices = [...invoice].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.pending - b.pending;
    } else {
      return b.pending - a.pending;
    }
  });

  const applyUserFilter = (invoice: Invoice) => {
    if (filterValue === '') return true;
  
    const fieldValue = invoice[filterField as keyof Invoice];
  
    // Handle cases where fieldValue is null or undefined
    if (fieldValue === undefined || fieldValue === null) return false;
  
    const lowerCaseFilterValue = filterValue.toLowerCase();
    
    if (typeof fieldValue === 'string') {
      const lowerCaseFieldValue = fieldValue.toLowerCase();
      switch (filterOperator) {
        case '=':
          return lowerCaseFieldValue.includes(lowerCaseFilterValue);
        default:
          return false;
      }
    } else if (typeof fieldValue === 'number') {
      const numericFieldValue = fieldValue;
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
    } else if (typeof fieldValue === 'boolean') {
      const booleanFieldValue = fieldValue;
      const booleanFilterValue = filterValue === 'true';
  
      switch (filterOperator) {
        case '=':
          return booleanFieldValue === booleanFilterValue;
        default:
          return false;
      }
    } else {
      // Handle other possible types or return false if not applicable
      return false;
    }
  };
  
  

  const filteredInvoices = sortedInvoices
  .filter((invoice) => invoice.ref_no.toLowerCase().includes(searchQuery.toLowerCase()))
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
  
  const [show_invoice_popup, set_show_invoice_popup] = useState<boolean>(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>()

  return (
    <div className='font-sans flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Accountant_Side_Bar current_page='Paid' />
      <div className='flex flex-col w-full h-screen'>
        <Accountant_Head_Bar />
        {show_invoice_popup ? (
          <div className='w-full h-3/4'>{show_invoice_popup && selectedInvoice && (<AccountantInvoiceInfo customer_name={selectedInvoice.customer_name} invoice_name={selectedInvoice.ref_no} sales_data={sales_data} onClose={() => {set_show_invoice_popup(false); setSelectedInvoice(null)}}/>)}</div>
        ) : (
          <div className='h-full overflow-y-auto no-scrollbar w-full flex flex-col py-6 space-y-6'>
            {/* Header Section */}
            <div className='flex w-full h-auto items-center justify-between px-10'>
              <div className='text-4xl font-bold'>Paid Invoices</div>
              <div className='flex items-center space-x-4'>
                <input
                  type='text'
                  placeholder='Search Invoices...'
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
              <div className='flex items-center'>
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-md'
                >
                  {visibleColumns
                    .filter((column) => column !== 'ar_accountant')  // Exclude 'ar_accountant'
                    .map((column) => (
                      <option key={column} value={column}>
                        {column.toLowerCase()}
                      </option>
                    ))}
                </select>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-md ml-2'
                >
                  <option value='='>=</option>
                  <option value='>'>{'>'}</option>
                  <option value='<'>
                    {'<'}
                  </option>
                  <option value='>='>{'>='}</option>
                  <option value='<='>
                    {'<='}
                  </option>
                </select>
                <input
                  type='text'
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-md ml-2'
                />
              </div>
              <div className='text-lg text-gray-600'>
                Number of Invoices: {filteredInvoices.length}
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
                  {visibleColumns.includes('ref_no') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      INVOICE REF NUMBER
                    </th>
                  )}
                  {visibleColumns.includes('date') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      DATE
                    </th>
                  )}
                  {visibleColumns.includes('pending') && (
                    <th
                      className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400 flex items-center cursor-pointer'
                      onClick={handleSort} // Add click handler for sorting
                    >
                      PAID AMOUNT
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
                  {visibleColumns.includes('paid_date') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      PAID DATE
                    </th>
                  )}
                  {visibleColumns.includes('sales_person') && (
                    <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                      SALES PERSON
                    </th>
                  )}         
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice, index) => (
                  <tr
                    key={invoice.id}
                    onClick={() => {set_show_invoice_popup(true); setSelectedInvoice(invoice)}}
                    className={`cursor-pointer ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    {visibleColumns.includes('customer_name') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {invoice.customer_name}
                      </td>
                    )}
                    {visibleColumns.includes('ref_no') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {invoice.ref_no}
                      </td>
                    )}
                    {visibleColumns.includes('date') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {invoice.date? (invoice.date) : ('-')}
                      </td>
                    )}
                    {visibleColumns.includes('pending') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {formatNumberToINR(invoice.pending)}
                      </td>
                    )}
                    {visibleColumns.includes('paid_date') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {invoice.paid_date? (invoice.paid_date) : ('-')}
                      </td>
                    )}
                    {visibleColumns.includes('sales_person') && (
                      <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {sales_data.find((acc) => acc.name === invoice.sales_person)?.name || '-'}
                      </td>
                    )}                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Column Popup */}
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

export default Paid_Accountant_Invoices;
