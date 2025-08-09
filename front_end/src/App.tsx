// App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Accountant_Dashboard from './pages/Accountant_UI/Dashboard';
import Accountant_Customers from './pages/Accountant_UI/Customers';
import Pending_Accountant_Customers from './pages/Accountant_UI/Pending_Customers';
import Accountant_Invoices from './pages/Accountant_UI/Invoices';
import Pending_Accountant_Invoices from './pages/Accountant_UI/Pending_Invoices';
import Paid_Accountant_Invoices from './pages/Accountant_UI/Paid_Invoices';
// import Dashboard from './pages/Dashboard';
import CSVUploadPage from './pages/upload_csv';
import Pending from './pages/Pending';
import Paid from './pages/Paid';
import To_Do from './pages/To_Do';
import Login from './pages/Login';
import Review from './pages/Review';
import Sales from './pages/Sales';
import { AppProvider } from './components/app_variables';
import SignUpPage from './pages/SignUpPage';
import BusinessInfoPage from './pages/Business_Info_Page';
import Manager_DashBoard from './pages/Manager_UI/Dashboard';
import Manager_Profile from './pages/Manager_UI/Profile';
import Manager_Customers from './pages/Manager_UI/Customers';
import Manager_Invoices from './pages/Manager_UI/Invoices';
import ConnectTally from './pages/Manager_UI/Instructions';
import Manager_Accountants from './pages/Manager_UI/AR_Accountant';
import Manager_Sales_Persons from './pages/Manager_UI/Sales_Persons';
import './global.css'; //
import './index.css'; //

const App: React.FC = () => {
  return (
    <Router>
      <AppProvider>
      <div>
        {/* Header or Navigation Bar (if needed) */}
        <Switch>
          {/* Route for Dashboard Page */}
          <Route exact path="/" component={Login} />
          <Route exact path="/signup" component={SignUpPage} />
          <Route exact path="/business_information" component={BusinessInfoPage} />
          <Route exact path="/manager/dashboard" component={Manager_DashBoard} />
          <Route exact path="/manager/customers" component={Manager_Customers} />
          <Route exact path="/manager/invoices" component={Manager_Invoices} />
          <Route exact path="/manager/profile" component={Manager_Profile} />
          <Route exact path="/manager/instructions" component={ConnectTally} />
          <Route exact path="/manager/accountants" component={Manager_Accountants} />
          <Route exact path="/manager/sales_persons" component={Manager_Sales_Persons} />
          <Route exact path="/accountant/dashboard" component={Accountant_Dashboard} />
          <Route exact path="/accountant/customers" component={Accountant_Customers} />
          <Route exact path="/accountant/pending_customers" component={Pending_Accountant_Customers} />
          <Route exact path="/accountant/invoices" component={Accountant_Invoices} />
          <Route exact path="/accountant/pending_invoices" component={Pending_Accountant_Invoices} />
          <Route exact path="/accountant/paid_invoices" component={Paid_Accountant_Invoices} />
          <Route path="/csv_add" component={CSVUploadPage} />
          {/* Route for CSV Upload Page */}
          {/* <Route path="/home" component={Dashboard} />
          <Route path="/pending" component={Pending} />
          <Route path="/paid" component={Paid} />
          <Route path="/to_do" component={To_Do} />
          <Route path="/review" component={Review} />
          <Route path="/sales" component={Sales} />
          <Route path="/manager/home" component={Manager_Dashboard} />
          <Route path="/manager/add_users" component={Manager_Users} /> */}
          {/* Other routes if needed */}

        </Switch>
      </div>
      </AppProvider>
    </Router>
  );
};

export default App;
