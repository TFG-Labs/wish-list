import React from 'react';
import styles from '../../css/toast-message.module.css';

interface IToastMessage {
  message: string;
  type: string;
}

function ToastMessage({ message, type }: IToastMessage) {
  return (
    <div className={styles.toastContainer}>
      <div className={styles.InnerItems}>
        <p>{message}</p>
        {type === 'add' && (
          <p>
            <a className={styles.wishListLink} href="/account#/wishlist">
              VIEW
            </a>
          </p>
        )}
        {type === 'login' && (
          <p>
            <a className={styles.wishListLink} href="https://bash.com/login?returnUrl=/">
              LOGIN
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default ToastMessage;
