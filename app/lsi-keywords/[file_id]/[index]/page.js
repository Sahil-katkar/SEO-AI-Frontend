"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(false);
  const { updateProjectData } = useAppContext();

  const [lsiData, setLsiData] = useState("");
  const [compAnalysis, setCompAnalysis] = useState("");
  const [valueAdd, setValueAdd] = useState("");
  const [updatedLsiKeywords, setUpdatedLsiKeywords] = useState({});

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;
  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/content/${fileId}/${index}`);
  };

  const handleApprove = async () => {
    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("analysis")
        .upsert(
          {
            row_id: row_id,
            status: "Approved",
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      } else {
        toast.success("LSI keywords approved successfully!", {
          position: "bottom-right",
        });
      }

      console.log("Analysis approved successfully:", upsertedData);
    } catch (error) {
      console.error("Error approving analysis:", error.message || error);
      toast.error(
        `Failed to approve LSI keywords: ${error.message || "Unknown error"}`,
        {
          position: "top-right",
        }
      );
    } finally {
    }
  };

  const analysisArr = [
    {
      intent: "This is some intent 1",
      outline: `# Contentful Explained: A Comprehensive Headless CMS Comparison Guide
                * [Contentful Explained: A Comprehensive Headless CMS Comparison Guide](#contentful-explained-a-comprehensive-headless-cms-comparison-guide)
                * [What is Contentful? Demystifying a Modern Content Platform](#what-is-contentful-demystifying-a-modern-content-platform)
                * [Traditional vs. Headless: Understanding Core CMS Differences](#traditional-vs-headless-understanding-core-cms-differences)
                    * [The Architecture of a Traditional (Monolithic) CMS](#the-architecture-of-a-traditional-monolithic-cms)
                    * [The Rise of Headless CMS: Decoupled Content Delivery](#the-rise-of-headless-cms-decoupled-content-delivery)
                    * [Key Distinctions: Headless CMS vs. Traditional CMS (Image: Comparison Chart)](#key-distinctions-headless-cms-vs-traditional-cms-image-comparison-chart)
                * [Why Choose a Headless CMS Like Contentful?](#why-choose-a-headless-cms-like-contentful)
                    * [Advantages of Adopting a Headless Architecture (Video: Explainer)](#advantages-of-adopting-a-headless-architecture-video-explainer)
                    * [How Contentful Works: Powering Digital Experiences](#how-contentful-works-powering-digital-experiences)
                * [Key Features and Benefits of the Contentful Platform](#key-features-and-benefits-of-the-contentful-platform)
                    * [Contentful's Unique Capabilities for Developers and Marketers](#contentfuls-unique-capabilities-for-developers-and-marketers)
                    * [Delivering Omnichannel Experiences with Contentful](#delivering-omnichannel-experiences-with-contentful)
                * [Who is Contentful Best For? Making the 'Better Option' Choice](#who-is-contentful-best-for-making-the-better-option-choice)
                    * [Use Cases for Contentful: From Marketing Sites to Headless Commerce (Image: Use Case Icons)](#use-cases-for-contentful-from-marketing-sites-to-headless-commerce-image-use-case-icons)
                    * [When is Contentful the Better Option for Your Business?](#when-is-contentful-the-better-option-for-your-business)
                * [Contentful FAQs: Your Questions About Headless CMS Answered](#contentful-faqs-your-questions-about-headless-cms-answered)
                    * [Is Contentful truly a CMS, or something different?](#is-contentful-truly-a-cms-or-something-different)
                    * [What are the main advantages and disadvantages of traditional CMS platforms?](#what-are-the-main-advantages-and-disadvantages-of-traditional-cms-platforms)
                    * [Should I use a headless CMS or a traditional CMS for my next project?](#should-i-use-a-headless-cms-or-a-traditional-cms-for-my-next-project)
                * [Conclusion: Is Contentful the Right CMS for You?](#conclusion-is-contentful-the-right-cms-for-you)`,
      LSI: [
        "strapi headless cms",
        "cms strapi",
        "headless cms strapi",
        "strapi cms review",
        "strapi cms ecommerce",
        "strapi cms tutorial",
        "what is strapi cms",
        "why strapi is the best headless cms",
        "pros strapi cms",
        "strapi",
        "what is strapi",
        "strapi documentation",
        "strapi tutorial",
        "strapi open source",
        "strapi examples",
        "strapi getting started",
        "strapi example",
        "strapi performance",
        "strapi features",
      ],
      wordCount: 2000,
      density: 50,
      gaps: "These are some gaps 1",
      opportunities: "These are some opportunities 1",
    },
  ];

  const [editLSI, setEditLSI] = useState(false);

  const [editedLsiData, setEditedLsiData] = useState({});

  const [editedCompAnalysis, setEditedCompAnalysis] = useState("");
  const [editedValueAdd, setEditedValueAdd] = useState("");

  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);

  //   !-----------------------------------
  const handleEditLSI = (item) => {
    const newEditedLsiData = { ...editedLsiData };
    lsiData.forEach((lsi, idx) => {
      const baseKeywords = String(lsi.lsi_keywords || "");
      const parts = baseKeywords.split(",");
      const pairs = [];
      for (let i = 0; i < parts.length; i += 2) {
        const keyword = parts[i] ? parts[i].trim() : "";
        const value = parts[i + 1] ? parts[i + 1].trim() : "";
        if (keyword) {
          pairs.push({ keyword, value, isNew: false });
        }
      }
      newEditedLsiData[`${idx}_${lsi.url}`] = pairs;
    });
    setEditedLsiData(newEditedLsiData);
    setEditLSI(true);
  };

  const generateLsi = async () => {
    console.log("generateLsi called");
    setIsGeneratingLSI(true);
    try {
      if (!row_id) {
        throw new Error("Invalid or missing row_id");
      }

      const { data: article, error } = await supabase
        .from("row_details")
        .select("comp_url")
        .eq("row_id", row_id);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      updateProjectData({
        selectedFileId: fileId,
        selectedRowIndex: index,
      });

      const urls = article
        .filter((item) => typeof item.comp_url === "string" && item.comp_url)
        .flatMap((item) => item.comp_url.split("\n").map((url) => url.trim()))
        .filter((url) => url);

      if (urls.length === 0) {
        throw new Error("No valid competitor URLs found");
      }

      console.log("Competitor URLs:", urls);

      const backendPayload = {
        urls,
      };

      console.log("backendPayload", backendPayload);

      try {
        const response = await fetch("/api/lsi-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        setLsiData(data);
        const { data: lsi_data } = await supabase.from("analysis").upsert(
          {
            row_id: row_id,
            lsi_keywords: data,
          },
          { onConflict: "row_id" }
        );

        if (lsi_data) {
          console.error("Supabase upsert error after API call:", upsertError);
        } else {
          console.log("added to db ");
        }
        console.log("Scraped data:", data);
      } catch (networkError) {
        toast.error(`Server Not Started`, { position: "top-right" });
      }
    } catch (error) {
      console.error("Error generating LSI:", error);
    } finally {
      setIsGeneratingLSI(false);
    }
  };

  const handleSaveLSI = async (compIndex) => {
    const updatedLsi = lsiData.map((item, idx) => {
      const tableEditKey = `${idx}_${item.url}`;
      let lsi_keywords = item.lsi_keywords;

      if (editedLsiData[tableEditKey]) {
        lsi_keywords = editedLsiData[tableEditKey]
          .map((pair) => `${pair.keyword},${pair.value}`)
          .join(",");
      }

      return {
        ...item,
        lsi_keywords,
      };
    });

    updateProjectData({
      selectedFileId: fileId,
      selectedRowIndex: index,
    });

    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        lsi_keywords: updatedLsi,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.error("Supabase upsert error after API call:", error);
    } else {
      setLsiData(updatedLsi);
      setEditLSI(false);
    }
  };
  const handleCancelLSI = (item) => {
    setEditLSI(false);
    setEditedLsiData({});
  };

  const handleAddRow = (idx, url) => {
    const tableEditKey = `${idx}_${url}`;
    const currentPairs =
      (updatedLsiKeywords && updatedLsiKeywords[tableEditKey]) || [];
    const newPairs = [...currentPairs, { keyword: "", value: "", isNew: true }];
    setUpdatedLsiKeywords({
      ...(updatedLsiKeywords || {}),
      [tableEditKey]: newPairs,
    });
  };

  const handleRemoveRow = (idx, url, pairIdx) => {
    const tableEditKey = `${idx}_${url}`;
    const currentPairs = updatedLsiKeywords[tableEditKey] || [];
    const newPairs = currentPairs.filter((_, i) => i !== pairIdx);
    setUpdatedLsiKeywords({
      ...updatedLsiKeywords,
      [tableEditKey]: newPairs,
    });
  };

  const handleSaveUpdatedLSI = async (idx, url) => {
    const tableEditKey = `${idx}_${url}`;
    const newPairs = updatedLsiKeywords[tableEditKey] || [];

    let existingObj = {};
    const { data, error: fetchError } = await supabase
      .from("analysis")
      .select("updated_lsi_keywords")
      .eq("row_id", row_id)
      .single();

    if (data && data.updated_lsi_keywords) {
      let parsed = data.updated_lsi_keywords;
      if (typeof parsed === "string") {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) {
          parsed = {};
        }
      }
      if (parsed && typeof parsed === "object") {
        existingObj = parsed;
      }
    }

    const filteredNewPairs = newPairs.filter(
      (pair) => pair.keyword && pair.value !== ""
    );

    const updatedObj = {
      ...existingObj,
      [tableEditKey]: filteredNewPairs,
    };

    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        updated_lsi_keywords: JSON.stringify(updatedObj),
      },
      { onConflict: "row_id" }
    );

    if (error) {
      toast.error("Failed to save updated LSI keywords");
    } else {
      toast.success("Updated LSI keywords saved!");
      setUpdatedLsiKeywords(updatedObj);
    }
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!row_id) return;

      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords, comp_analysis")
        .eq("row_id", row_id)
        .single();

      if (data) {
        if (data.lsi_keywords) {
          try {
            setLsiData(
              typeof data.lsi_keywords === "string"
                ? JSON.parse(data.lsi_keywords)
                : data.lsi_keywords
            );
          } catch (e) {
            setLsiData(data.lsi_keywords);
          }
        }
        if (data.comp_analysis) {
          setCompAnalysis(data.comp_analysis);
        }
      }
    };

    fetchAnalysisData();
  }, [row_id]);

  useEffect(() => {
    const fetchUpdatedData = async () => {
      if (!row_id) return;

      const { data, error } = await supabase
        .from("analysis")
        .select("updated_lsi_keywords")
        .eq("row_id", row_id)
        .single();

      if (data) {
        let parsed = data.updated_lsi_keywords;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (e) {
            parsed = {};
          }
        }
        if (Array.isArray(parsed)) {
          // Use the correct key for your table
          setUpdatedLsiKeywords({
            [`0_${lsiData[0]?.url || "custom"}`]: parsed,
          });
        } else if (parsed && typeof parsed === "object") {
          setUpdatedLsiKeywords(parsed);
        } else {
          setUpdatedLsiKeywords({});
        }
      } else {
        setUpdatedLsiKeywords({});
      }
    };

    fetchUpdatedData();
  }, [row_id, lsiData]);

  return (
    <>
      <ToastContainer />
      <div className="container px-4 py-6">
        <main className="main-content step-component">
          <h3 className="text-xl font-semibold mb-6 text-blue-600">
            2.LSI Keywords
          </h3>

          {isLoading && <Loader />}

          <div className="overflow-x-auto">
            <div className="flex flex-col gap-[30px]">
              {analysisArr.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-[30px] rounded-[12px] border-[1px] border-gray-200 py-3 px-4 text-sm hover:bg-gray-50 transition"
                >
                  <div>
                    <div className="mb-[8px] flex justify-between items-center">
                      <p className="font-bold text-[24px] ">LSI:</p>
                      <div className="flex gap-[8px]">
                        <button
                          onClick={async () => {
                            await generateLsi();
                          }}
                          disabled={isGeneratingLSI}
                        >
                          {isGeneratingLSI ? (
                            <Loader size={20} />
                          ) : (
                            "Generate LSI"
                          )}
                        </button>
                        {!editLSI && (
                          <button
                            onClick={() => {
                              handleEditLSI(index + 1);
                            }}
                            className="p-1 text-gray-600 hover:text-black"
                            disabled={
                              !lsiData ||
                              !Array.isArray(lsiData) ||
                              lsiData.length === 0
                            }
                            title={
                              !lsiData ||
                              !Array.isArray(lsiData) ||
                              lsiData.length === 0
                                ? "Generate LSI data first"
                                : "Edit LSI"
                            }
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {editLSI && (
                          <button
                            onClick={() => {
                              handleSaveLSI(index + 1);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {editLSI && (
                          <button
                            onClick={() => {
                              handleCancelLSI(index + 1);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {lsiData &&
                      lsiData.map((item, idx) => {
                        const baseKeywords = String(item.lsi_keywords || "");

                        const transformedKeywordsForTextarea = baseKeywords
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s)
                          .join("\n");

                        const keywordValuePairs = [];
                        const parts = baseKeywords.split(",");
                        for (let i = 0; i < parts.length; i += 2) {
                          const keyword = parts[i] ? parts[i].trim() : "";
                          const value = parts[i + 1]
                            ? parseFloat(parts[i + 1].trim())
                            : null;

                          if (keyword) {
                            keywordValuePairs.push({
                              keyword,
                              value: isNaN(value) ? null : value,
                            });
                          }
                        }

                        const isEditing = editLSI;

                        const tableEditKey = `${idx}_${item.url}`;
                        const editedPairs =
                          (updatedLsiKeywords &&
                            updatedLsiKeywords[tableEditKey]) ||
                          [];

                        return (
                          <div
                            key={idx}
                            className="mb-4 p-4 border border-gray-200 rounded-md"
                          >
                            <label className="block font-bold mb-2">
                              Result {idx + 1} (Source:{" "}
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {item.url}
                              </a>
                              )
                            </label>

                            {/* FIRST TABLE: READ-ONLY */}
                            <div className="overflow-x-auto mt-2 mb-4">
                              <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-1 text-left border border-gray-300">
                                      Keyword
                                    </th>
                                    <th className="px-3 py-1 text-left border border-gray-300">
                                      Value
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {keywordValuePairs.length > 0 ? (
                                    keywordValuePairs.map((pair, pairIdx) => (
                                      <tr
                                        key={pairIdx}
                                        className="border-b border-gray-200 last:border-0"
                                      >
                                        <td className="px-3 py-1 border border-gray-300">
                                          {pair.keyword}
                                        </td>
                                        <td className="px-3 py-1 border border-gray-300">
                                          {!isNaN(Number(pair.value)) &&
                                          pair.value !== ""
                                            ? Number(pair.value).toFixed(10)
                                            : pair.value || "N/A"}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan="2"
                                        className="px-3 py-1 text-center text-gray-500 border border-gray-300"
                                      >
                                        No keywords found.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* SECOND TABLE: EDITABLE */}
                            <div className="overflow-x-auto mt-2">
                              <table className="min-w-full table-auto border-collapse border border-gray-300 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-1 text-left border border-gray-300">
                                      Keyword
                                    </th>
                                    <th className="px-3 py-1 text-left border border-gray-300">
                                      Value2
                                    </th>
                                    {isEditing && (
                                      <th className="px-3 py-1 text-left border border-gray-300">
                                        <button
                                          onClick={() =>
                                            handleAddRow(idx, item.url)
                                          }
                                          className="text-green-600 font-bold text-lg"
                                          title="Add new row"
                                        >
                                          +
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleSaveUpdatedLSI(idx, item.url)
                                          }
                                          className="ml-2 text-blue-600 font-bold text-lg"
                                          title="Save new LSI keywords"
                                        >
                                          Save Inside
                                        </button>
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {editedPairs.length > 0 ? (
                                    editedPairs.map((pair, pairIdx) => (
                                      <tr
                                        key={pairIdx}
                                        className="border-b border-gray-200 last:border-0"
                                      >
                                        <td className="px-3 py-1 border border-gray-300">
                                          {isEditing ? (
                                            <input
                                              type="text"
                                              value={pair.keyword}
                                              onChange={(e) => {
                                                const newPairs = [
                                                  ...editedPairs,
                                                ];
                                                newPairs[pairIdx].keyword =
                                                  e.target.value;
                                                setUpdatedLsiKeywords({
                                                  ...updatedLsiKeywords,
                                                  [tableEditKey]: newPairs,
                                                });
                                              }}
                                              className="w-full border rounded px-1"
                                              disabled={!isEditing}
                                            />
                                          ) : (
                                            pair.keyword
                                          )}
                                        </td>
                                        <td className="px-3 py-1 border border-gray-300">
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              value={pair.value ?? ""}
                                              onChange={(e) => {
                                                const newPairs = [
                                                  ...editedPairs,
                                                ];
                                                const val = e.target.value;
                                                newPairs[pairIdx].value =
                                                  val === "" ? "" : Number(val);
                                                setUpdatedLsiKeywords({
                                                  ...updatedLsiKeywords,
                                                  [tableEditKey]: newPairs,
                                                });
                                              }}
                                              className="w-full border rounded px-1"
                                              disabled={!isEditing}
                                            />
                                          ) : !isNaN(Number(pair.value)) &&
                                            pair.value !== "" ? (
                                            Number(pair.value).toFixed(10)
                                          ) : (
                                            pair.value || "N/A"
                                          )}
                                        </td>
                                        {isEditing && pair.isNew && (
                                          <td className="px-3 py-1 border border-gray-300">
                                            <button
                                              onClick={() =>
                                                handleRemoveRow(
                                                  idx,
                                                  item.url,
                                                  pairIdx
                                                )
                                              }
                                              className="text-red-600 font-bold"
                                              title="Remove row"
                                            >
                                              ×
                                            </button>
                                          </td>
                                        )}
                                        {isEditing && !pair.isNew && (
                                          <td className="px-3 py-1 border border-gray-300"></td>
                                        )}
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={isEditing ? 3 : 2}
                                        className="px-3 py-1 text-center text-gray-500 border border-gray-300"
                                      >
                                        No data available.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleApprove}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      disabled={
                        !lsiData ||
                        !Array.isArray(lsiData) ||
                        lsiData.length === 0
                      }
                      title={
                        !lsiData ||
                        !Array.isArray(lsiData) ||
                        lsiData.length === 0
                          ? "Generate LSI data first"
                          : "Approve LSI keywords"
                      }
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
