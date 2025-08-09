import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const Loading_Comp: React.FC = () => {
  return (
    <div className='flex z-40 w-screen h-screen justify-center items-center bg-gradient-to-r from-blue-400 to-purple-600 fixed top-0 left-0'>
      <div className='flex flex-col items-center justify-center space-y-8'>
        <div className='text-3xl font-bold text-white'>Vasool.ai</div>
        <FontAwesomeIcon 
          icon={faSpinner} 
          className='text-white text-3xl animate-spin'
        />
        <div className='text-white '>Loading...</div>
      </div>
    </div>
  );
};

export default Loading_Comp;
