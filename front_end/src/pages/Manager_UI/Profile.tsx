import React, { useState, useEffect } from 'react';
import Loading_Comp from '../../components/Loading';
import Manager_Side_Bar from '../../components/Manager_Components/Manager_Side_Bar';
import { useHistory } from 'react-router-dom';
import { useAppContext } from '../../components/app_variables';
import ManagerHeadBar from '../../components/Manager_Components/Manager_Head_Bar';


interface ManagerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  username: string;
}


const Manager_Profile: React.FC = () => {
  const history = useHistory();
  const { id, username } = useAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [managerData, setManagerData] = useState<ManagerData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      get_manager_data();
    }, 1000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  const get_manager_data = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://159.89.160.186/api/manager_data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setManagerData(data.manager_data);
        setLoading(false)
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className='flex h-screen w-screen justify-between items-center'>
      {loading && <Loading_Comp />}
      <Manager_Side_Bar current_page='Profile' />
      <div className='flex flex-col w-full h-screen'>
        <ManagerHeadBar />
        <div className='shadow-lg flex flex-col w-full h-5/6 px-10'>
          <div className='flex w-full py-5 items-center space-x-4'>
            <div className="bg-red-400 flex w-10 h-10 rounded-full items-center justify-center text-white cursor-pointer">
              {managerData?.username[0].toUpperCase()}
            </div>
            <div className='text-3xl'>My Account</div>
          </div>
          <div className='flex flex-col items-center w-full h-full text-gray-400 space-y-6'>
          <div className='flex w-full items-center justify-center space-x-6'>
              <div className='text-right w-1/3'>Name</div>
              <div className='text-left text-black w-2/3'>{managerData?.first_name} {managerData?.last_name}</div>
            </div>
            <div className='flex w-full items-center justify-center space-x-6'>
              <div className='text-right w-1/3'>User Name</div>
              <div className='text-left text-black w-2/3'>{managerData?.username}</div>
            </div>
            <div className='flex w-full items-center justify-center space-x-6'>
              <div className='text-right w-1/3'>Phone Number</div>
              <div className='text-left text-black w-2/3'>{managerData?.phone_number}</div>
            </div>
            <div className='flex w-full items-center justify-center space-x-6'>
              <div className='text-right w-1/3'>Email</div>
              <div className='text-left text-black w-2/3'>{managerData?.email}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager_Profile;
