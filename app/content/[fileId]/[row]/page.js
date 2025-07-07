"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast, ToastContainer } from "react-toastify";
import { useSearchParams } from "next/navigation";

export default function FileRow() {
  const {
    projectData,
    updateProjectData,
    setActiveStep,
    STEPS,
    isModalOpen,
    activeModalRowIndex,
    activeModalTab,
    primaryKeyword,
  } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [articledata, setArticleData] = useState([]);
  const [articledataUpdated, setArticleDataUpdated] = useState([]);
  const [intentdata, setIntentData] = useState([]);
  const [citabledata, setCitableData] = useState([]);

  const [outlineData, setOutlineData] = useState("");
  const [outlineDataUpdated, setOutlineDataUpdated] = useState([]);
  const [editIntent, setEditIntent] = useState(false);
  const [editCitable, setEditCitable] = useState(false);

  const [parsedContentState, setParsedContentState] = useState([]);
  const [editedIntent, setEditedIntent] = useState("");
  const [editedCitable, setEditedCitable] = useState("");

  const [editedExplanation, setEditedExplanation] = useState("");
  const [saveEditedIntent, setSaveEditedIntent] = useState(false);
  const [saveEditedCitable, setSaveEditedCitable] = useState(false);
  const [parsedMissionPlan, setParsedMissionPlan] = useState("");

  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState(false);
  const params = useParams();
  const fileId = params.fileId;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword");
  const row = params.row;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const row_id = `${fileId}_${row}`;
  // ... after the intent state variables
  // const [editIntent, setEditIntent] = useState(false);
  // const [editedIntent, setEditedIntent] = useState("");
  // const [saveEditedIntent, setSaveEditedIntent] = useState(false);

  // --- ADD THESE NEW STATES FOR THE OUTLINE ---
  const [editOutline, setEditOutline] = useState(false);
  const [parsedOutline, setParsedOutline] = useState("");
  const [editedOutline, setEditedOutline] = useState("");
  const [saveEditedOutline, setSaveEditedOutline] = useState(false);
  // --- END NEW STATES ---

  const [articleSectionCount, setArticleSectionCount] = useState(0);
  const [articleSectionGenerateCount, setArticleSectionGenerateCount] =
    useState(1);
  const [articleSections, setArticleSections] = useState([]);

  // const [logs, setLogs] = useState([]);
  // ... rest of the state

  useEffect(() => {
    // const row_id = `${fileId}_${row}`;

    const fetchData = async () => {
      try {
        const { data: article } = await supabase
          .from("article")
          .select("content")
          .eq("row_id", row_id);

        const { data: logData, error } = await supabase
          .from("event_log")
          .select("content")
          .eq("row_id", row_id);

        const { data: intent } = await supabase
          .from("row_details")
          .select("intent")
          .eq("row_id", row_id);

        const { data: outline } = await supabase
          .from("outline")
          .select("new_outline")
          .eq("row_id", row_id);

        const { data: citable } = await supabase
          .from("outline")
          .select("citable_answer")
          .eq("row_id", row_id);

        const { data: missionPlan } = await supabase
          .from("row_details")
          .select("mission_plan")
          .eq("row_id", row_id);

        setArticleData(article || []);
        setIntentData(intent);

        console.log("citable", citable);

        // setCitableData(citable);
        console.log("Raw outline data from DB:", outline);

        const parsedValue = outline?.[0]?.new_outline || "";
        const parsedCitable = citable?.[0]?.citable_answer || "";

        setOutlineData(parsedValue);
        setCitableData(parsedCitable);
        console.log("Parsed outline string:", outlineData);

        const parsed = intent?.[0]?.intent || "";

        console.log("parsed:", parsed);

        setParsedContentState(parsed);
        console.log("parsedContentState", parsedContentState);

        setEditedIntent(parsed);
        console.log("edited intent", editIntent);

        setEditedExplanation(parsed.explanation || "");
        setParsedMissionPlan(missionPlan?.[0]?.mission_plan || "");
      } catch (error) {
        setApiError(error.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [row_id]);

  // ... after handleSaveEditedIntent ...

  const handleCancelEditedOutline = () => {
    setEditedOutline(outlineData); // Reset from the original state
    setEditOutline(false); // Exit edit mode
  };

  const handleCancelEditedCitable = () => {
    setEditedCitable(citabledata); // Reset from the original state
    setEditCitable(false); // Exit edit mode
  };

  // const handleSaveEditedOutline = async () => {
  //   setSaveEditedOutline(true); // Show loader, disable buttons

  //   // The payload is similar, but the key is 'outline'
  //   const payload = {
  //     user_id: row_id,
  //     Mainkeyword: keyword,
  //     edit_content: {
  //       outline: editedOutline,
  //     },
  //   };

  //   console.log("Saving new outline payload:", payload);

  //   try {
  //     const res = await fetch("/api/contentEdit", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (res.ok) {
  //       toast.success("Updated Article generated successfully!", {
  //         position: "bottom-right",
  //       });
  //       // Update the main display state with the new content
  //       setParsedOutline(editedOutline);
  //       setEditOutline(false); // Exit edit mode
  //       setSaveStatus(true); // This will trigger fetchDataUpdated to get the new article
  //     } else {
  //       const errorRes = await res.json();
  //       toast.error(
  //         errorRes.message || "Failed to regenerate content from outline.",
  //         {
  //           position: "top-right",
  //         }
  //       );
  //     }
  //   } catch (err) {
  //     toast.error("An error occurred while saving the outline.", {
  //       position: "top-right",
  //     });
  //   } finally {
  //     setSaveEditedOutline(false); // Hide loader
  //   }
  // };

  useEffect(() => {
    if (!saveStatus) return;
    fetchDataUpdated();
  }, [saveStatus, fileId, row]);

  // Function to fetch updated data
  const fetchDataUpdated = async () => {
    const row_id = `${fileId}_${row}`;
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
      setSaveStatus(false);
    } catch (error) {
      setApiError(error.message || "Something went wrong");
    }
  };

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
    setEditedIntent(parsedContentState);
    setEditedExplanation(parsedContentState.explanation || "");
    setEditIntent(false);
  };

  // const handleSaveEditedIntent = async () => {
  //   const updatedContent = {
  //     intent: editedIntent,
  //   };

  //   // Upsert API response to database
  //   if (editedIntent) {
  //     const { data: intent_Data } = await supabase.from("row_details").upsert(
  //       {
  //         row_id: row_id,
  //         intent: intent_Data,
  //       },
  //       { onConflict: "row_id" }
  //     );

  //     if (upsertError) {
  //       console.error("Supabase upsert error after API call:", upsertError);
  //     }
  //   }

  //   // const stringifiedIntent = JSON.stringify(updatedContent, null, 4);

  //   // const payload = {
  //   //   user_id: `${fileId}_${row}`,
  //   //   Mainkeyword: keyword,
  //   //   edit_content: {
  //   //     intent: stringifiedIntent,
  //   //   },
  //   // };

  //   // console.log("payloadd", payload);

  //   // setSaveEditedIntent(true);
  //   // try {
  //   //   const res = await fetch("/api/contentEdit", {
  //   //     method: "POST",
  //   //     headers: {
  //   //       "Content-Type": "application/json",
  //   //     },
  //   //     body: JSON.stringify(payload),
  //   //   });

  //   //   if (res.ok) {
  //   //     toast.success("Updated Outline and Article generated successfully!", {
  //   //       position: "bottom-right",
  //   //     });
  //   //     setParsedContentState(updatedContent);
  //   //     setEditIntent(false);
  //   //     setSaveStatus(true);
  //   //     await fetchDataUpdated();
  //   //   } else {
  //   //     const errorRes = await res.json();
  //   //     toast.error(errorRes.message || "Something went wrong", {
  //   //       position: "top-right",
  //   //     });
  //   //   }
  //   // } catch (err) {
  //   //   toast.error("An error occurred while saving intent", {
  //   //     position: "top-right",
  //   //   });
  //   // } finally {
  //   //   setSaveEditedIntent(false);
  //   // }
  // };

  const handleSaveEditedIntent = async () => {
    setSaveEditedIntent(true);

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("row_details")
        .upsert(
          {
            row_id: row_id,
            intent: editedIntent,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      console.log("Intent saved to database successfully:", upsertedData);
      toast.success("Intent saved successfully", {
        position: "bottom-right",
      });

      const payload = {
        user_id: row_id,
        Mainkeyword: keyword,
        edit_content: {
          intent: editedIntent,
        },
      };

      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(
        "An error occurred during the save/regeneration process:",
        err
      );
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedIntent(false);
    }
  };

  const handleSaveEditedOutline = async () => {
    setSaveEditedOutline(true);

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("outline")
        .upsert(
          {
            row_id: row_id,
            new_outline: editedOutline,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      console.log("Outline saved to database successfully:", upsertedData);
      toast.success("Intent saved successfully", {
        position: "bottom-right",
      });

      // const payload = {
      //   user_id: row_id,
      //   Mainkeyword: keyword,
      //   edit_content: {
      //     intent: editedIntent,
      //   },
      // };

      // const res = await fetch("/api/contentEdit", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
    } catch (err) {
      console.error(
        "An error occurred during the save/regeneration process:",
        err
      );
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedOutline(false);
    }
  };

  const handleSaveEditedCitable = async () => {
    setSaveEditedCitable(true);

    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("outline")
        .upsert(
          {
            row_id: row_id,
            citable_answer: editedCitable,
          },
          { onConflict: "row_id" }
        )
        .select();

      if (upsertError) {
        throw upsertError;
      }

      console.log("Citable saved to database successfully:", upsertedData);
      toast.success("Citable saved successfully", {
        position: "bottom-right",
      });

      // const payload = {
      //   user_id: row_id,
      //   Mainkeyword: keyword,
      //   edit_content: {
      //     intent: editedIntent,
      //   },
      // };

      // const res = await fetch("/api/contentEdit", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(payload),
      // });
    } catch (err) {
      console.error(
        "An error occurred during the save/regeneration process:",
        err
      );
      toast.error(err.message || "Something went wrong.", {
        position: "top-right",
      });
    } finally {
      setSaveEditedCitable(false);
    }
  };

  // # Contentful Explained: A Comprehensive Headless CMS Comparison Guide
  //   const testoutline = `
  //     * [Contentful Explained: A Comprehensive Headless CMS Comparison Guide](#contentful-explained-a-comprehensive-headless-cms-comparison-guide)
  //     * [What is Contentful? Demystifying a Modern Content Platform](#what-is-contentful-demystifying-a-modern-content-platform)
  //     * [Traditional vs. Headless: Understanding Core CMS Differences](#traditional-vs-headless-understanding-core-cms-differences)
  //         * [The Architecture of a Traditional (Monolithic) CMS](#the-architecture-of-a-traditional-monolithic-cms)
  //         * [The Rise of Headless CMS: Decoupled Content Delivery](#the-rise-of-headless-cms-decoupled-content-delivery)
  //         * [Key Distinctions: Headless CMS vs. Traditional CMS (Image: Comparison Chart)](#key-distinctions-headless-cms-vs-traditional-cms-image-comparison-chart)
  //     * [Why Choose a Headless CMS Like Contentful?](#why-choose-a-headless-cms-like-contentful)
  //         * [Advantages of Adopting a Headless Architecture (Video: Explainer)](#advantages-of-adopting-a-headless-architecture-video-explainer)
  //         * [How Contentful Works: Powering Digital Experiences](#how-contentful-works-powering-digital-experiences)
  //     * [Key Features and Benefits of the Contentful Platform](#key-features-and-benefits-of-the-contentful-platform)
  //         * [Contentful's Unique Capabilities for Developers and Marketers](#contentfuls-unique-capabilities-for-developers-and-marketers)
  //         * [Delivering Omnichannel Experiences with Contentful](#delivering-omnichannel-experiences-with-contentful)
  //     * [Who is Contentful Best For? Making the 'Better Option' Choice](#who-is-contentful-best-for-making-the-better-option-choice)
  //         * [Use Cases for Contentful: From Marketing Sites to Headless Commerce (Image: Use Case Icons)](#use-cases-for-contentful-from-marketing-sites-to-headless-commerce-image-use-case-icons)
  //         * [When is Contentful the Better Option for Your Business?](#when-is-contentful-the-better-option-for-your-business)
  //     * [Contentful FAQs: Your Questions About Headless CMS Answered](#contentful-faqs-your-questions-about-headless-cms-answered)
  //         * [Is Contentful truly a CMS, or something different?](#is-contentful-truly-a-cms-or-something-different)
  //         * [What are the main advantages and disadvantages of traditional CMS platforms?](#what-are-the-main-advantages-and-disadvantages-of-traditional-cms-platforms)
  //         * [Should I use a headless CMS or a traditional CMS for my next project?](#should-i-use-a-headless-cms-or-a-traditional-cms-for-my-next-project)
  //     * [Conclusion: Is Contentful the Right CMS for You?](#conclusion-is-contentful-the-right-cms-for-you)
  // `;

  // console.log("outlineData", outlineData);
  // console.log("outlineDataUpdated", outlineDataUpdated);

  // const getOutline = async () => {
  //   const { data: outline } = await supabase
  //     .from("outline")
  //     .select("new_outline")
  //     .eq("row_id", row_id);

  //   return outline;
  // };

  // const outline = getOutline();

  // useEffect(() => {
  //   const calculateSectionCount = async (outline) => {
  //     const lines = outline.split("\n");
  //     // Match lines that start with 4 spaces and an asterisk, but not more
  //     const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
  //     console.log("count", count);
  //     setArticleSectionCount(count);
  //     // return count;
  //   };
  //   calculateSectionCount(outline);
  // }, [outline]);

  // function getSectionHeadings(toc, n) {
  //   const lines = toc.split("\n");
  //   // console.log("toc", toc);
  //   let currentH2 = 0;
  //   let collecting = false;
  //   let result = [];

  //   for (let line of lines) {
  //     const trimmed = line.trimStart();
  //     if (trimmed.startsWith("* [")) {
  //       currentH2++;
  //       if (currentH2 === n) {
  //         collecting = true;
  //         console.log("line 1", line);

  //         result.push(line);
  //       } else if (collecting) {
  //         // Next h2 found, stop collecting
  //         break;
  //       }
  //     } else if (collecting && trimmed.startsWith("*")) {
  //       // Only collect h3/h4 (indented, but still start with '*')
  //       console.log("line 2", line);

  //       result.push(line);
  //     } else if (collecting && trimmed.startsWith("")) {
  //       // If it's an empty line, skip
  //       continue;
  //     }
  //   }
  //   return result.join("\n");
  // }

  // const section = getSectionHeadings(testoutline, 4);
  // console.log("section", section);

  const articleArr = [];

  const generateArticleSection = async (section) => {
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
    //   const count = lines.filter((line) => /^ {4}\*/.test(line)).length;
    //   console.log("count", count);
    //   setArticleSectionCount(count);
    //   // return count;
    // };
    // calculateSectionCount(outline.new_outline);

    console.log("payload", payload);

    const response = await fetch(`/api/generate-article`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("dataaaaaaaaaaa", data);

    articleArr.push(data);
    setArticleSectionGenerateCount(articleSectionGenerateCount + 1);

    // setArticleSections();
  };
  // In your React Component

  useEffect(() => {
    // Only call when switching to the Outline tab
    if (projectData.activeModalTab === "Outline") {
      // Optionally, set a loading state here, e.g., setLoading(true);

      const callGenerateOutline = async () => {
        try {
          // 1. Fetch all required data from Supabase efficiently.
          // Use .single() to get one object directly instead of an array.
          const { data: rowDetails, error: rowDetailsError } = await supabase
            .from("row_details")
            .select("keyword, intent, persona, questions, faq, outline_format")
            .eq("row_id", row_id)
            .single();

          const { data: analysis, error: analysisError } = await supabase
            .from("analysis")
            .select("lsi_keywords")
            .eq("row_id", row_id)
            .single();

          // Abort if there were any database errors
          if (rowDetailsError) throw rowDetailsError;
          if (analysisError) throw analysisError;
          if (!rowDetails) throw new Error("Details not found for this entry.");

          // 2. Safely parse and extract LSI keywords.
          let allExtractedKeywords = [];
          if (analysis?.lsi_keywords) {
            try {
              const parsedData = JSON.parse(analysis.lsi_keywords);
              allExtractedKeywords = parsedData
                .map(
                  (item) =>
                    item?.lsi_keywords?.lsi_keyword || item?.lsi_keywords
                )
                .filter(Boolean); // filter(Boolean) removes null/undefined values
            } catch (error) {
              console.error("Failed to parse lsi_keywords JSON:", error);
              // Decide how to handle malformed JSON - here we proceed with no LSI keywords.
            }
          }

          // 3. Construct the payload with the correct structure.
          const payload = {
            primary_keyword: rowDetails.keyword,
            lsi_keywords: allExtractedKeywords,
            intent: rowDetails.intent,
            persona: rowDetails.persona,
            questions: rowDetails.questions,
            faq: rowDetails.faq,
            standard_outline_format: rowDetails.outline_format,
          };

          const res = await fetch("/api/generate-outline", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload), // Corrected line
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              errorData.error || `Server responded with ${res.status}`
            );
          }

          const data = await res.json();
          console.log("Outline generated successfully:", data);

          const { error: upsertError } = await supabase.from("outline").upsert(
            {
              row_id: row_id, // <-- Add this line
              new_outline: data,
            },
            { onConflict: "row_id" }
          );

          if (upsertError) {
            throw new Error(`Failed to save analysis: ${upsertError.message}`);
          } else {
            console.log("outline saved successfully.");
          }

          setOutlineData(data);
        } catch (err) {
          console.error("Error generating outline:", err);
          toast.error(err.message || "An unexpected error occurred.");
        } finally {
          // Unset loading state here, e.g., setLoading(false);
        }
      };

      callGenerateOutline();
    }
    // 5. Use a stable dependency array. `row` and `keyword` are likely derived from `row_id`.
  }, [projectData.activeModalTab, row_id]); // Make sure `row_id` and `supabase` are available in scope.

  useEffect(() => {
    if (projectData.activeModalTab === "Citable Summary") {
      const callCitableSummary = async () => {
        // Consider adding a loading state here, e.g., setLoading(true);
        try {
          // 1. Combine into a single, more efficient query.
          // Also, use .single() to get a single object instead of an array.
          // .single() will throw an error if no row or multiple rows are found,
          // which is often the desired behavior for fetching by a unique ID.
          const { data: rowDetails, error } = await supabase
            .from("row_details")
            .select("mission_plan, outline_format")
            .eq("row_id", row_id)
            .single(); // Use .single() to get one object directly

          // 2. Proper error handling for the database query.
          if (error) {
            throw new Error(
              error.message || "Failed to fetch project details."
            );
          }

          if (!rowDetails) {
            throw new Error("No details found for this project.");
          }

          // 3. Construct the payload with the correct values from the fetched data.
          const payload = {
            mission_plan: rowDetails.mission_plan,
            initial_draft_index: rowDetails.outline_format,
          };

          const res = await fetch("/api/citable-summary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
              errorData.error || `Server responded with ${res.status}`
            );
          }

          const data = await res.json();
          console.log("Citable summary generated successfully:", data);

          setCitableData(data);

          const { error: upsertError } = await supabase.from("outline").upsert(
            {
              row_id: row_id, // <-- Add this line
              citable_answer: data,
            },
            { onConflict: "row_id" }
          );

          if (upsertError) {
            throw new Error(`Failed to save analysis: ${upsertError.message}`);
          } else {
            console.log("outline saved successfully.");
          }

          // Assuming you have a state setter like setCitableSummaryData
          setOutlineData(data); // Or a more specific state setter
        } catch (err) {
          console.error("Error generating citable summary:", err);
          toast.error(err.message || "An unexpected error occurred.");
        } finally {
          // 4. Always unset the loading state.
          // e.g., setLoading(false);
        }
      };

      callCitableSummary();
    }
  }, [projectData.activeModalTab, row_id]);
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
            Processing Row for {params.row}
          </h3>
        </div>

        {apiError && <div className="text-red-500">Error: {apiError}</div>}
        {isLoading && <Loader />}

        {!isLoading && (
          <div className="flex flex-col gap-[8px]">
            <div className="modal-tabs">
              {["Logs", "Intent", "Outline", "Citable Summary", "Article"].map(
                (tabName) => (
                  <button
                    key={tabName}
                    className={`modal-tab-button ${
                      projectData.activeModalTab === tabName ? "active" : ""
                    }`}
                    onClick={() => handleTabChange(tabName)}
                  >
                    {tabName}
                  </button>
                )
              )}
            </div>

            <div className="modal-tab-content">
              {projectData.activeModalTab === "Logs" && (
                <div className="mt-4 bg-gray-100 p-4 rounded">
                  <h4 className="font-semibold mb-2">Processing Logs</h4>
                  {logs.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {logs.map((log, i) => (
                        <li key={i}>{log.content}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No logs found.</p>
                  )}
                </div>
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
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {parsedContentState}
                          </p>
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No intent data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Outline")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {projectData.activeModalTab === "Outline" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {outlineData.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Outline
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
                          {!editOutline && (
                            <button
                              onClick={() => {
                                setEditOutline(true);
                                setEditedOutline(outlineData);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {editOutline && (
                            <>
                              {saveEditedOutline && (
                                <Loader className="loader-sm" />
                              )}
                              <button
                                disabled={saveEditedOutline}
                                onClick={handleSaveEditedOutline}
                              >
                                Save
                              </button>
                              <button
                                disabled={saveEditedOutline}
                                onClick={handleCancelEditedOutline}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editOutline ? (
                        <>
                          <textarea
                            disabled={saveEditedOutline}
                            value={editedOutline}
                            onChange={(e) => setEditedOutline(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          {/* <p className="text-black-600 text-base mb-4">
                            {outlineData}
                          </p> */}
                          <textarea
                            disabled={saveEditedOutline}
                            value={outlineData}
                            onChange={(e) => setEditedOutline(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No outline data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Citable Summary")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {projectData.activeModalTab === "Citable Summary" && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                  {outlineData.length > 0 ? (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-black-700 mb-2">
                          Citable Summary
                        </h4>

                        <div className="ml-auto flex items-center gap-[30px]">
                          {!editCitable && (
                            <button
                              onClick={() => {
                                setEditCitable(true);
                                setEditedCitable(citabledata);
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {editCitable && (
                            <>
                              {saveEditedCitable && (
                                <Loader className="loader-sm" />
                              )}
                              <button
                                disabled={saveEditedCitable}
                                onClick={handleSaveEditedCitable}
                              >
                                Save
                              </button>
                              <button
                                disabled={saveEditedCitable}
                                onClick={handleCancelEditedCitable}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editCitable ? (
                        <>
                          <textarea
                            disabled={saveEditedCitable}
                            value={editedCitable}
                            onChange={(e) => setEditedCitable(e.target.value)}
                          />
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <textarea
                            disabled={saveEditedIntent}
                            value={editedExplanation}
                            onChange={(e) =>
                              setEditedExplanation(e.target.value)
                            }
                          /> */}
                        </>
                      ) : (
                        <>
                          <p className="text-black-600 text-base mb-4">
                            {citabledata}
                          </p>
                          {/* <h4 className="text-lg font-semibold text-black-700 mb-2">
                            Explanation
                          </h4>
                          <p className="text-black-600 leading-relaxed">
                            {parsedContentState?.explanation}
                          </p> */}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-black-500">No Citable data available.</p>
                  )}

                  <button
                    onClick={() => handleTabChange("Article")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded flex ml-auto items-center gap-2"
                  >
                    Next
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}

              {/* {projectData.activeModalTab === "Content" && (
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
              )} */}

              {projectData.activeModalTab === "Article" && (
                <div className="flex flex-col md:flex-row gap-6 rb">
                  <div
                    className={`${
                      articledataUpdated.length > 0 ? "md:w-1/2" : "w-full"
                    } w-full bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200`}
                  >
                    <h4 className="text-lg font-semibold text-black-700 mb-4">
                      Generated Article
                    </h4>

                    <div className="rb">
                      {/* {articleSectionCount > 0 &&
                        Array.from({ length: articleSectionCount }).map(
                          (_, index) => {
                            return (
                              <div key={index} className="">
                                <textarea
                                  className=""
                                  defaultValue={articleSections}
                                />

                                <button
                                  onClick={() => {
                                    generateArticleSection(index + 1);
                                  }}
                                >
                                  Generate section {index + 1}
                                </button>
                              </div>
                            );
                          }
                        )} */}

                      <textarea className="" defaultValue={articleArr} />

                      <button
                        onClick={() => {
                          generateArticleSection(articleSectionGenerateCount);
                          console.log(
                            "articleSectionGenerateCount",
                            articleSectionGenerateCount
                          );
                        }}
                      >
                        Generate section test
                      </button>
                    </div>
                  </div>

                  {/* {articledataUpdated.length > 0 && (
                    <div className="w-full md:w-1/2 bg-blue-50 p-6 rounded-xl shadow-md border border-blue-300">
                      <h4 className="text-lg font-semibold text-blue-700 mb-4">
                        Updated Article
                      </h4>
                      {articledataUpdated.map((item, index) => {
                        const content = item.updated_content || "";
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
                          <div key={`updated-${index}`} className="mb-6">
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
                      })}
                    </div>
                  )} */}
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

{
  /* {articledata.length > 0 ? (
                      articledata.map((item, index) => {
                        const content = item.content || "";
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
                          <div key={`original-${index}`} className="mb-6">
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
                      })
                    ) : (
                      <p className="text-black-500">
                        No article content available.
                      </p>
                    )} */
}
