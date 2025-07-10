"use client";
import MissionPlan from "@/components/MissionPlan";
import StatusHeading from "@/components/StatusHeading";
import Link from "next/link";

export default function MissionPlanPage({
  missionPlanResponseData,
  lsiKeywordsApproveResponseData,
  competitorAnalysisData,
  valueAddResponseData,
  contentBriefResponseData,
  row_id,
  nextHref
}) {
  return (
    <div className="container px-4 py-6">
      <main className="main-content step-component">
        <StatusHeading status={lsiKeywordsApproveResponseData} />
        <h3 className="text-xl font-semibold mb-6 text-blue-600">
          Mission Plan Generator:
        </h3>
        <MissionPlan
          competitorAnalysisData={competitorAnalysisData}
          valueAddResponseData={valueAddResponseData}
          missionPlanResponseData={missionPlanResponseData}
          contentBriefResponseData={contentBriefResponseData}
          row_id={row_id}
        />
        <div className="mt-6 flex justify-end">
          <Link
            href={nextHref}
            className="nextButton text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Next
          </Link>
        </div>
      </main>
    </div>
  );
}
