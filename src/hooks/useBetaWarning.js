import { useState, useEffect } from 'react';

const useBetaWarning = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('betaWarningDismissed');
    if (!hasDismissed) {
      setShowModal(true);
    }
  }, []);

  const dismissModal = () => {
    localStorage.setItem('betaWarningDismissed', 'true');
    setShowModal(false);
  };

  return { showModal, dismissModal };
};

export default useBetaWarning;