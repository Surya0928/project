import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import ManagerHeadBar from '../../components/Manager_Components/Manager_Head_Bar';  // Assuming these components already exist
import Manager_Side_Bar from '../../components/Manager_Components/Manager_Side_Bar';
import Loading_Comp from '../../components/Loading';

const ConnectTally: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const history = useHistory();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const user_id = sessionStorage.getItem('id'); // Fetch user id from sessionStorage

      const response = await fetch('http://159.89.160.186/api/process_uploaded_csv/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user_id,
          url: url,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        alert('CSV data processed and imported successfully!');
      } else {
        setError('Something went wrong. Make sure you have done all the steps right');
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-y-auto no-scrollbar">
      {loading && <Loading_Comp />}
      <Manager_Side_Bar current_page='Instructions'/>

      {/* Main content */}
      <div className="flex flex-col w-full h-full justify-between">
        <ManagerHeadBar /> {/* Reuse the same headbar as Manager_DashBoard */}

        <div className="flex flex-col h-full overflow-y-auto no-scrollbar w-full py-2 bg-gray-100 px-10">
          <div className="bg-white rounded-lg shadow-md w-full space-y-4 p-3">
            <h1 className="text-2xl font-semibold text-gray-700">Connect to Tally Prime via Ngrok</h1>

            <h2 className="text-xl font-semibold">Step 1: Tally Prime Server</h2>
            <p className="text-gray-600">
              1. Open **Tally Prime**.<br/>
              2. Go to **Help**.<br/>
              3. Select **Settings**.<br/>
              4. Click on **Connectivity**.<br/>
              5. Choose **Client/Server Configuration**.<br/>
              6. Set **ODBC** to **Yes**.<br/>
              7. Ensure the port is set to **9000**.<br/>
            </p>

            <h2 className="text-xl font-semibold">Step 2: Download and Setup Ngrok</h2>
            <p className="text-gray-600">
              1. Go to the **Ngrok website**: <a href="https://ngrok.com/download" target="_blank" className="text-blue-500">https://ngrok.com/download</a><br/>
              2. **Download Ngrok** for your platform (Windows, Mac, Linux).<br/>
              3. **Unzip** the downloaded file.<br/>
              4. Place **ngrok.exe** (for Windows) or the extracted folder (for Mac/Linux) in a directory of your choice.<br/>
            </p>

            <h3 className="text-lg font-semibold">Set up Ngrok</h3>
            <p className="text-gray-600">
              1. Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux).<br/>
              2. Navigate to the directory where Ngrok is located.<br/>
              &nbsp;&nbsp; - Example for Windows:
              <pre className="bg-gray-100 p-2 rounded-lg text-sm">
                cd path\to\ngrok
              </pre>
              &nbsp;&nbsp; - Example for Mac/Linux:
              <pre className="bg-gray-100 p-2 rounded-lg text-sm">
                cd /path/to/ngrok
              </pre>
            </p>

            <h3 className="text-lg font-semibold">Run Ngrok to Expose Local Server</h3>
            <p className="text-gray-600">
              1. Run the following command to expose your local server (port 9000 for Tally Prime):
              <pre className="bg-gray-100 p-2 rounded-lg text-sm">
                ngrok http 9000
              </pre>
              2. You’ll see output with a forwarding URL, similar to:
              <pre className="bg-gray-100 p-2 rounded-lg text-sm">
                Forwarding  https://be36-2405-201-c019-8076-78ad-aea1-c3d0-8e7c.ngrok-free.app -{'>'} http://localhost:9000
              </pre>
              3. **Copy** the forwarding URL (e.g., `https://be36-2405-201-c019-8076-78ad-aea1-c3d0-8e7c.ngrok-free.app`).
            </p>

            <h2 className="text-xl font-semibold">Step 3: Enter the Ngrok URL</h2>
            <p className="text-gray-600">Paste the copied Ngrok forwarding URL in the following input box:</p>

            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter Ngrok URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <h2 className="text-xl font-semibold">Step 4: Connect</h2>
            <p className="text-gray-600">Click the **Connect** button to link Tally Prime via the provided URL.</p>

            <button
              className="w-full bg-gradient-to-r from-blue-400 to-purple-600 text-white py-2 rounded-lg "
              onClick={handleConnect}
              disabled={loading || !url}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>

            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">Connection successful!</p>}

            <div className="text-blue-500 cursor-pointer mt-6" onClick={() => history.push('/manager/dashboard')}>
              Go Back to Dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectTally;
