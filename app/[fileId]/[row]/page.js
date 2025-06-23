"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";

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

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [articledata, setArticleData] = useState([]);
  const [articledataUpdated, setArticleDataUpdated] = useState([]);

  const [intentdata, setIntentData] = useState([]);
  const [outlineData, setOutlineData] = useState([]);
  const [outlineDataUpdated, setOutlineDataUpdated] = useState([]);

  const [editIntent, setEditIntent] = useState(false);
  const [parsedContentState, setParsedContentState] = useState({});
  const [editedIntent, setEditedIntent] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);

  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  const fileId = params.fileId;
  const row = params.row;

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(
    () => {
      const row_id = `${fileId}_${row}`;

      const fetchData = async () => {
        try {
          const { data: article } = await supabase
            .from("article")
            .select("content")
            .eq("row_id", row_id);

          const { data: intent } = await supabase
            .from("intent")
            .select("content")
            .eq("row_id", row_id);

          const { data: outline } = await supabase
            .from("outline")
            .select("content")
            .eq("row_id", row_id);

          setArticleData(article || []);
          setIntentData(intent || []);
          setOutlineData(outline || []);

          const parsed = JSON.parse(intent?.[0]?.content || "{}");
          setParsedContentState(parsed);
          setEditedIntent(parsed.intent || "");
          setEditedExplanation(parsed.explanation || "");
        } catch (error) {
          setApiError(error.message || "Something went wrong");
        } finally {
          setIsLoading(false);
        }
      };

      const fetchDataUpdated = async () => {
        try {
          const { data: articleUpdated } = await supabase
            .from("article")
            .select("updated_content")
            .eq("row_id", row_id);

          const { data: intentUpdated } = await supabase
            .from("intent")
            .select("updated_content")
            .eq("row_id", row_id);

          const { data: outlineUpdated } = await supabase
            .from("outline")
            .select("updated_content")
            .eq("row_id", row_id);

          setArticleDataUpdated(articleUpdated || []);
          setOutlineDataUpdated(outlineUpdated || []);
        } catch (error) {
          setApiError(error.message || "Something went wrong");
        }
      };

      fetchData();
      fetchDataUpdated();
    },
    [params.row],
    [saveStatus]
  );

  const handleTabChange = (tabName) => {
    updateProjectData({ activeModalTab: tabName });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.back();
    }
  };

  const handleCancelEditedIntent = () => {
    setEditedIntent(parsedContentState.intent || "");
    setEditedExplanation(parsedContentState.explanation || "");
    setEditIntent(false);
  };

  const handleSaveEditedIntent = async () => {
    const updatedContent = {
      intent: editedIntent,
      explanation: editedExplanation,
    };

    const stringifiedIntent = JSON.stringify(updatedContent, null, 4);

    const payload = {
      user_id: `${fileId}_${row}`,
      Mainkeyword: "contentful",
      edit_content: {
        intent: stringifiedIntent,
      },
    };

    setSaveEditedIntent(true);
    try {
      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Updated Outline and Article generated successfully!", {
          position: "bottom-right",
        });
        setParsedContentState(updatedContent);
        setEditIntent(false);
        setSaveStatus(true);
      } else {
        const errorRes = await res.json();
        toast.error(errorRes.message || "Something went wrong", {
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error("An error occurred while saving intent", {
        position: "top-right",
      });
    } finally {
      setSaveEditedIntent(false);
    }
  };

  return (
    <div className="container">
      <main className="main-content step-component">
        <div className="flex items-center gap-4 mb-4">
          <span
            className="p-2 text-blue-500 hover:text-blue-600 text-xl rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            onClick={() => router.back()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label="Go back"
          >
            ←
          </span>
          <h3 className="text-xl font-semibold text-blue-500">
            Processing Row data {params.row}
          </h3>
        </div>

        {apiError && <div className="text-red-500">Error: {apiError}</div>}
        {isLoading && <Loader />}

        {!isLoading && (
          <div className="flex flex-col gap-[8px]">
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
                <pre>Processing Logs...</pre>
              )}

              {projectData.activeModalTab === "Intent" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {intentdata.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Intent
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
                          {!editIntent && (
                            <button onClick={() => setEditIntent(true)}>
                              Edit
                            </button>
                          )}
                          {editIntent && (
                            <>
                              {saveEditedIntent && (
                                <Loader className="loader-sm" />
                              )}
                              <button
                                disabled={saveEditedIntent}
                                onClick={handleSaveEditedIntent}
                              >
                                Save
                              </button>
                              <button
                                disabled={saveEditedIntent}
                                onClick={handleCancelEditedIntent}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editIntent ? (
                        <>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedIntent}
                            onChange={(e) => setEditedIntent(e.target.value)}
                          />
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {parsedContentState?.intent}
                          </p>
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No intent data available.</p>
                  )}
                </div>
              )}

              {projectData.activeModalTab === "Outline" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {[...outlineData, ...outlineDataUpdated].map(
                    (item, index) => {
                      const content =
                        item.content || item.updated_content || "";
                      let parsedOutline;

                      try {
                        parsedOutline =
                          typeof content === "string"
                            ? JSON.parse(content)
                            : content;
                      } catch {
                        parsedOutline = content;
                      }

                      return (
                        <div key={index} className="mb-6">
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            {item.updated_content
                              ? "Generated Outline Updated"
                              : "Generated Outline"}
                          </h4>
                          {typeof parsedOutline === "string" ? (
                            <p className="text-black-600 whitespace-pre-line">
                              {parsedOutline}
                            </p>
                          ) : (
                            <ul className="list-disc pl-6 text-black-600">
                              {Object.entries(parsedOutline).map(
                                ([key, value]) => (
                                  <li key={key} className="mb-2">
                                    <strong>{key}:</strong> {value}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {projectData.activeModalTab === "Content" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {[...articledata, ...articledataUpdated].map(
                    (item, index) => {
                      const content =
                        item.content || item.updated_content || "";
                      let parsedArticle;

                      try {
                        parsedArticle =
                          typeof content === "string"
                            ? JSON.parse(content)
                            : content;
                      } catch {
                        parsedArticle = content;
                      }

                      return (
                        <div key={index} className="mb-6">
                          <h4 className="text-lg font-semibold text-black-700 mb-2">
                            {item.updated_content
                              ? "Generated Article Updated"
                              : "Generated Article"}
                          </h4>
                          {typeof parsedArticle === "string" ? (
                            <p className="text-black-600 whitespace-pre-line">
                              {parsedArticle}
                            </p>
                          ) : (
                            <ul className="list-disc pl-6 text-black-600">
                              {Object.entries(parsedArticle).map(
                                ([key, value]) => (
                                  <li key={key} className="mb-2">
                                    <strong>{key}:</strong> {value}
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}
