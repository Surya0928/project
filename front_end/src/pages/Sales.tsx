import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import Sidebar from '../components/side_bar';
import { useHistory } from 'react-router-dom';
import { AppProvider, useAppContext } from '../components/app_variables';

interface SalesPerson {
  id: number;
  name: string;
  phone_number: string;
  address: string | null;
  email: string | null;
}

const Sales: React.FC = () => {
  const history = useHistory();
  const { id, username } = useAppContext();
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [newSalesPerson, setNewSalesPerson] = useState({
    name: '',
    phone_number: '',
    address: '',
    email: '',
  });

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/sales/', {
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

  const createSales = async () => {
    const { name, phone_number, address, email } = newSalesPerson;
    if (name) {
      try {
        const response = await fetch('http://127.0.0.1:8000/create-sales/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone_number: phone_number || null,
            address: address || null,
            email: email || null,
          }),
        });

        if (response.ok) {
          console.log('Sales person created successfully');
          setNewSalesPerson({ name: '', phone_number: '', address: '', email: '' });
          fetchData(); // Refresh the data
        } else {
          console.error('Failed to create sales person');
        }
      } catch (error) {
        console.error('Error creating sales person:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSalesPerson((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSales();
  };

  useEffect(() => {
    if (!id) {
      history.push('/');
    }
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className='flex w-screen bg-gray-100 h-screen justify-between  items-center'>
      <Sidebar current_page='Sales' />
      <HeadBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} pagename='Sales'/>
      <div className='w-full flex flex-col items-center justify-center py-20 px-40'>
        <h1 className='text-2xl font-bold mb-4'>Sales</h1>
        <table className='min-w-full bg-white border border-gray-200'>
          <thead>
            <tr>
              <th className='py-2 px-4 border-b'>ID</th>
              <th className='py-2 px-4 border-b'>Name</th>
              <th className='py-2 px-4 border-b'>Phone Number</th>
              <th className='py-2 px-4 border-b'>Address</th>
              <th className='py-2 px-4 border-b'>Email</th>
            </tr>
          </thead>
          <tbody>
            {salesPersons.map((person) => (
              <tr key={person.id}>
                <td className='py-2 px-4 border-b text-center'>{person.id}</td>
                <td className='py-2 px-4 border-b text-center'>{person.name}</td>
                <td className='py-2 px-4 border-b text-center'>{person.phone_number}</td>
                <td className='py-2 px-4 border-b text-center'>{person.address || 'N/A'}</td>
                <td className='py-2 px-4 border-b text-center'>{person.email || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className='text-xl font-bold mt-8'>Add Sales Person</h2>
        <form className='mt-4' onSubmit={handleFormSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-700'>Name</label>
            <input
              type='text'
              name='name'
              value={newSalesPerson.name}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded'
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700'>Phone Number</label>
            <input
              type='text'
              name='phone_number'
              value={newSalesPerson.phone_number}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded'
              required
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700'>Address</label>
            <input
              type='text'
              name='address'
              value={newSalesPerson.address}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-gray-700'>Email</label>
            <input
              type='email'
              name='email'
              value={newSalesPerson.email}
              onChange={handleInputChange}
              className='w-full px-3 py-2 border border-gray-300 rounded'
            />
          </div>
          <button
            type='submit'
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700'
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
};

export default Sales;
