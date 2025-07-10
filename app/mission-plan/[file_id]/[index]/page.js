import MissionPlanPage from "./MissionPlanPage";

export default async function MissionPlan({ params }) {
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
  const keywordResponse = await fetch(
    `http://localhost:3000/api/supabase/primary-keyword/${row_id}`
  );
  if (!keywordResponse.ok) {
    throw new Error("keywordResponse: Network response was not ok");
  }
  const keywordResponseData = await keywordResponse.json();

  // !-------------------------------------------
  const bussinessGoalResponse = await fetch(
    `http://localhost:3000/api/supabase/bussiness-goal/${row_id}`
  );

  if (!bussinessGoalResponse.ok) {
    throw new Error("bussinessGoalResponse: Network response was not ok");
  }
  const bussinessGoalResponseData = await bussinessGoalResponse.json();

  // !-------------------------------------------
  const targetAudienceResponse = await fetch(
    `http://localhost:3000/api/supabase/target-audience/${row_id}`
  );

  if (!targetAudienceResponse.ok) {
    throw new Error("targetAudienceResponse: Network response was not ok");
  }
  const targetAudienceResponseData = await targetAudienceResponse.json();

  // !-------------------------------------------
  const intentResponse = await fetch(
    `http://localhost:3000/api/supabase/intent/${row_id}`
  );

  if (!intentResponse.ok) {
    throw new Error("intentResponse: Network response was not ok");
  }
  const intentResponseData = await intentResponse.json();

  // !-------------------------------------------
  const articleOutcomeResponse = await fetch(
    `http://localhost:3000/api/supabase/article-outcome/${row_id}`
  );

  if (!articleOutcomeResponse.ok) {
    throw new Error("articleOutcomeResponse: Network response was not ok");
  }
  const articleOutcomeResponseData = await articleOutcomeResponse.json();

  // !-------------------------------------------
  const pillarResponse = await fetch(
    `http://localhost:3000/api/supabase/pillar/${row_id}`
  );

  if (!pillarResponse.ok) {
    throw new Error("pillarResponse: Network response was not ok");
  }
  const pillarResponseData = await pillarResponse.json();

  // !-------------------------------------------
  const clusterResponse = await fetch(
    `http://localhost:3000/api/supabase/cluster/${row_id}`
  );

  if (!clusterResponse.ok) {
    throw new Error("clusterResponse: Network response was not ok");
  }
  const clusterResponseData = await clusterResponse.json();

  // !-------------------------------------------
  const questionsResponse = await fetch(
    `http://localhost:3000/api/supabase/questions/${row_id}`
  );

  if (!questionsResponse.ok) {
    throw new Error("questionsResponse: Network response was not ok");
  }
  const questionsResponseData = await questionsResponse.json();

  // !-------------------------------------------
  const faqsResponse = await fetch(
    `http://localhost:3000/api/supabase/faqs/${row_id}`
  );

  if (!faqsResponse.ok) {
    throw new Error("faqsResponse: Network response was not ok");
  }
  const faqsResponseData = await faqsResponse.json();

  // !-------------------------------------------
  const lsiKeywordsResponse = await fetch(
    `http://localhost:3000/api/supabase/mission-plan/${row_id}`
  );

  if (!lsiKeywordsResponse.ok) {
    throw new Error("lsiKeywordsResponse: Network response was not ok");
  }
  const lsiKeywordsResponseData = await lsiKeywordsResponse.json();

  // !-------------------------------------------
  const aiModeResponse = await fetch(
    `http://localhost:3000/api/supabase/ai-mode/${row_id}`
  );

  if (!aiModeResponse.ok) {
    throw new Error("aiModeResponse: Network response was not ok");
  }
  const aiModeResponseData = await aiModeResponse.json();

  // !-------------------------------------------
  const personaResponse = await fetch(
    `http://localhost:3000/api/supabase/persona/${row_id}`
  );

  if (!personaResponse.ok) {
    throw new Error("personaResponse: Network response was not ok");
  }
  const personaResponseData = await personaResponse.json();

  // !-------------------------------------------
  const outlineFormatResponse = await fetch(
    `http://localhost:3000/api/supabase/outline-format/${row_id}`
  );

  if (!outlineFormatResponse.ok) {
    throw new Error("outlineFormatResponse: Network response was not ok");
  }
  const outlineFormatResponseData = await outlineFormatResponse.json();

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
  let contentBriefResponseData;
  if (
    missionPlanResponse === null &&
    keywordResponseData &&
    bussinessGoalResponseData &&
    targetAudienceResponseData &&
    intentResponseData &&
    articleOutcomeResponseData &&
    pillarResponseData &&
    clusterResponseData &&
    questionsResponseData &&
    faqsResponseData &&
    lsiKeywordsResponseData &&
    aiModeResponseData &&
    personaResponseData &&
    outlineFormatResponseData
  ) {
    const contentBriefResponse = await fetch(
      "http://localhost:3000/api/contentBrief",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_keyword: keywordResponseData?.keyword || "",
          business_goal: bussinessGoalResponseData?.BUSINESS_GOAL || "",
          target_audience: targetAudienceResponseData?.target_audience || "",
          user_intent: intentResponseData?.intent || "",
          article_outcome: articleOutcomeResponseData?.article_outcome || "",
          pillar: pillarResponseData?.pillar || "",
          cluster: clusterResponseData?.cluster || "",
          Must_Answer_Questions: questionsResponseData?.questions || "",
          FAQs: faqsResponseData?.faq || "",
          lsi_terms: lsiKeywordsResponseData?.lsi_keywords || "",
          ai_overview: aiModeResponseData?.ai_mode || "",
          author_persona: personaResponseData?.persona || "",
          outline: outlineFormatResponseData?.outline_format || "",
        }),
      }
    );

    if (!contentBriefResponse.ok) {
      throw new Error("contentBriefResponse: Network response was not ok");
    }
    contentBriefResponseData = await contentBriefResponse.json();
  }

  const nextHref = `/analysis/${file_id}/${index}`;

  return (
    <>
      <MissionPlanPage
        missionPlanResponseData={missionPlanResponseData.mission_plan}
        lsiKeywordsApproveResponseData={
          lsiKeywordsApproveResponseData[0].status
        }
        competitorAnalysisData={competitorAnalysisData.comp_analysis}
        valueAddResponseData={valueAddResponseData.value_add}
        contentBriefResponseData={contentBriefResponseData}
        row_id={row_id}
        nextHref={nextHref}
      />
    </>
  );
}
