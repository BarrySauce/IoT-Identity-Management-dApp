import React from 'react';
import ReactDOM from 'react-dom';
import './bootstrap.css'
import { BrowserRouter as Router, Switch, Route} from "react-router-dom";
import App from './components/App';
import Header from './components/Header';
import User from './components/User';
import Token from './components/Token';
import * as serviceWorker from './serviceWorker';

const Routing = () => {
  return(
    <Router>
      <div>
        <p>
          <br></br>
        </p>
      </div>
      <Header/>
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/user" component={User} />
        <Route path="/token" component={Token} />
      </Switch>
    </Router>
  )
}


ReactDOM.render(
  <React.StrictMode>
    <Routing />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
