import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClock, faList, faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';

interface SidebarProps {
    current_page: 'Home' | 'Pending' | 'To_Do' | 'Paid';
  }

const Sidebar: React.FC<SidebarProps> = ({ current_page }) => {
  const history = useHistory();

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
          onClick={() => { history.push('/to_Do'); }}
        />
        <FontAwesomeIcon
          icon={faSquareCheck}
          className={`w-7 h-7 cursor-pointer ${current_page === 'Paid' ? 'text-blue-600' : 'text-black'}`}
          onClick={() => { history.push('/paid'); }}
        />
      </div>
    </div>
  );
};

export default Sidebar;
