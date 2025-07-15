import ContentPage from "./ContentPage";

export default async function Content({ params }) {
  const { file_id, index } = await params;
  const row_id = `${file_id}_${index}`;

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

  // !-------------------------------------------
  const newOutlineResponse = await fetch(
    `http://localhost:3000/api/supabase/new-outline/${row_id}`
  );
  if (!newOutlineResponse.ok) {
    throw new Error("newOutlineResponse: Network response was not ok");
  }
  const newOutlineResponseData = await newOutlineResponse.json();

  // !-------------------------------------------
  const citableSummaryResponse = await fetch(
    `http://localhost:3000/api/supabase/citable-summary/${row_id}`
  );
  if (!citableSummaryResponse.ok) {
    throw new Error("citableSummaryResponse: Network response was not ok");
  }
  const citableSummaryResponseData = await citableSummaryResponse.json();

  // !-------------------------------------------
  const articleOutcomeResponse = await fetch(
    `http://localhost:3000/api/supabase/article-outcome/${row_id}`
  );
  if (!citableSummaryResponse.ok) {
    throw new Error("articleOutcomeResponse: Network response was not ok");
  }
  const articleOutcomeResponseData = await articleOutcomeResponse.json();

  // !-------------------------------------------
  const intentResponse = await fetch(
    `http://localhost:3000/api/supabase/intent/${row_id}`
  );
  if (!intentResponse.ok) {
    throw new Error("intentResponse: Network response was not ok");
  }
  const intentResponseData = await intentResponse.json();

  // !-------------------------------------------
  const updatedArticleResponse = await fetch(
    `http://localhost:3000/api/supabase/updated-article/${row_id}`
  );
  if (!intentResponse.ok) {
    throw new Error("updatedArticleResponse: Network response was not ok");
  }
  const updatedArticleResponseData = await updatedArticleResponse.json();
  

  return (
    <>
      <ContentPage
        missionPlanResponseData={missionPlanResponseData.mission_plan}
        lsiKeywordsApproveResponseData={
          lsiKeywordsApproveResponseData[0].status
        }
        newOutlineResponseData={newOutlineResponseData.new_outline}
        row_id={row_id}
        file_id={index}
        index={index}
        citableSummaryResponseData={citableSummaryResponseData.citable_answer}
        articleOutcomeResponseData={articleOutcomeResponseData.article_outcome}
        intentResponseData={intentResponseData.intent}
        updatedArticleResponseData={updatedArticleResponseData.updated_article}
      />
    </>
  );
}
