import React from 'react';

const Error404: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '24px',
      color: '#999'
    }}>
      404 - Page Not Found
    </div>
  );
};

export default Error404;
