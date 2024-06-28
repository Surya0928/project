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

const Manager_Users: React.FC = () => {
  const history = useHistory();
  const { user_id, username } = useAppContext();
  const [all_users, set_all_users] = useState<Users[]>([]);
  const [inp_username, set_inp_username] = useState<string>('');
  const [inp_password, set_inp_password] = useState<string>('');
  const [inp_address, set_inp_address] = useState<string>('');
  const [inp_role, set_inp_role] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/all_users/', {
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

  const Create_User = async () => {
    try {
      const response = await fetch('http://165.232.188.250:8080/create_user/', {
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

  useEffect(() => {
    if (!user_id) {
      history.push('/');
    }
    fetchUsers();
  }, [user_id, history]);

  return (
    <div className='flex flex-col items-center overflow-y-auto w-screen h-screen space-y-10'>
      <div className='flex justify-between items-center bg-black w-full h-auto px-10 py-4'>
        <div className='text-3xl font-bold text-white'>{username}</div>
        <div className='flex space-x-14 items-center'>
          <FontAwesomeIcon icon={faHouse} className='text-white w-8 h-8 cursor-pointer' onClick={() => history.push('/manager/home')} />
          <FontAwesomeIcon icon={faPersonCirclePlus} className='text-blue-600 w-8 h-8 cursor-pointer' />
        </div>
      </div>
      <div className='w-full px-20 space-y-4'>
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
    </div>
  );
};

export default Manager_Users;
