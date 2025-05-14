'use client'; // This is a client component

import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const STEPS = [
  { id: 'step1', name: 'Connect Google Drive' },
  { id: 'step2', name: 'Keywords & LSI' },
  { id: 'step3', name: 'Audience & Intent' },
  { id: 'step4', name: 'Outline Creation' },
  { id: 'step5', name: 'Content Parameters' },
];

export function AppProvider({ children }) {
  const [activeStep, setActiveStep] = useState(STEPS[0].id);
  const [projectData, setProjectData] = useState({
    projectName: '',
    gDriveFiles: [],
    selectedGDriveFile: null,
    primaryKeyword: '',
    lsiKeywords: [], // { text: string, checked: boolean }
    customKeywords: [], // { text: string, checked: boolean }
    targetAudience: '',
    primaryIntent: '',
    outline: '',
    toneOfVoice: '',
    wordCount: 1000,
    includeCTA: false,
    ctaText: '',
    generatedArticle: '',
  });

  const updateProjectData = (newData) => {
    setProjectData((prevData) => ({ ...prevData, ...newData }));
  };

  const value = {
    STEPS,
    activeStep,
    setActiveStep,
    projectData,
    updateProjectData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}