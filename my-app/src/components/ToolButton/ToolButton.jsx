import React from 'react';
import PropTypes from 'prop-types';
import styles from './ToolButton.module.css';

/**
 * ToolButton component props
 * @typedef {Object} ToolButtonProps
 * @property {string} name - Tool name
 * @property {string} [icon] - Tool icon
 * @property {boolean} [hasNotification] - Whether to show notification dot
 * @property {number} [notificationCount] - Notification count
 * @property {boolean} [active] - Whether the button is active
 * @property {string} [size] - Button size (small, medium, large)
 * @property {string} [variant] - Button variant (default, outline, ghost)
 * @property {function} [onClick] - Click handler
 * @property {boolean} [disabled] - Whether the button is disabled
 * @property {Object} [styles] - Custom styles
 */

/**
 * ToolButton component - Reusable tool button
 * @param {ToolButtonProps} props
 * @returns {JSX.Element}
 */
const ToolButton = ({
  name,
  icon,
  hasNotification = false,
  notificationCount = 0,
  active = false,
  size = 'medium',
  variant = 'default',
  onClick,
  disabled = false,
  styles: customStyles = {}
}) => {
  const buttonClass = `${styles['tool-button']} ${styles[size]} ${styles[variant]} ${active ? styles.active : ''} ${hasNotification ? styles['has-notification'] : ''}`;

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e, name);
    }
  };

  return (
    <button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled}
      style={customStyles}
      title={name}
    >
      {icon && <span className={styles['tool-icon']}>{icon}</span>}
      <span className={styles['tool-name']}>{name}</span>
      
      {hasNotification && (
        <div className={styles['notification-dot']}>
          {notificationCount > 0 && (
            <span className={styles['notification-count']}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

ToolButton.propTypes = {
  name: PropTypes.string.isRequired,
  icon: PropTypes.string,
  hasNotification: PropTypes.bool,
  notificationCount: PropTypes.number,
  active: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['default', 'outline', 'ghost']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  styles: PropTypes.object
};

export default ToolButton;