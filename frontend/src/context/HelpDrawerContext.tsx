import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface HelpDrawerContextType {
  isOpen: boolean;
  activeSectionId: string | null;
  openDrawer: (sectionId?: string) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setActiveSectionId: (sectionId: string | null) => void;
}

const HelpDrawerContext = createContext<HelpDrawerContextType | undefined>(undefined);

export const HelpDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const openDrawer = useCallback((sectionId?: string) => {
    if (sectionId) {
      setActiveSectionId(sectionId);
    }
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing into an input, textarea, or contentEditable element
      const target = event.target as HTMLElement | null;
      const isInputField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      // Check for Shift + ? or '?' key
      if (!isInputField && (event.key === '?' || (event.shiftKey && event.key === '/'))) {
        event.preventDefault();
        toggleDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer, toggleDrawer]);

  return (
    <HelpDrawerContext.Provider
      value={{
        isOpen,
        activeSectionId,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setActiveSectionId,
      }}
    >
      {children}
    </HelpDrawerContext.Provider>
  );
};

export const useHelpDrawer = (): HelpDrawerContextType => {
  const context = useContext(HelpDrawerContext);
  if (!context) {
    // Provide safe fallback context for isolated tests
    return {
      isOpen: false,
      activeSectionId: null,
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      setActiveSectionId: () => {},
    };
  }
  return context;
};
