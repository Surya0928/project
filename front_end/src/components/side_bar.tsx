import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClock, faList, faSquareCheck, faUserPlus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useHistory, } from 'react-router-dom';

interface SidebarProps {
    current_page: 'Home' | 'Pending' | 'To_Do' | 'Paid' | 'Review' | 'Sales';
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
            className={`w-7 h-7 cursor-pointer ${current_page === 'Sales' ? 'text-blue-600' : 'text-black'}`}
            onClick={() => { history.push('/sales'); }}
          />
        <FontAwesomeIcon
          icon={faPlus}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Review' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/review'); }}
        />
      </div>
    </div>
    
  );
};

export default Sidebar;
