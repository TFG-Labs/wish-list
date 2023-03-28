import React from 'react';
import ReactDOM from 'react-dom';
import ToastMessage from './Message';

function showSuccessToast(message: string) {
  const toast = document.createElement('div');
  document.body.appendChild(toast);
  ReactDOM.render(<ToastMessage message={message} type="add" />, toast);
  setTimeout(() => {
    ReactDOM.unmountComponentAtNode(toast);
    document.body.removeChild(toast);
  }, 5000);
}

function showRemoveToast(message: string) {
  const toast = document.createElement('div');
  document.body.appendChild(toast);
  ReactDOM.render(<ToastMessage message={message} type="remove" />, toast);
  setTimeout(() => {
    ReactDOM.unmountComponentAtNode(toast);
    document.body.removeChild(toast);
  }, 5000);
}


function showLoginToast(message: string) {
    const toast = document.createElement('div');
    document.body.appendChild(toast);
    ReactDOM.render(<ToastMessage message={message} type="login" />, toast);
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(toast);
      document.body.removeChild(toast);
    }, 5000);
  }


export { showSuccessToast, showRemoveToast, showLoginToast};
