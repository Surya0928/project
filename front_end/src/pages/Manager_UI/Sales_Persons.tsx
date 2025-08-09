import React, { useState, useEffect } from 'react';
import Loading_Comp from '../../components/Loading';
import Manager_Side_Bar from '../../components/Manager_Components/Manager_Side_Bar';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../../components/app_variables';
import ManagerHeadBar from '../../components/Manager_Components/Manager_Head_Bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faBullseye, faUserPlus, faXmark, faCheck, faL } from '@fortawesome/free-solid-svg-icons';

interface SalesPerson {
  id:number;
  name: string;
  phone_number : string;
  address : string;
  email : string;
}

const emailRequirements = [
    { label: 'Contains "@" symbol', regex: /@/ },
    { label: 'Contains a domain (e.g., gmail.com)', regex: /\.[a-z]{2,}$/ },
  ];
  
  const checkRequirement = (input: string, requirement: { label: string; regex: RegExp }) =>
    requirement.regex.test(input);

const Manager_Sales_Persons: React.FC = () => {
  const history = useHistory();
  const { id } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [sales_persons, set_sales_persons] = useState<SalesPerson[]>([]);
  const [inp_email, set_inp_email] = useState<string>('');
  const [inp_name, set_inp_name] = useState<string>('');
  const [inp_phone_number, set_inp_phone_number] = useState<string>('');
  const [inp_address, set_inp_address] = useState<string>('');
  const [isedit, set_is_edit] = useState<boolean>(false);
  const [selected_sales_person, set_selected_sales_person] = useState<number>(0);

  const get_sales_persons = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/sales_persons/', {
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
        const sortedSalesPersons = data.sort((a: SalesPerson, b: SalesPerson) => a.id - b.id);
        set_sales_persons(data);
        setLoading(false)
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const create_sales_person = async (method : string, sales_person_id : number) => {
    setLoading(true)
    if (!isFormValid()) {
      setLoading(false)
        return; // Prevent form submission if email is invalid
      } 
    try {
      const response = await fetch('http://127.0.0.1:8000/create_sales_person/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id : sales_person_id,
            method : method,
            manager : id,
            name : inp_name,
            phone_number : inp_phone_number,
            email : inp_email,
            address : inp_address,
        }),
      });
      if (response.ok) {
        set_inp_email('')
        set_inp_address('')
        set_inp_name('')
        set_inp_phone_number('')
        set_is_edit(false)
        get_sales_persons()
        setLoading(false)
      } else {
        console.error('Failed to fetch users data');
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  const cancel = ()=> {
    set_is_edit(false)
    set_selected_sales_person(0)
    set_inp_email('')
    set_inp_address('')
    set_inp_name('')
    set_inp_phone_number('')
  }

  const edit = (sales_person : SalesPerson) => {
    set_selected_sales_person(sales_person.id); 
    set_inp_email(sales_person.email)
    set_inp_name(sales_person.name)
    set_inp_phone_number(sales_person.phone_number)
    set_inp_address(sales_person.address)
    set_is_edit(true); 
  }
  
  const confirm = (sales_person_id: number) => {
    if (isedit) {
    create_sales_person('Update', sales_person_id);
    }
  };  

  const isFormValid = (): boolean => {
    return emailRequirements.every((requirement) =>
      checkRequirement(inp_email, requirement)
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Set loading to false after 1 second
      get_sales_persons();
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div className='font-sans flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Manager_Side_Bar current_page='Sales Persons' />
      <div className='flex flex-col w-full h-screen'>
        <ManagerHeadBar />
        <div className='h-full overflow-y-auto no-scrollbar w-full flex flex-col py-6 space-y-6'>
          {/* Header Section */}
          <div className='flex w-full h-auto items-center justify-between px-10'>
              <div className='text-4xl font-bold'>Sales Persons</div>
              <div className='text-xl'>No of Sales Persons : {sales_persons.length}</div>
          </div>

          {/* Table Section */}
          <table className='w-full overflow-x-auto border border-gray-300 italic'>
              <thead>
                  <tr>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          NAME
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          PHONE NUMBER
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          ADDRESS
                      </th>
                      <th className='px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          EMAIL
                      </th>
                      <th className='w-24 px-4 py-3 text-left text-sm border-r border-gray-300 font-normal text-gray-400'>
                          
                      </th>
                  </tr>
              </thead>
              <tbody>
                {sales_persons.map((sales_person, index) => (
                  <tr
                    key={sales_person.id}
                    className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
                  > 
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_sales_person===sales_person.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={sales_person.name}
                            style={{ outline: 'none' }}
                            value={inp_name}
                            onChange={(e) => (set_inp_name(e.target.value))}
                          />
                        ) : (
                          sales_person.name
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_sales_person===sales_person.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={sales_person.phone_number}
                            type='text'  // Change this to 'text'
                            style={{ outline: 'none' }}
                            value={inp_phone_number}
                            onChange={(e) => {
                              const phone = e.target.value;
                              if (/^\d*$/.test(phone) && phone.length <= 10) { // Allow only digits and max length of 10
                                set_inp_phone_number(phone);
                              }
                            }}
                            maxLength={10}
                          />
                        ) : (
                          sales_person.phone_number
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_sales_person===sales_person.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={sales_person.address}
                            style={{ outline: 'none' }}
                            value={inp_address}
                            onChange={(e) => (set_inp_address(e.target.value))}
                          />
                        ) : (
                          sales_person.address
                        )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        {selected_sales_person===sales_person.id && isedit ? (
                          <input 
                            className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                            placeholder={sales_person.email}
                            style={{ outline: 'none' }}
                            type='email'
                            value={inp_email}
                            onChange={(e) => (set_inp_email(e.target.value))}
                          />
                        ) : (
                          sales_person.email
                        )}
                    </td>
                    {(selected_sales_person == sales_person.id)&&(isedit) ? (
                      <td className='flex w-24 items-center justify-between space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        <FontAwesomeIcon className='text-lg hover:text-red-500 cursor-pointer' icon={faXmark} onClick={()=>{cancel()}}/>
                        <FontAwesomeIcon className='text-lg hover:text-green-500 cursor-pointer' icon={faCheck} onClick={()=>{confirm(sales_person.id)}}/>
                      </td>
                    ) : (
                      <td className='flex w-24 items-center justify-center space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        <FontAwesomeIcon className='text-lg hover:text-blue-500 cursor-pointer' icon={faPencil} onClick={()=>{edit(sales_person)}}/>
                      </td>
                    )}
                  </tr>
                ))}
                {(!isedit) && (
                  <tr className={`${sales_persons.length % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Name'
                        style={{ outline: 'none' }}
                        value={inp_name}
                        onChange={(e) => (set_inp_name(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                        <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder="Add Phone Number"
                        type='text'  // Change this to 'text'
                        style={{ outline: 'none' }}
                        value={inp_phone_number}
                        onChange={(e) => {
                            const phone = e.target.value;
                            if (/^\d*$/.test(phone) && phone.length <= 10) { // Allow only digits and max length of 10
                            set_inp_phone_number(phone);
                            }
                        }}
                        maxLength={10}
                        />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Address'
                        style={{ outline: 'none' }}
                        value={inp_address}
                        onChange={(e) => (set_inp_address(e.target.value))}
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                      <input 
                        className='border-b bg-transparent text-gray-500 italic w-full h-full' 
                        placeholder='Add Email'
                        style={{ outline: 'none' }}
                        type='email'
                        value={inp_email}
                        onChange={(e) => (set_inp_email(e.target.value))}
                      />
                    </td>
                    <td className='flex w-24 items-center justify-between space-x-2 px-4 py-3 text-sm text-gray-500 border-r border-gray-300'>
                    <FontAwesomeIcon className="text-lg text-gray-500 w-full text-center hover:text-blue-500 cursor-pointer" icon={faUserPlus} onClick={() => {create_sales_person("Create", 0);}}/>
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
          <div className="w-full flex justify-between italic mt-10 px-10">
            {/* Username Requirements */}
            <div className="flex flex-col w-full items-center">
              <h2 className="text-xl font-semibold">Email Requirements</h2>
              <div className="flex flex-col items-start mt-2 text-lg">
                {emailRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center">
                    <span
                      className={`mr-2 ${
                        checkRequirement(inp_email, requirement)
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {checkRequirement(inp_email, requirement) ? '✓' : '✗'}
                    </span>
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager_Sales_Persons;
