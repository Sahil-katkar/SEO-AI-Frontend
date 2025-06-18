"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step2_Rows() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Mock data for spreadsheet content simulation
  const MOCK_SPREADSHEET_DATA = {
    file1: [
      {
        id: "PK001",
        data: { topic: "Intro to AI", audience: "Beginners" },
        status: "Pending",
        details: {
          intent: "Informational",
          outline: "Generated Outline for PK001...",
          content: "Draft content for PK001...",
          logs: "Log entry 1 for PK001...",
        },
      },
      {
        id: "PK002",
        data: { topic: "Advanced Machine Learning", audience: "Experts" },
        status: "Processing",
        details: {
          intent: "Technical",
          outline: "",
          content: "",
          logs: "Processing started...",
        },
      },
      {
        id: "PK003",
        data: { topic: "AI Ethics", audience: "General" },
        status: "Success",
        details: {
          intent: "Discussion",
          outline: "Completed Outline for AI Ethics.",
          content: "Final content for AI Ethics.",
          logs: "Successfully processed.",
        },
      },
    ],
    file2: [
      {
        id: "KR001",
        data: { keyword: "green tea benefits", search_volume: 12000 },
        status: "Pending",
        details: { intent: "", outline: "", content: "", logs: "" },
      },
      {
        id: "KR002",
        data: { keyword: "oolong tea types", search_volume: 5000 },
        status: "Failed",
        details: {
          intent: "",
          outline: "",
          content: "",
          logs: "Error: API limit reached during analysis.",
        },
      },
    ],
    file3: [
      {
        id: "CI001",
        data: { idea: "Content Idea 1", priority: "High" },
        status: "Pending",
        details: {
          intent: "Brainstorming",
          outline: "",
          content: "",
          logs: "",
        },
      },
    ],
  };


  return (
    <div className="step-component">
      <h3>2. Rows inside your spreadsheet</h3>

      <div className="input-section">
        <h4>Rows:</h4>
      </div>

      {apiError && <div className="mt-2 text-red-500">Error: {apiError}</div>}

      {isLoading && <Loader />}

      {/* <div className="navigation mt-6">
        <button
          onClick={() => setActiveStep(STEPS[2].id)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Next: Outline Creation
        </button>
      </div> */}
    </div>
  );
}
