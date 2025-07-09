"use client";

// import { usePathname } from "next/navigation"; // <-- REMOVE THIS LINE
import React, { createContext, useState, useContext } from "react";
const AppContext = createContext();

export function AppProvider({ children }) {
  // const pathName = usePathname(); // <-- REMOVE THIS LINE

  const [projectData, setProjectData] = useState({
    projectName: "",
    gDriveFiles: [],
    selectedGDriveFile: null,
    primaryKeyword: "",
    lsiKeywords: [],
    customKeywords: [],
    targetAudience: "",
    primaryIntent: "",
    outline: "",
    toneOfVoice: "",
    wordCount: 1000,
    includeCTA: false,
    ctaText: "",
    generatedArticle: "",
    isGDriveConnected: false,
    isModalOpen: false,
    activeModalRowIndex: null,
    activeModalTab: "Outline",
    selectedFileId: "",
    selectedRowIndex: "",
    isCompetitorAnalysisFetched: false,
    isValueAddFetched: false,
    isMissionPlanFetched: false,
  });

  const STEPS = [
    { id: "step1", name: "Connect Google Drive", route: "/" },
    ,
    {
      id: "step2",
      name: "Keywords",
      route: "keywords",
      selectedFileId: projectData.selectedFileId,
      selectedRowIndex: projectData.selectedRowIndex,
    },
    {
      id: "step3",
      name: "LSI Keywords",
      route: "lsi-keywords",
      selectedFileId: projectData.selectedFileId,
      selectedRowIndex: projectData.selectedRowIndex,
    },
    {
      id: "step4",
      name: "Mission Plan",
      route: "mission-plan",
      selectedFileId: projectData.selectedFileId,
      selectedRowIndex: projectData.selectedRowIndex,
    },
    {
      id: "step5",
      name: "Analysis",
      route: "analysis",
      selectedFileId: projectData.selectedFileId,
      selectedRowIndex: projectData.selectedRowIndex,
    },
    {
      id: "step6",
      name: "Content",
      route: "content",
      selectedFileId: projectData.selectedFileId,
      selectedRowIndex: projectData.selectedRowIndex,
    },
  ];

  const updateProjectData = (newData) => {
    setProjectData((prevData) => ({ ...prevData, ...newData }));
  };

  const value = {
    STEPS,
    projectData,
    updateProjectData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
