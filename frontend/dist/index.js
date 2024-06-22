import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './App';
import { reducer } from './reducers';
const store = createStore(reducer);
ReactDOM.render(React.createElement(Provider, { store: store },
    React.createElement(App, null)), document.getElementById('app'));
