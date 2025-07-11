"use client";
import Loader from "@/components/common/Loader";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import MissionPlan from "@/components/MissionPlan";
import StatusHeading from "@/components/StatusHeading";
import ValueAdd from "@/components/ValueAdd";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ToastContainer } from "react-toastify";

export default function AnalysisPage({
  competitorAnalysisData,
  valueAddResponseData,
  missionPlanResponseData,
  lsiKeywordsApproveResponseData,
}) {
  const { projectData, updateProjectData } = useAppContext();
  const params = useParams();
  // const [openStep, setOpenStep] = useState(0); // 0: first, 1: second, 2: third
  const [openSteps, setOpenSteps] = useState({
    competitor: false,
    valueAdd: false,
    missionPlan: false,
  });

  const toggleStep = (step) => {
    setOpenSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  const isStepEnabled = (step) => {
    if (step === 0) return true;
    if (step === 1) return projectData.isCompetitorAnalysisFetched;
    if (step === 2) return projectData.isValueAddFetched;
    return false;
  };

  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;

  return (
    <div className="container px-4 py-6">
      <main className="main-content step-component">
        <StatusHeading status={lsiKeywordsApproveResponseData} />

        <h3 className="text-xl font-semibold mb-6 text-blue-600">Analysis</h3>
        {/* 
        {(!competitorAnalysisData ||
          !valueAddResponseData ||
          !missionPlanResponseData) && <Loader />} */}

        <div className="flex flex-col gap-[16px]">
          {/* Step 1: Competitor Analysis */}
          <div className="mb-2">
            <button
              className={`w-full text-left px-4 py-2 font-semibold flex justify-between items-center ${openSteps.competitor ? "bg-blue-100" : "bg-white"
                }`}
              onClick={() => toggleStep("competitor")}
              aria-expanded={openSteps.competitor}
              aria-controls="competitor-analysis-panel"
              id="competitor-analysis-header"
              disabled={!competitorAnalysisData}
              type="button"
            >
              <span>1. Competitor Analysis</span>
              <span>{openSteps.competitor ? "▲" : "▼"}</span>
            </button>
            <div
              id="competitor-analysis-panel"
              role="region"
              aria-labelledby="competitor-analysis-header"
              className={`overflow-hidden transition-all duration-300 ${openSteps.competitor ? "max-h-[1000px] p-4" : "max-h-0 p-0"
                }`}
              style={{ display: openSteps.competitor ? "block" : "none" }}
            >
              {openSteps.competitor && (
                <CompetitorAnalysis
                  competitorAnalysisData={competitorAnalysisData}
                  row_id={row_id}
                />
              )}
            </div>
          </div>

          {/* Step 2: Value Add */}
          <div className="mb-2 ">
            <button
              className={`w-full text-left px-4 py-2 font-semibold flex justify-between items-center ${openSteps.valueAdd ? "bg-blue-100" : "bg-white"
                }`}
              onClick={() => toggleStep("valueAdd")}
              aria-expanded={openSteps.valueAdd}
              aria-controls="value-add-panel"
              id="value-add-header"
              disabled={!competitorAnalysisData && !valueAddResponseData}
              type="button"
            >
              <span>2. Value Add</span>
              <span>{openSteps.valueAdd ? "▲" : "▼"}</span>
            </button>
            <div
              id="value-add-panel"
              role="region"
              aria-labelledby="value-add-header"
              className={`overflow-hidden transition-all duration-300 ${openSteps.valueAdd ? "max-h-[1000px] p-4" : "max-h-0 p-0"
                }`}
              style={{ display: openSteps.valueAdd ? "block" : "none" }}
            >
              {openSteps.valueAdd && (
                <ValueAdd
                  competitorAnalysisData={competitorAnalysisData}
                  valueAddResponseData={valueAddResponseData}
                  row_id={row_id}
                />
              )}
            </div>
          </div>

          {/* Step 3: Mission Plan */}
          <div className="mb-2 ">
            <button
              className={`w-full text-left px-4 py-2 font-semibold flex justify-between items-center ${openSteps.missionPlan ? "bg-blue-100" : "bg-white"
                }`}
              onClick={() => toggleStep("missionPlan")}
              aria-expanded={openSteps.missionPlan}
              aria-controls="mission-plan-panel"
              id="mission-plan-header"
              disabled={!missionPlanResponseData}
              type="button"
            >
              <span>3. Mission Plan</span>
              <span>{openSteps.missionPlan ? "▲" : "▼"}</span>
            </button>
            <div
              id="mission-plan-panel"
              role="region"
              aria-labelledby="mission-plan-header"
              className={`overflow-hidden transition-all duration-300 ${openSteps.missionPlan ? "max-h-[1000px] p-4" : "max-h-0 p-0"
                }`}
              style={{ display: openSteps.missionPlan ? "block" : "none" }}
            >
              {openSteps.missionPlan && (
                <MissionPlan
                  competitorAnalysisData={competitorAnalysisData}
                  valueAddResponseData={valueAddResponseData}
                  missionPlanResponseData={missionPlanResponseData}
                  row_id={row_id}
                />
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href={`/content/${fileId}/${index}`}
              className={`${false
                ? "hover:!cursor-not-allowed !pointer-events-none !bg-[#bdc3c7]"
                : ""
                } nextButton text-white px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            // className={isDisabled ? "pointer-events-none" : ""}
            // aria-disabled={true}
            // tabIndex={true ? -1 : undefined}
            >
              Next
            </Link>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
