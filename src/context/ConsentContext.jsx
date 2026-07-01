import React, { createContext, useContext, useState } from 'react';

const ConsentContext = createContext();

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};

const CONSENT_KEY = 'vindex_cookie_consent';
const CONSENT_VERSION = 1;

const DEFAULT_PREFERENCES = {
  essential: true, // Always true
  analytics: false,
  marketing: false,
  preferences: false,
};

const readStoredConsent = () => {
  const storedConsent = localStorage.getItem(CONSENT_KEY);
  if (!storedConsent) return null;

  try {
    const parsed = JSON.parse(storedConsent);
    // Check if consent expired (12 months)
    const consentDate = new Date(parsed.timestamp);
    const expirationDate = new Date(consentDate.setMonth(consentDate.getMonth() + 12));

    if (new Date() > expirationDate || parsed.version !== CONSENT_VERSION) {
      return null; // Expired or old version, re-prompt
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

export const ConsentProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => readStoredConsent()?.preferences ?? DEFAULT_PREFERENCES);
  const [hasConsented, setHasConsented] = useState(() => readStoredConsent() !== null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const saveConsent = (newPreferences) => {
    const consentObject = {
      preferences: {
        ...newPreferences,
        essential: true, // Force essential
      },
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentObject));
    setPreferences(consentObject.preferences);
    setHasConsented(true);
    setIsModalOpen(false);
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  return (
    <ConsentContext.Provider value={{
      preferences,
      hasConsented,
      isModalOpen,
      setIsModalOpen,
      saveConsent,
      acceptAll,
      rejectNonEssential
    }}>
      {children}
    </ConsentContext.Provider>
  );
};