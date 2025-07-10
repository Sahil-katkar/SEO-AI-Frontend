import AnalysisPage from "./AnalysisPage";

export default async function Analysis({ params }) {
  const { file_id, index } = await params;
  const row_id = `${file_id}_${index}`;

  // !-------------------------------------------
  const competitorAnalysisResponse = await fetch(
    `http://localhost:3000/api/supabase/competitor-analysis/${row_id}`
  );
  if (!competitorAnalysisResponse.ok) {
    throw new Error("competitorAnalysisResponse: Network response was not ok");
  }
  const competitorAnalysisData = await competitorAnalysisResponse.json();

  // !-------------------------------------------
  const valueAddResponse = await fetch(
    `http://localhost:3000/api/supabase/value-add/${row_id}`
  );

  if (!valueAddResponse.ok) {
    throw new Error("valueAddResponse: Network response was not ok");
  }
  const valueAddResponseData = await valueAddResponse.json();

  // !-------------------------------------------
  const missionPlanResponse = await fetch(
    `http://localhost:3000/api/supabase/mission-plan/${row_id}`
  );

  if (!missionPlanResponse.ok) {
    throw new Error("missionPlanResponse: Network response was not ok");
  }
  const missionPlanResponseData = await missionPlanResponse.json();

  // !-------------------------------------------
  const lsiKeywordsApproveResponse = await fetch(
    `http://localhost:3000/api/supabase/lsi-keywords-approve/${row_id}`
  );

  if (!lsiKeywordsApproveResponse.ok) {
    throw new Error("lsiKeywordsApproveResponse: Network response was not ok");
  }
  const lsiKeywordsApproveResponseData =
    await lsiKeywordsApproveResponse.json();

  return (
    <>
      <AnalysisPage
        competitorAnalysisData={competitorAnalysisData.comp_analysis}
        valueAddResponseData={valueAddResponseData.value_add}
        missionPlanResponseData={missionPlanResponseData.mission_plan}
        lsiKeywordsApproveResponseData={lsiKeywordsApproveResponseData[0].status}
      />
    </>
  );
}
