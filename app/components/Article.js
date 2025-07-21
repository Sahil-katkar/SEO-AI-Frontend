import React, { useEffect, useState } from "react";
import Loader from "./common/Loader";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "react-toastify";

export default function Article({
  newOutlineResponseData,
  updatedArticleResponseData,
  row_id,
  // articleH2Count,
  activeModalTab,
}) {
  // console.log("articleH2Count", articleH2Count);
  const supabase = createClientComponentClient();
  const [sectionIsGenerating, setSectionIsGenerating] = useState(false);
  const [articleSections, setArticleSections] = useState();
  const [articleSectionCount, setArticleSectionCount] = useState(0);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
    useState(1);
  const [articledataUpdated, setArticleDataUpdated] = useState(
    updatedArticleResponseData
  );
  const [showPreviousArticlesTable, setShowPreviousArticlesTable] =
    useState(false);
  const [density, setDensity] = useState(null);

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
    const { data: citable_summary } = await supabase
      .from("outline")
      .select("citable_answer")
      .eq("row_id", row_id);

    console.log("citable_summary", citable_summary[0].citable_answer);

    const payload = {
      missionPlan: row_details[0].mission_plan,
      gapsAndOpportunities: valueAdd?.[0]?.value_add || "", // extract string
      lsi_keywords: Array.isArray(row_details[0].lsi_keywords)
        ? row_details[0].lsi_keywords
        : [], // ensure array
      persona: row_details[0].persona,
      outline: outline?.[0]?.new_outline || "", // extract string
      section: String(section), // ensure string
      citable_summary: citable_summary[0].citable_answer,
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
      Array.isArray(prev) ? [...prev, data?.article_data] : [data?.article_data]
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
    setSectionIsGenerating(true);
    try {
      const backendPayload = {
        // test_content_string: articleSections,
        // row_folder_name: row_id,
        article_content: articleSections,
        folder_name: row_id,
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
    } finally {
      setSectionIsGenerating(false);
    }
  };

  // useEffect(() => {
  //   const calculateSectionCount = async (outline) => {
  //     const lines = outline.split("\n");
  //     // Match lines that start with 4 spaces and an asterisk, but not more
  //     // const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
  //     const count = lines.filter((line) => /^\s*-- H2:/.test(line)).length;
  //     console.log("count", count);
  //     setArticleSectionCount(count);
  //     // return count;
  //   };
  //   calculateSectionCount(newOutlineResponseData || "");

  //   console.log("outlineData", newOutlineResponseData);
  // }, [newOutlineResponseData]);

  useEffect(() => {
    const fetchH2Count = async (row_id) => {
      const { data, error } = await supabase
        .from("outline")
        .select("h2_count")
        .eq("row_id", row_id)
        .single();

      // console.log("data?.h2_count", Number(data?.h2_count));
      setArticleSectionCount(Number(data?.h2_count));
    };
    fetchH2Count(row_id);
  }, [row_id]);

  const toggleTableVisibility = async () => {
    setShowPreviousArticlesTable((prevState) => !prevState);

    const { data: articleData, error: articleError } = await supabase
      .from("article")
      .select("updated_article")
      .eq("row_id", row_id);

    const { data: lsiData, error: lsiError } = await supabase // Renamed for clarity, `lsiData` is the array of objects
      .from("analysis")
      .select("lsi_keywords") // This selects the column named 'lsi_keywords'
      .eq("row_id", row_id);

    const { data: lsiUpdated, error: lsiUpdatedErr } = await supabase // Renamed for clarity, `lsiData` is the array of objects
      .from("analysis")
      .select("updated_lsi_keywords") // This selects the column named 'lsi_keywords'
      .eq("row_id", row_id);

    console.log("lsiData", lsiData);
    console.log("lsiUpdated", lsiUpdated);

    // 1. Parse the original LSI data
    const originalLsi = JSON.parse(lsiData?.[0]?.lsi_keywords || "[]");

    // 2. Parse the updated LSI keywords
    const updatedLsi = JSON.parse(
      lsiUpdated?.[0]?.updated_lsi_keywords || "{}"
    );

    // 3. Prepare the final merged LSI array
    const finalMergedLsi = originalLsi.map((entry, index) => {
      const key = `${index}_${entry.url}`; // Create the key like '0_url', '1_url'
      const updatedKeywords = updatedLsi[key] || [];

      // Format updated keywords back to the format in original: "keyword,value"
      const parsedUpdatedKeywords = updatedKeywords.map(
        (item) => `${item.keyword},${item.value}`
      );

      // Combine old string + new entries
      const originalKeywordsStr = entry.lsi_keywords || "";
      const finalLsiKeywordsStr = [
        originalKeywordsStr,
        ...parsedUpdatedKeywords,
      ].join(",");

      return {
        url: entry.url,
        lsi_keywords: finalLsiKeywordsStr,
      };
    });

    console.log("✅ Only lsi_keywords:", finalMergedLsi);

    const formattedLsi = finalMergedLsi.map((item) => {
      const { url, lsi_keywords } = item;

      if (typeof lsi_keywords === "string") {
        const splitArray = lsi_keywords.split(",");
        const keywordPairs = [];

        for (let i = 0; i < splitArray.length; i += 2) {
          const keyword = splitArray[i]?.trim();
          const value = parseFloat(splitArray[i + 1]);

          // You can optionally add a check here to filter out garbage keywords/values
          if (keyword && !isNaN(value)) {
            keywordPairs.push([keyword, value]);
          }
        }

        return {
          url,
          lsi_keywords: keywordPairs,
        };
      }

      // Optional fallback in case of unexpected format
      return {
        url,
        lsi_keywords: {
          lsi_keyword: "failed to generate lsi keywords",
        },
      };
    });

    // Convert to flat { keyword: value } format
    const keywordsAsObject = {};

    formattedLsi.forEach((item) => {
      if (Array.isArray(item.lsi_keywords)) {
        item.lsi_keywords.forEach(([keyword, value]) => {
          if (keyword && !isNaN(value)) {
            keywordsAsObject[keyword] = value;
          }
        });
      }
    });

    // Create backend payload
    const backendPayload = {
      text_content: articleData[0].updated_article,
      keywords: keywordsAsObject, // ✅ Send as object, not JSON string
    };

    console.log("✅ Payload to Backend:", backendPayload);

    console.log(
      "✅ Formatted LSI Keywords:",
      JSON.stringify(formattedLsi, null, 2)
    );

    if (lsiError) {
      console.error("Supabase LSI fetch error:", lsiError);
      toast.error("Failed to fetch LSI keyword data.");
      return;
    }

    // console.log("keywordsAsObject", keywordsAsObject);

    // const backendPayload = {
    //   text_content: articleData[0].updated_article,
    //   keywords: JSON.stringify(formattedLsi, null, 2),
    // };

    console.log("backendPayload", backendPayload);

    const apiResponse = await fetch(`/api/keyword_density/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await apiResponse.json();
    setDensity(data);

    if (apiResponse.ok) {
      console.log("FastAPI response:", data);

      const { data: upsertedData, error: upsertError } = await supabase
        .from("article")
        .upsert(
          {
            row_id: row_id,
            density: data,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }
    } else {
      console.log("errror");
    }
  };

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
            {articleSectionGenerateCount <= articleSectionCount && (
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

            {!articleSectionGenerateCount <= articleSectionCount && (
              <button
                disabled={sectionIsGenerating}
                className=""
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
            )}

            {!articleSectionGenerateCount <= articleSectionCount && (
              <button
                disabled={sectionIsGenerating}
                className=""
                onClick={() => handleSaveGdrive(articleSections, row_id)}
              >
                Save to Google Drive
              </button>
            )}
          </div>
          {sectionIsGenerating && <Loader />}
        </div>

        <div>
          {/* Other parts of your component */}

          {/* Button to show/hide the Density Table */}
          <button
            onClick={toggleTableVisibility}
            className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {showPreviousArticlesTable
              ? "Hide Density Table"
              : "Show Density Table"}
          </button>

          {/* Conditional rendering for the table section */}
          {showPreviousArticlesTable && (
            <div className="md:w-full w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
              {/* <h4 className="text-lg font-semibold text-black-700 mb-4">
                Previous Articles
              </h4> */}

              {density && typeof density === "object" && (
                <div className="mt-4">
                  <h5 className="text-md font-bold mb-2">
                    Keyword Density Table
                  </h5>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Keyword
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Density
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(density).map(
                        ([keyword, values], index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {keyword}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {values[0]}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {parseFloat(values[1]).toFixed(4)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {parseFloat(values[2]).toFixed(2)}%
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
