// App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import CSVUploadPage from './pages/upload_csv';

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
          
          {/* Other routes if needed */}
        </Switch>
      </div>
    </Router>
  );
};

export default App;
