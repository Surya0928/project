import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../components/app_variables';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPersonCirclePlus } from '@fortawesome/free-solid-svg-icons';

interface Users {
  "username": string,
  "password": string,
  "address": string,
  "role": string
}

interface SalesPerson {
    id: number;
    name: string;
    phone_number: string;
    address: string | null;
    email: string | null;
  }

const Manager_Users: React.FC = () => {
  const history = useHistory();
  const { id, username } = useAppContext();
  const [all_users, set_all_users] = useState<Users[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [inp_username, set_inp_username] = useState<string>('');
  const [inp_password, set_inp_password] = useState<string>('');
  const [inp_address, set_inp_address] = useState<string>('');
  const [inp_role, set_inp_role] = useState<string>('');
  const [inp_sales_name, set_inp_sales_name] = useState<string>('');
  const [inp_sales_phone_number, set_inp_sales_phone_number] = useState<string>('');
  const [inp_sales_address, set_inp_sales_address] = useState<string>('');
  const [inp_sales_email, set_inp_sales_email] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://159.89.160.186:8000/all_users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        set_all_users(data['Users']);
      } else {
        console.error('Failed to fetch users data');
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch('http://159.89.160.186:8000/sales/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        setSalesPersons(data.sales_data);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const Create_User = async () => {
    try {
      const response = await fetch('http://159.89.160.186:8000/create_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username : inp_username || null,
            password : inp_password || null,
            address : inp_address || null,
            role : inp_role || null
        }),
      });
      if (response.ok) {
        fetchUsers()
        set_inp_username('')
        set_inp_password('')
        set_inp_address('')
        set_inp_role('')
      } else {
        console.error('Failed to fetch users data');
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    }
  };


  const createSales = async () => {
    if (inp_sales_name && inp_sales_phone_number) {
      try {
        const response = await fetch('http://159.89.160.186:8000/create-sales/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: inp_sales_name,
            phone_number: inp_sales_phone_number,
            address: inp_address || null,
            email: inp_sales_email || null,
          }),
        });

        if (response.ok) {
          console.log('Sales person created successfully');
          set_inp_sales_address('');
          set_inp_sales_email('');
          set_inp_sales_name('');
          set_inp_sales_phone_number('')
          fetchSales(); // Refresh the data
        } else {
          console.error('Failed to create sales person');
        }
      } catch (error) {
        console.error('Error creating sales person:', error);
      }
    }
  };

  useEffect(() => {
    if (!id) {
      history.push('/');
    }
    fetchUsers();
    fetchSales();
  }, [id, history]);

  return (
    <div className='flex flex-col items-center overflow-y-auto no-scrollbar w-screen h-screen space-y-16 pb-10'>
      <div className='flex justify-between items-center bg-black w-full h-auto px-10 py-4'>
        <div className='text-3xl font-bold text-white'>{username}</div>
        <div className='flex space-x-14 items-center'>
          <FontAwesomeIcon icon={faHouse} className='text-white w-8 h-8 cursor-pointer' onClick={() => history.push('/manager/home')} />
          <FontAwesomeIcon icon={faPersonCirclePlus} className='text-blue-600 w-8 h-8 cursor-pointer' />
        </div>
      </div>
      <div className='w-full px-20 space-y-4'>
        <div className='text-3xl font-bold'>Users</div>
        <table className='w-full'>
          <thead>
            <tr>
              <th className="text-center border border-gray-400 p-2">Username</th>
              <th className="text-center border border-gray-400 p-2">Password</th>
              <th className="text-center border border-gray-400 p-2">Address</th>
              <th className="text-center border border-gray-400 p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {all_users.map((item, index) => (
              <tr key={index}>
                <td className="text-center border border-gray-400 p-2">{item.username}</td>
                <td className="text-center border border-gray-400 p-2">{item.password}</td>
                <td className="text-center border border-gray-400 p-2">{item.address}</td>
                <td className="text-center border border-gray-400 p-2">{item.role}</td>
              </tr>
            ))}
            <tr>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Username'
                    style={{ outline: 'none' }}
                    value={inp_username}
                    onChange={(e) => (set_inp_username(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Password' 
                    style={{ outline: 'none' }}
                    value={inp_password}
                    onChange={(e) => (set_inp_password(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Address' 
                    style={{ outline: 'none' }}
                    value={inp_address}
                    onChange={(e) => (set_inp_address(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Role' 
                    style={{ outline: 'none' }}
                    value={inp_role}
                    onChange={(e) => (set_inp_role(e.target.value))}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button className=' py-2 px-4 rounded-xl bg-blue-500 text-white italic' onClick={() => Create_User()}>Add User</button>
      </div>
      <div className='w-full px-20 space-y-4'>
      <div className='text-3xl font-bold'>Sales Person</div>
        <table className='w-full'>
          <thead>
            <tr>
              <th className="text-center border border-gray-400 p-2">Name</th>
              <th className="text-center border border-gray-400 p-2">Phone Number</th>
              <th className="text-center border border-gray-400 p-2">Address</th>
              <th className="text-center border border-gray-400 p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {salesPersons.map((item, index) => (
              <tr key={index}>
                <td className="text-center border border-gray-400 p-2">{item.name}</td>
                <td className="text-center border border-gray-400 p-2">{item.phone_number}</td>
                <td className="text-center border border-gray-400 p-2">{item.address}</td>
                <td className="text-center border border-gray-400 p-2">{item.email}</td>
              </tr>
            ))}
            <tr>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Sales Name'
                    style={{ outline: 'none' }}
                    value={inp_sales_name}
                    onChange={(e) => (set_inp_sales_name(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Sales Number' 
                    style={{ outline: 'none' }}
                    value={inp_sales_phone_number}
                    onChange={(e) => (set_inp_sales_phone_number(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Sales Address' 
                    style={{ outline: 'none' }}
                    value={inp_sales_address}
                    onChange={(e) => (set_inp_sales_address(e.target.value))}
                  />
                </div>
              </td>
              <td className="text-center border-b border-dashed border-gray-400 px-2 py-4">
                <div className="flex justify-center items-center h-full">
                  <input 
                    className='border-none text-black italic text-center w-full h-full' 
                    placeholder='Add Sales Email' 
                    style={{ outline: 'none' }}
                    value={inp_sales_email}
                    type='email'
                    onChange={(e) => (set_inp_sales_email(e.target.value))}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button className=' py-2 px-4 rounded-xl bg-blue-500 text-white italic' onClick={() => createSales()}>Add Sales Person</button>
      </div>
    </div>
  );
};

export default Manager_Users;
