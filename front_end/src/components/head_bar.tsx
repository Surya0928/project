import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';

const HeadBar: React.FC = () => {
  const history = useHistory();
  const upload_csv = () => {
    history.push('/')
  };
  return (
    <div className="fixed top-0 w-screen bg-gray-300 py-4 px-6 flex border border-gray-500 justify-between items-center">
      <div className="text-4xl font-bold flex-grow text-center">Be Paid</div>
      <FontAwesomeIcon
        icon={faCloudArrowUp}
        onClick={upload_csv}
        className="cursor-pointer w-10 h-10"
      />
    </div>
  );
};

export default HeadBar;
