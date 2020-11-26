import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import JobBoard from './pages/JobBoard';
import JobSubmit from './pages/JobSubmit';
import {
  HashRouter as Router,
  Route
} from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
          <Route exact path="/" component = {JobBoard}/>
          <Route path="/job_board" component = {JobBoard}/>
          <Route path="/job_submit" component = {JobSubmit}/>
      </Router>
    </div>
  );
}

export default App;
