import React, { useEffect, useState } from "react";
import Loader from "./common/Loader";

export default function Article({
  newOutlineResponseData,
  updatedArticleResponseData,
}) {
  const [sectionIsGenerating, setSectionIsGenerating] = useState(false);
  const [articleSections, setArticleSections] = useState();
  const [articleSectionCount, setArticleSectionCount] = useState(0);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
    useState(1);
  const [articledataUpdated, setArticleDataUpdated] = useState(
    updatedArticleResponseData
  );

  const generateArticleSection = async (section) => {
    setSectionIsGenerating(true);
    console.log("section", section);
    const { data: row_details } = await supabase
      .from("row_details")
      .select("mission_plan,lsi_keywords,persona")
      .eq("row_id", row_id);

    console.log("row id", row_id);

    const { data: valueAdd } = await supabase
      .from("analysis")
      .select("value_add")
      .eq("row_id", row_id);

    const { data: outline } = await supabase
      .from("outline")
      .select("new_outline")
      .eq("row_id", row_id);

    const payload = {
      missionPlan: row_details[0].mission_plan,
      gapsAndOpportunities: valueAdd?.[0]?.value_add || "", // extract string
      lsi_keywords: Array.isArray(row_details[0].lsi_keywords)
        ? row_details[0].lsi_keywords
        : [], // ensure array
      persona: row_details[0].persona,
      outline: outline?.[0]?.new_outline || "", // extract string
      section: String(section), // ensure string
    };

    // const calculateSectionCount = async (outline) => {
    //   const lines = outline.split("\n");
    //   // Match lines that start with 4 spaces and an asterisk, but not more
    //   // const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
    //   const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
    //   console.log("count", count);
    //   setArticleSectionCount(count);
    //   // return count;
    // };
    // calculateSectionCount(payload?.outline);

    console.log("payload", payload);

    const response = await fetch(`/api/generate-article`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("dataaaaaaaaaaa", data);

    setArticleSections((prev) =>
      Array.isArray(prev) ? [...prev, data] : [data]
    );
    setArticleSectionGenerateCount(articleSectionGenerateCount + 1);
    setSectionIsGenerating(false);
  };

  const handleSaveArticle = async (savedArticle) => {
    setSectionIsGenerating(true);
    const { data: article, error } = await supabase.from("article").upsert(
      {
        row_id: row_id,
        updated_article: savedArticle,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.log("added succesfully", error);
    }
    setSectionIsGenerating(false);
  };

  const handleSaveGdrive = async (articleSections, row_id) => {
    try {
      const backendPayload = {
        test_content_string: articleSections,
        row_folder_name: row_id,
      };
      const apiResponse = await fetch(`/api/save-to-gdrive/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      });

      const data = await apiResponse.json();
      console.log("FastAPI response:", data);

      if (apiResponse.ok) {
        toast.success("File Saved Succesfully!");
      } else {
        const errorMessage =
          data.error || data.detail || "Failed to save file.";
        toast.error(`Error: ${errorMessage}`);
        console.error("API Error Response:", data);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const calculateSectionCount = async (outline) => {
      const lines = outline.split("\n");
      // Match lines that start with 4 spaces and an asterisk, but not more
      // const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
      const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
      console.log("count", count);
      setArticleSectionCount(count);
      // return count;
    };
    calculateSectionCount(newOutlineResponseData);

    console.log("outlineData", newOutlineResponseData);
  }, [newOutlineResponseData]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div
        className={`${
          articledataUpdated ? "md:w-1/2" : "w-full"
        } w-full p-6 rounded-xl shadow-md border border-gray-200`}
      >
        <h4 className="text-lg font-semibold text-black-700 mb-4">
          Generated Article
        </h4>

        <div className="grid ">
          <textarea
            rows="10"
            className="w-full p-3 border border-gray-200 rounded-md bg-gray-50 focus:outline-[#1abc9c] focus:outline-2"
            disabled={sectionIsGenerating}
            defaultValue={
              Array.isArray(articleSections)
                ? articleSections.join("\n")
                : articleSections || ""
            }
          />

          <div className="ml-auto flex gap-2">
            {articleSectionGenerateCount < articleSectionCount && (
              <button
                className=""
                disabled={sectionIsGenerating}
                onClick={() => {
                  generateArticleSection(articleSectionGenerateCount);
                  console.log(
                    "articleSectionGenerateCount",
                    articleSectionGenerateCount
                  );
                }}
              >
                Generate section {articleSectionGenerateCount} /{" "}
                {articleSectionCount}
              </button>
            )}

            <button
              disabled={sectionIsGenerating}
              className=""
              style={{ backgroundColor: "#4CAF50" }}
              onClick={() => {
                handleSaveArticle(
                  Array.isArray(articleSections)
                    ? articleSections.join("\n")
                    : articleSections || ""
                );
              }}
            >
              Save
            </button>

            <button
              disabled={sectionIsGenerating}
              className=""
              style={{ backgroundColor: "#3478F6" }}
              onClick={() => handleSaveGdrive(articleSections, row_id)}
            >
              Save to Google Drive
            </button>
          </div>
          {sectionIsGenerating && <Loader />}
        </div>
      </div>
    </div>
  );
}
