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
  const [openStep, setOpenStep] = useState(0); // 0: first, 1: second, 2: third

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

        {(!competitorAnalysisData ||
          !valueAddResponseData ||
          !missionPlanResponseData) && <Loader />}

        <div className="flex flex-col gap-[16px]">
          {/* Step 1: Competitor Analysis */}
          <div className="mb-2">
            <button
              className={`w-full text-left px-4 py-2 font-semibold`}
              onClick={() => isStepEnabled(0) && setOpenStep(0)}
              disabled={!competitorAnalysisData}
            >
              1. Competitor Analysis
            </button>
            <div className={``}>
              <CompetitorAnalysis
                competitorAnalysisData={competitorAnalysisData}
                row_id={row_id}
              />
            </div>
          </div>

          {/* Step 2: Value Add */}
          <div className="rounded mb-2">
            <button
              className={`w-full text-left px-4 py-2 font-semibold`}
              onClick={() => isStepEnabled(1) && setOpenStep(1)}
              disabled={!competitorAnalysisData && !valueAddResponseData}
            >
              2. Value Add
            </button>
            <div
              className={`accordion-content${openStep === 1 ? " open" : "p-4"}`}
            >
              <ValueAdd
                competitorAnalysisData={competitorAnalysisData}
                valueAddResponseData={valueAddResponseData}
                row_id={row_id}
              />
            </div>
          </div>

          {/* Step 3: Mission Plan */}
          <div className="rounded mb-2">
            <button
              className={`w-full text-left px-4 py-2 font-semibold`}
              onClick={() => isStepEnabled(2) && setOpenStep(2)}
              disabled={!missionPlanResponseData}
            >
              3. Mission Plan
            </button>
            <div
              className={`accordion-content${openStep === 2 ? " open" : "p-4"}`}
            >
              <MissionPlan
                competitorAnalysisData={competitorAnalysisData}
                valueAddResponseData={valueAddResponseData}
                missionPlanResponseData={missionPlanResponseData}
                row_id={row_id}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href={`/content/${fileId}/${index}`}
              // onClick={handleNext}
              className="next block text-white px-6 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={
                !projectData.isCompetitorAnalysisFetched &&
                !projectData.isValueAddFetched &&
                !projectData.isMissionPlanFetched
              }
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
