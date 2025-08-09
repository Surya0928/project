import React, { useState, useEffect } from 'react';
import Accountant_Side_Bar from '../../components/Accountant_Components/Accountant_Side_Bar';
import Accountant_Head_Bar from '../../components/Accountant_Components/Accountant_Head_Bar';
import { useAppContext } from '../../components/app_variables';
import Loading_Comp from '../../components/Loading';
import AccountantCommentInfo from '../../components/Accountant_Components/Accountant_Comment_Info';

interface Comments {
  id: number;
  customer_name: string;
  date: string;
  invoice_list: string;
  remarks: string;
  amount_promised: number;
  follow_up_date: string;
  promised_date: string;
  sales_person: string;
  comment_status: boolean;
  follow_up_time: string;
}

export interface DataByDate {
  [date: string]: Comments[];
}

interface SalesPerson {
  id:number;
  name: string;
}

const Accountant_Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dash_data, set_dash_data] = useState<DataByDate>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'customer_name', 'date', 'invoice_list', 'remarks', 'amount_promised', 'follow_up_date', 'promised_date', 
  ]);
  const [allColumns] = useState<string[]>([
    'customer_name', 'date', 'invoice_list', 'remarks', 'amount_promised', 'follow_up_date', 'promised_date','follow_up_time', 'sales_person',
  ]);
  const [temporaryVisibleColumns, setTemporaryVisibleColumns] = useState<string[]>([]);
  const [temporaryHiddenColumns, setTemporaryHiddenColumns] = useState<string[]>([]);
  const [showColumnPopup, setShowColumnPopup] = useState<boolean>(false);
  const [show_comment_popup, set_show_comment_popup] = useState<boolean>(false);

  const [filterField, setFilterField] = useState<string>('customer_name');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterOperator, setFilterOperator] = useState<string>('=');  // Default operator
  const [sales_data, set_sales_data] = useState<SalesPerson[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(''); // To hold the selected date
  const [selected_comment_id, set_Selected_comment_id] = useState<number>(-1)
  const { id } = useAppContext();

  const fetchfull = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/to_do_invoices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        const data = await response.json();
        set_dash_data(data.dash);
        set_sales_data(data.sales)
        setLoading(false);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchfull();
  }, []);

  const filterData = (accounts: Comments[]) => {
    if (!filterValue) {
      return accounts;  // Return all data if no filter is applied
    }

    return accounts.filter((account) => {
      const fieldValue = account[filterField as keyof Comments];

      if (fieldValue) {
        const fieldStr = fieldValue.toString().toLowerCase();
        const searchStr = filterValue.toLowerCase();

        switch (filterOperator) {
          case '=':
            // Substring match (contains logic)
            return fieldStr.includes(searchStr);
          case '>':
            // Greater than check (for numerical values)
            if (!isNaN(Number(fieldStr)) && !isNaN(Number(searchStr))) {
              return Number(fieldStr) > Number(searchStr);
            }
            return false;
          case '<':
            // Less than check (for numerical values)
            if (!isNaN(Number(fieldStr)) && !isNaN(Number(searchStr))) {
              return Number(fieldStr) < Number(searchStr);
            }
            return false;
          case '>=':
            // Greater than or equal check (for numerical values)
            if (!isNaN(Number(fieldStr)) && !isNaN(Number(searchStr))) {
              return Number(fieldStr) >= Number(searchStr);
            }
            return false;
          case '<=':
            // Less than or equal check (for numerical values)
            if (!isNaN(Number(fieldStr)) && !isNaN(Number(searchStr))) {
              return Number(fieldStr) <= Number(searchStr);
            }
            return false;
          default:
            return false;
        }
      }
      return false;
    });
  };

  const filteredData = selectedDate
    ? [{ date: selectedDate, accounts: filterData(dash_data[selectedDate] || []) }]  // Show data only for the selected date
    : Object.entries(dash_data).map(([date, accounts]) => ({ date, accounts: filterData(accounts) }));  // Show all data if no date selected

  // Handle dropdown change
  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value);
  };

  const toggleColumnPopup = () => {
    if (showColumnPopup) {
      setTemporaryVisibleColumns(visibleColumns);
      setTemporaryHiddenColumns(allColumns.filter(col => !visibleColumns.includes(col)));
    } else {
      setTemporaryVisibleColumns(visibleColumns);
      setTemporaryHiddenColumns(allColumns.filter(col => !visibleColumns.includes(col)));
    }
    setShowColumnPopup(!showColumnPopup);
  };

  const handleSaveColumns = () => {
    setVisibleColumns(temporaryVisibleColumns);
    setShowColumnPopup(false);
  };

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

  return (
    <div className="w-screen flex justify-between h-screen">
      {loading && <Loading_Comp />}
      <Accountant_Side_Bar current_page="DashBoard" />
      <div className="flex flex-col h-screen w-full">
        <Accountant_Head_Bar />
        {show_comment_popup ? (
          <div className="w-full h-full overflow-y-auto py-2"><AccountantCommentInfo comment_id={selected_comment_id} sales_data={sales_data} onClose={()=>set_show_comment_popup(false)} /></div>
        ) : (
          <div className="h-full overflow-y-auto no-scrollbar w-full flex flex-col py-6 space-y-6">
            {/* Header Section */}
            <div className="flex w-full h-auto items-center justify-between px-10">
              <div className="text-4xl font-bold">Dashboard</div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDate || ''}
                  onChange={handleDateChange}
                  className='px-4 py-2 border border-gray-300 rounded-md'
                >
                  <option value=''>All Dates</option>
                  {Object.keys(dash_data).map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
                <button
                  onClick={toggleColumnPopup}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  Edit Columns
                </button>
              </div>
            </div>

            {/* User Filter and Row Count */}
            <div className="flex w-full h-auto items-center justify-between px-10">
              <div className="flex h-full items-center">
                <select
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
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
                  className="px-4 py-2 border border-gray-300 rounded-md ml-2"
                >
                  <option value="=">{"="}</option>
                  <option value=">">{">"}</option>
                  <option value="<">{"<"}</option>
                  <option value=">=">{">="}</option>
                  <option value="<=">{"<="}</option>
                </select>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="Enter value"
                  className="px-4 py-2 border border-gray-300 rounded-md ml-2"
                />
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto w-full space-y-20 py-10">
              {filteredData.map((dateData) => (
                <div key={dateData.date} className="space-y-2">
                  <div className="text-2xl font-bold px-4">{dateData.date}</div>
                  <table className='w-full overflow-x-auto border border-gray-300'>
                    <thead>
                      <tr className="border-b">
                        {visibleColumns.map((column) => (
                          <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dateData.accounts.map((item, index) => (
                        <tr key={item.id} className={`cursor-pointer ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`} onClick={()=>{set_show_comment_popup(true),set_Selected_comment_id(item.id)}}>
                          {visibleColumns.map((column) => (
                            <td className="truncated-cell px-4 py-3 text-sm text-gray-500 border-r border-gray-300">{item[column as keyof Comments]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

export default Accountant_Dashboard;
