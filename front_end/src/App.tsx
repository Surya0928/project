// App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import CSVUploadPage from './pages/upload_csv';
import Pending from './pages/Pending';
import Paid from './pages/Paid';
import To_Do from './pages/To_Do';

const App: React.FC = () => {
  return (
    <Router>
      <div>
        {/* Header or Navigation Bar (if needed) */}
        <Switch>
          {/* Route for Home Page */}
          <Route exact path="/" component={CSVUploadPage} />

          {/* Route for CSV Upload Page */}
          <Route path="/home" component={Home} />
          <Route path="/pending" component={Pending} />
          <Route path="/paid" component={Paid} />
          <Route path="/to_do" component={To_Do} />
          {/* Other routes if needed */}

        </Switch>
      </div>
    </Router>
  );
};

export default App;
