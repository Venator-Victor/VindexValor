import React, { createContext, useContext, useState, useEffect } from 'react';

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

export const ConsentProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    analytics: false,
    marketing: false,
    preferences: false,
  });
  const [hasConsented, setHasConsented] = useState(true); // Default true to hide banner until checked
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        // Check if consent expired (12 months)
        const consentDate = new Date(parsed.timestamp);
        const expirationDate = new Date(consentDate.setMonth(consentDate.getMonth() + 12));
        
        if (new Date() > expirationDate || parsed.version !== CONSENT_VERSION) {
          setHasConsented(false); // Expired or old version, re-prompt
        } else {
          setPreferences(parsed.preferences);
          setHasConsented(true);
        }
      } catch (e) {
        setHasConsented(false);
      }
    } else {
      setHasConsented(false);
    }
  }, []);

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