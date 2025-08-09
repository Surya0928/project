import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClock, faList, faSquareCheck, faUserPlus, faRegistered, faDownLeftAndUpRightToCenter, faUpRightAndDownLeftFromCenter, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { useHistory, } from 'react-router-dom';

interface SidebarProps {
    current_page: 'Home' | 'Pending' | 'To_Do' | 'Paid' | 'Review' | 'Sales';
  }

const Sidebar: React.FC<SidebarProps> = ({ current_page }) => {
  const history = useHistory();
  const [toggle_side_bar, set_toggle_side_bar] = useState<boolean>(false);

  return (
    <div>
      {!toggle_side_bar ? (
        <div className='relative z-20 py-4 h-screen w-52 bg-gray-800 text-white'>
          <div className='flex flex-col h-full justify-between items-center'>
            <div className='flex flex-col h-full space-y-5 items-center'>
              <div className='flex w-48 border-b border-gray-900 h-12 justify-between items-center px-4'>
                <div className='text-2xl font-semibold'>Vasool.ai</div>
                <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500' onClick={()=>{set_toggle_side_bar(true)}}>
                  <FontAwesomeIcon
                    icon={faDownLeftAndUpRightToCenter}
                    className='font-normal'
                  />
                </div>
              </div>
              <div className='flex w-full flex-col space-y-3 px-2'>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'Home' ? '#10806f' : ''}} onClick={() => { history.push('/home'); }}>
                  <FontAwesomeIcon
                    icon={faHome}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>Home</div>
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'Pending' ? '#10806f' : ''}} onClick={() => { history.push('/pending'); }}>
                  <FontAwesomeIcon
                    icon={faClock}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>Pending Invoices</div>
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'To_Do' ? '#10806f' : ''}} onClick={() => { history.push('/to_do'); }}>
                  <FontAwesomeIcon
                    icon={faList}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>To Do Invoices</div>
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'Paid' ? '#10806f' : ''}} onClick={() => { history.push('/paid'); }}>
                  <FontAwesomeIcon
                    icon={faSquareCheck}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>Paid Invoices</div>
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'Sales' ? '#10806f' : ''}} onClick={() => { history.push('/sales'); }}>
                  <FontAwesomeIcon
                    icon={faUserPlus}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>Sales Persons</div>
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg space-x-4 cursor-pointer`} style={{backgroundColor: current_page === 'Review' ? '#10806f' : ''}} onClick={() => { history.push('/review'); }}>
                  <FontAwesomeIcon
                    icon={faRegistered}
                    className={`w-6 h-6`}
                  />
                  <div className='text-sm font-light'>Review Invoices</div>
                </div>
              </div>
            </div>
            <div className={`border-t border-gray-900 hover:bg-green-500 flex w-full items-center h-auto px-4 py-2 rounded-lg space-x-4 cursor-pointer`} onClick={()=>{history.push('/csv_add')}}>
            <FontAwesomeIcon
              icon={faCloudArrowUp}
              className="cursor-pointer w-7 h-7"
            />
              <div className='text-sm font-light'>Update Data</div>
            </div>
          </div>
        </div>
      ) : (
        <div className='relative z-20 py-4 h-screen w-16 bg-gray-800 text-white'>
          <div className='flex flex-col h-full justify-between items-center'>
            <div className='flex flex-col h-full space-y-5 items-center w-full px-2'>
              <div className='flex w-16 px-4 border-b border-gray-900 h-12 justify-center items-center'>
                <div className='container cursor-pointer w-auto rounded-lg p-2 hover:bg-green-500' onClick={()=>{set_toggle_side_bar(false)}}>
                  <FontAwesomeIcon
                    icon={faUpRightAndDownLeftFromCenter}
                    className='font-normal'
                  />
                </div>
              </div>
              <div className='flex w-full flex-col space-y-3'>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'Home' ? '#10806f' : ''}} onClick={() => { history.push('/home'); }}>
                  <FontAwesomeIcon
                    icon={faHome}
                    className={`w-6 h-6`}
                  />
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'Pending' ? '#10806f' : ''}} onClick={() => { history.push('/pending'); }}>
                  <FontAwesomeIcon
                    icon={faClock}
                    className={`w-6 h-6`}
                  />
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'To_Do' ? '#10806f' : ''}} onClick={() => { history.push('/to_do'); }}>
                  <FontAwesomeIcon
                    icon={faList}
                    className={`w-6 h-6`}
                  />
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'Paid' ? '#10806f' : ''}} onClick={() => { history.push('/paid'); }}>
                  <FontAwesomeIcon
                    icon={faSquareCheck}
                    className={`w-6 h-6`}
                  />
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'Sales' ? '#10806f' : ''}} onClick={() => { history.push('/sales'); }}>
                  <FontAwesomeIcon
                    icon={faUserPlus}
                    className={`w-6 h-6`}
                  />
                </div>
                <div className={`container hover:bg-green-500 flex w-full items-center h-auto px-2 py-2 rounded-lg justify-center cursor-pointer`} style={{backgroundColor: current_page === 'Review' ? '#10806f' : ''}} onClick={() => { history.push('/review'); }}>
                  <FontAwesomeIcon
                    icon={faRegistered}
                    className={`w-6 h-6`}
                  />
                </div>
              </div>
            </div>
            
            <div className={`flex border-t border-gray-900 justify-center w-full items-center px-2 py-2  cursor-pointer`} onClick={()=>{history.push('/csv_add')}}>
              <div className='flex w-full p-2 hover:bg-green-500 rounded-lg'>
                <FontAwesomeIcon
                  icon={faCloudArrowUp}
                  className="cursor-pointer w-7 h-7"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
