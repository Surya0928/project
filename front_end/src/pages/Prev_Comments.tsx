import React, { useState, useEffect } from 'react';
import HeadBar from '../components/head_bar';
import { AccountInfo, InvoiceDetail, CommentInfo } from '../models';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faPencil , faSquarePlus, faUser } from '@fortawesome/free-solid-svg-icons';


const Previous_Comments: React.FC = () => {

  return (
    <div className='flex w-screen justify-between  items-center'>
      <div className='fixed left-0 pt-12 top-0 h-screen w-20 bg-blue-500 '>
        <div className='container flex flex-col space-y-4 items-center justify-center'>
          <FontAwesomeIcon icon={faUser} className='w-5 h-5 text-blue-500 bg-black' />
        </div>
      </div>
    </div>
  );
};

export default Previous_Comments;
