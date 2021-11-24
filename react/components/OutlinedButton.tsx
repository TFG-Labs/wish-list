import React from "react";
import styles from "../css/outlined-button.module.css";
import LoadingSpinner from "./LoadingSpinner";


type OutlinedButtonProps = {
  children: React.ReactNode,
  disabled?: boolean,
  loading: boolean,
  block?: boolean,
  onClick: React.MouseEventHandler<HTMLButtonElement>,
  icon?: React.ReactNode
}

function OutlinedButton ({
  icon,
  block = false,
  loading = false,
  disabled = false,
  onClick,
  children,
}: OutlinedButtonProps) {
  return (
    <button
      className={`${styles.outlinedButton} ${block ? styles.block : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? <LoadingSpinner /> : icon} <span className={styles.text}>{children}</span>
    </button>
  );
}

export default OutlinedButton;