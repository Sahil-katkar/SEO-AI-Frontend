"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

export default function FileRow() {
  const {
    projectData,
    updateProjectData,
    setActiveStep,
    STEPS,
    isModalOpen,
    activeModalRowIndex,
    activeModalTab,
  } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const params = useParams();
  //   const fileId = params.fileId;
  console.log(params);

  //   useEffect(() => {
  //     setIsLoading(true);
  //     const readSpreadSheet = async (fileId) => {
  //       const body = {
  //         file_id: fileId,
  //       };
  //       const readSpreadsheetData = await fetch(`/api/read-spreadsheet`, {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(body),
  //       });

  //       const readSpreadsheetData1 = await readSpreadsheetData.json();
  //       setKeywords(readSpreadsheetData1.keywords);
  //       setIsLoading(false);
  //       console.log("readSpreadsheetData1", readSpreadsheetData1);
  //     };
  //     readSpreadSheet(fileId);
  //   }, [fileId]);

  //   const ActiveStepComponent =
  //     stepComponents[activeStep] || (() => <div>Step not found</div>);
  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  console.log("activeModalTab", activeModalTab);

  return (
    <div className="container">
      <main className="main-content step-component">
        <h3 className="text-xl font-semibold mb-4 text-blue-500 pb-8">
          3. Row number {params.row}
        </h3>

        <div className="input-section">{/* <h4>Rows:</h4> */}</div>

        {apiError && <div className="mt-2 text-red-500">Error: {apiError}</div>}

        {isLoading && <Loader />}

        <div className="flex flex-col gap-[8px]">
          {true && (
            <div
            // className="modal-overlay"
            >
              <div
              // className="modal-content"
              // onClick={(e) => e.stopPropagation()}
              >
                {/* <div className="modal-header">
                  <h4>Details for:123</h4>
                  <button className="modal-close-button">×</button>
                </div> */}

                <div className="modal-tabs">
                  {["Logs", "Intent", "Outline", "Content"].map((tabName) => (
                    <button
                      key={tabName}
                      className={`modal-tab-button ${
                        projectData.activeModalTab === tabName ? "active" : ""
                      }`}
                      onClick={() => handleTabChange(tabName)}
                    >
                      {tabName}
                    </button>
                  ))}
                </div>

                <div className="modal-tab-content">
                  {projectData.activeModalTab === "Logs" && (
                    <div>
                      <pre>Processing Logs</pre>
                    </div>
                  )}
                  {projectData.activeModalTab === "Intent" && (
                    <div>
                      <pre>Generated Intent</pre>
                    </div>
                  )}
                  {projectData.activeModalTab === "Outline" && (
                    <div>
                      <pre>Generated Outline</pre>
                    </div>
                  )}
                  {projectData.activeModalTab === "Content" && (
                    <div>
                      <pre>Generated Content</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
