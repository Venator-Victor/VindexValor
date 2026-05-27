import React from 'react';
import { useConsent } from '@/context/ConsentContext';

const ConsentGuard = ({ type, children, fallback = null }) => {
  const { preferences, hasConsented } = useConsent();

  // If user hasn't made a choice yet, don't render non-essential features
  if (!hasConsented && type !== 'essential') {
    return fallback;
  }

  // Check specific consent type
  if (preferences[type] || type === 'essential') {
    return <>{children}</>;
  }

  return fallback;
};

export default ConsentGuard;