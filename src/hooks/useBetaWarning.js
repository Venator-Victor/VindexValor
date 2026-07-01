import { useState } from 'react';

const useBetaWarning = () => {
  const [showModal, setShowModal] = useState(() => !localStorage.getItem('betaWarningDismissed'));

  const dismissModal = () => {
    localStorage.setItem('betaWarningDismissed', 'true');
    setShowModal(false);
  };

  return { showModal, dismissModal };
};

export default useBetaWarning;