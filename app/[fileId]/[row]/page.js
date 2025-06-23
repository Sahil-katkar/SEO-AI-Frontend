"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const [parsedContentState, setParsedContentState] = useState();
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);

  const params = useParams();
  const fileId = params.fileId;
  const row = params.row;

  console.log("file id from params:", `${fileId}_${row}`);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const row_id = params.row;
        const row_id = `${fileId}_${row}`;

        const { data: article, error: articleError } = await supabase
          .from("article")
          .select("content")
          .eq("row_id", row_id);

        const { data: intent, error: intentError } = await supabase
          .from("intent")
          .select("content")
          .eq("row_id", row_id);

        const { data: outline, error: outlineError } = await supabase
          .from("outline")
          .select("content")
          .eq("row_id", row_id);

        if (articleError || intentError || outlineError) {
          throw new Error(
            articleError?.message ||
              intentError?.message ||
              outlineError?.message
          );
        }

        setArticleData(article || []);
        setIntentData(intent || []);
        setParsedContentState(JSON.parse(intent[0]?.content));
        setOutlineData(outline || []);
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDataUpdated = async () => {
      try {
        // const row_id = params.row;
        const row_id = `${fileId}_${row}`;

        const { data: articleUpdated, error: articleError } = await supabase
          .from("article")
          .select("updated_content")
          .eq("row_id", row_id);

        const { data: intent, error: intentError } = await supabase
          .from("intent")
          .select("updated_content")
          .eq("row_id", row_id);

        const { data: outlineUpdated, error: outlineError } = await supabase
          .from("outline")
          .select("updated_content")
          .eq("row_id", row_id);

        if (articleError || intentError || outlineError) {
          throw new Error(
            articleError?.message ||
              intentError?.message ||
              outlineError?.message
          );
        }

        setArticleDataUpdated(articleUpdated || []);
        setIntentData(intent || []);
        // setParsedContentState(JSON.parse(intent[0]?.content));
        setOutlineDataUpdated(outlineUpdated || []);

        console.log("articleUpdated", articleUpdated);
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchDataUpdated();
  }, [params.row, supabase]);

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
    if (intentdata.length > 0) {
      setParsedContentState(JSON.parse(intentdata[0].content));
    }
  };

  const handleSaveEditedIntent = async () => {
    const stringifiedIntent = JSON.stringify(intentdata, null, 4).replace(
      /\\"/g,
      '"'
    );

    console.log("stringifiedIntent", stringifiedIntent);
    const payload = {
      user_id: `${fileId}_${row}`,
      Mainkeyword: "contentful",
      edit_content: {
        intent: stringifiedIntent,
      },
    };
    console.log("hi", payload);
    setSaveEditedIntent(true);
    setTimeout(() => {
      setSaveEditedIntent(false);
    }, 3000);
    const res = await fetch("/api/contentEdit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log("updated intent");
    } else {
      console.log("failed to update intent");
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
            <div>
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
                              <button
                                onClick={() => {
                                  setEditIntent(true);
                                }}
                              >
                                Edit
                              </button>
                            )}

                            {editIntent && (
                              <>
                                {saveEditedIntent && (
                                  <Loader className={"loader-sm"} />
                                )}
                                <button
                                  disabled={saveEditedIntent}
                                  onClick={() => {
                                    handleSaveEditedIntent();
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  disabled={saveEditedIntent}
                                  onClick={() => {
                                    setEditIntent(false);
                                    handleCancelEditedIntent();
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editIntent ? (
                          <textarea
                            disabled={saveEditedIntent}
                            defaultValue={parsedContentState.intent}
                            onChange={(e) => {
                              parsedContentState.intent = e.target.value;
                            }}
                          />
                        ) : (
                          <p className="text-black-600 text-base mb-4">
                            {parsedContentState && parsedContentState?.intent}
                          </p>
                        )}

                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Explanation
                        </h4>

                        {editIntent ? (
                          <textarea
                            disabled={saveEditedIntent}
                            defaultValue={parsedContentState.explanation}
                            onChange={(e) => {
                              parsedContentState.explanation = e.target.value;
                            }}
                          />
                        ) : (
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState &&
                              parsedContentState?.explanation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-black-500">
                        No intent data available.
                      </p>
                    )}
                  </div>
                )}

                {projectData.activeModalTab === "Outline" && (
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    {outlineData.length > 0 ? (
                      outlineData.map((item, index) => {
                        let parsedOutline;

                        try {
                          parsedOutline = JSON.parse(item.content);
                        } catch (e) {
                          parsedOutline = item.content; // fallback if not JSON
                        }

                        return (
                          <div key={index} className="mb-6">
                            <div>
                              <h4 className="text-lg font-semibold text-black-700 mb-2">
                                Generated Outline
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
                                        <strong className="text-black-700">
                                          {key}:
                                        </strong>{" "}
                                        {value}
                                      </li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-black-500">
                        No outline data available.
                      </p>
                    )}

                    {outlineDataUpdated.length > 0 ? (
                      outlineDataUpdated.map((item, index) => {
                        let parsedOutlineUpdated;
                        try {
                          parsedOutlineUpdated = item.updated_content
                            ? item.updated_content
                            : null;
                        } catch (e) {
                          console.error(
                            "Failed to parse updated outline content:",
                            e
                          );
                          parsedOutlineUpdated = item.updated_content; // Fallback to raw content if not JSON
                        }

                        return (
                          <div key={`updated-${index}`} className="mb-6">
                            <h4 className="text-lg font-semibold text-black-700 mb-2">
                              Generated Outline Updated
                            </h4>
                            {typeof parsedOutlineUpdated === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedOutlineUpdated ||
                                  "No updated outline content available"}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {parsedOutlineUpdated &&
                                  Object.entries(parsedOutlineUpdated).map(
                                    ([key, value]) => (
                                      <li key={key} className="mb-2">
                                        <strong className="text-black-700">
                                          {key}:
                                        </strong>{" "}
                                        {value}
                                      </li>
                                    )
                                  )}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-black-500">
                        No updated outline data available.
                      </p>
                    )}
                  </div>
                )}

                {projectData.activeModalTab === "Content" && (
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    {articledata.length > 0 ? (
                      articledata.map((item, index) => {
                        let parsedOutline;

                        try {
                          parsedOutline = JSON.parse(item.content);
                        } catch (e) {
                          parsedOutline = item.content; // fallback if not JSON
                        }

                        return (
                          <div key={index} className="mb-6">
                            <h4 className="text-lg font-semibold text-black-700 mb-2">
                              Generated Article
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
                                      <strong className="text-black-700">
                                        {key}:
                                      </strong>{" "}
                                      {value}
                                    </li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-black-500">
                        No Article data available.
                      </p>
                    )}

                    {articledataUpdated.length > 0 ? (
                      articledataUpdated.map((item, index) => {
                        let parsedArticleUpdated;
                        try {
                          parsedArticleUpdated = item.updated_content
                            ? item.updated_content
                            : null;
                        } catch (e) {
                          console.error(
                            "Failed to parse updated outline content:",
                            e
                          );
                          parsedArticleUpdated = item.updated_content; // Fallback to raw content if not JSON
                        }

                        return (
                          <div key={`updated-${index}`} className="mb-6">
                            <h4 className="text-lg font-semibold text-black-700 mb-2">
                              Generated Article Updated
                            </h4>
                            {typeof parsedArticleUpdated === "string" ? (
                              <p className="text-black-600 whitespace-pre-line">
                                {parsedArticleUpdated ||
                                  "No updated outline content available"}
                              </p>
                            ) : (
                              <ul className="list-disc pl-6 text-black-600">
                                {parsedArticleUpdated &&
                                  Object.entries(parsedArticleUpdated).map(
                                    ([key, value]) => (
                                      <li key={key} className="mb-2">
                                        <strong className="text-black-700">
                                          {key}:
                                        </strong>{" "}
                                        {value}
                                      </li>
                                    )
                                  )}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-black-500">
                        No updated outline data available.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
