import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClock, faList, faSquareCheck, faUserPlus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useHistory, } from 'react-router-dom';

interface SidebarProps {
    current_page: 'Home' | 'Pending' | 'To_Do' | 'Paid' | 'Review';
  }

const Sidebar: React.FC<SidebarProps> = ({ current_page }) => {
  const history = useHistory();
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [Name, setName] = useState<string | null>(null);
  const [Address, setAddress] = useState<string | null>(null);
  const [Phone, setPhone] = useState<string | null>(null);
  const [Email, setEmail] = useState<string | null>(null);

  const updateName = (Name: string) => {
    setName(Name)
  };
  const updateAddress = (Address: string) => {
    setAddress(Address)
  };
  const updatePhone = (Phone: string) => {
    setPhone(Phone)
  };
  const updateEmail = (Email: string) => {
    setEmail(Email)
  };
  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  const create_sales = async () => {
    if (Name) {
      try {
        const response = await fetch('http://127.0.0.1:8000/create-sales/', {
          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: Name,
            phone_number: Phone || null,
            address: Address || null,
            email: Email || null
          }),
        });
      
        if (response.ok) {
          console.log('Comment created successfully');
          setPopupVisible(false)
          window.location.reload();
        } else {
          console.error('Failed to create comment');
        }
      } catch (error) {
        console.error('Error creating comment:', error);
      }
      

    }
  };
  return (
    <div className='fixed left-0 py-20 top-0 h-screen w-20 bg-gray-300'>
      <div className='container flex flex-col h-full space-y-16 items-center justify-center'>
        <FontAwesomeIcon
          icon={faHome}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Home' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/home'); }}
        />
        <FontAwesomeIcon
          icon={faClock}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Pending' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/pending'); }}
        />
        <FontAwesomeIcon
          icon={faList}
          className={`w-7 h-7 cursor-pointer ${current_page === 'To_Do' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/to_do'); }}
        />
        <FontAwesomeIcon
          icon={faSquareCheck}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Paid' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/paid'); }}
        />
        <FontAwesomeIcon
            icon={faUserPlus}
            className='w-7 h-7 cursor-pointer text-black'
            onClick={togglePopup}
          />
        <FontAwesomeIcon
          icon={faPlus}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Review' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/review'); }}
        />
      </div>
      {isPopupVisible && (
        <div className='fixed inset-0  flex items-center justify-center bg-black bg-opacity-50'>
          <div className='flex flex-col w-1/2 h-1/2 bg-white rounded-xl p-2 space-y-8'>
            <div className='flex w-full justify-between'>
              <div
                  onClick={togglePopup}
                  className=' text-2xl pl-4'
                >
                  x
              </div>
            </div>
            <div className='flex h-13 space-x-3 w-full items-center justify-between px-2'>
              <div>Name : </div>
              <input
                className='w-10/12 p-2 bg-white border border-black rounded-lg'
                type="text"
                onChange={(e) => updateName(e.target.value)}
                placeholder='Name'
              />
            </div>
            <div className='flex h-13 space-x-3 w-full items-center justify-between px-2'>
              <div>Phone Number : </div>
              <input
                className='w-10/12 p-2 bg-white border border-black rounded-lg'
                type="number"
                onChange={(e) => updatePhone(e.target.value)}
                placeholder='Phone Number'
              />
            </div>
            <div className='flex h-13 space-x-3 w-full items-center justify-between px-2'>
              <div>Address : </div>
              <input
                className='w-10/12 p-2 bg-white border border-black rounded-lg'
                type="text"
                onChange={(e) => updateAddress(e.target.value)}
                placeholder='Address'
              />
            </div>
            <div className='flex h-13 space-x-3 w-full items-center justify-between px-2'>
              <div>Email : </div>
              <input
                className='w-10/12 p-2 bg-white border border-black rounded-lg'
                type="text"
                onChange={(e) => updateEmail(e.target.value)}
                placeholder='Email'
              />
            </div>
            <div className='flex w-full justify-center items-center'>
              <button
                  onClick={() => create_sales()}
                  className=' w-20 border border-black p-2  rounded'
                >
                  Create
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
    
  );
};

export default Sidebar;
