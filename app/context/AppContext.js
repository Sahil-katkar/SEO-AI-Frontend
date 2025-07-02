"use client";

import { usePathname } from "next/navigation";
import React, { createContext, useState, useContext } from "react";
const AppContext = createContext();

export function AppProvider({ children }) {
  const pathName = usePathname();

  const STEPS = [
    { id: "step1", name: "Connect Google Drive", route: "/" },
    { id: "step2", name: "Analysis", route: "/analysis" },
    { id: "step3", name: "Rows", route: `${pathName === "/" ? "" : pathName}` },
    {
      id: "step4",
      name: "Content Brief",
      route: "/contentBrief/[file_id]/index",
    }, // Updated route
  ];

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
    activeModalTab: "Intent",
  });

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
