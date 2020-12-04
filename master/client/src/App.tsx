import React from 'react';
import './App.css';
import './pages/page.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import JobBoard from './pages/JobBoard';
import JobSubmit from './pages/JobSubmit';
import {
  HashRouter as Router,
  Route,
  NavLink
} from 'react-router-dom';

import { CSSTransition } from 'react-transition-group'
import { Navbar, Nav } from 'react-bootstrap'

function App() {
  const routes = [
    { path: '/', name: 'Home', Component: JobBoard },
    { path: '/job_board', name: 'Job Board', Component: JobBoard },
    { path: '/job_submit', name: 'Submit Jobs', Component: JobSubmit },
  ];

  return (
    <div className="App">
      <Router>
        <>
          <Navbar bg="light">
            <Nav className="mx-auto">
              {routes.map(route => (
                <Nav.Link
                  key={route.path}
                  as={NavLink}
                  to={route.path}
                  activeClassName="active"
                  exact
                >
                  {route.name}
                </Nav.Link>
              ))}
            </Nav>
          </Navbar>
          
          <div>
            {routes.map(({ path, Component }) => (
              <Route key={path} exact path={path}>
                {({ match }) => (
                  <CSSTransition
                    in={match != null}
                    timeout={300}
                    classNames='page'
                    unmountOnExit
                  >
                    <div className='page'>
                      <Component />
                    </div>
                  </CSSTransition>
                )}
              </Route>
            ))}
          </div>
        </>
      </Router>
    </div>
  );
}

export default App;
