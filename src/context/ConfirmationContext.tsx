import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmationModal, { ConfirmationOptions } from '../components/ConfirmationModal';

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const confirm = useCallback((newOptions: ConfirmationOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <ConfirmationModal
          isOpen={isOpen}
          options={options}
          onClose={handleClose}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
