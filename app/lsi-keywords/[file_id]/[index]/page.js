"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react"; // <-- 1. Import the icon at the top of your file
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

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id; // From /contentBrief/[file_id]/index route
  const index = params.index;

  // const projectData = useAppContext();
  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  // console.log("selectedFileId", projectData.selected);

  // NEW: Handler for the "Next" button
  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/content/${fileId}/${index}`);
    // Example: router.push(`/next-step-url/${fileId}/${index}`);
    // Replace with your actual navigation logic.
  };

  // Assume 'supabase' client is initialized and accessible,
  // and 'row_id' is a variable holding the current row's ID.
  // For example, if this is within a React component:
  // const { row_id, supabase } = props; // Or from useContext, etc.
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(null);
  // const [successMessage, setSuccessMessage] = useState(null);

  const handleApprove = async () => {
    try {
      const { data: upsertedData, error: upsertError } = await supabase
        .from("analysis")
        .upsert(
          {
            row_id: row_id,
            status: "Approved", // Using "Approved" as the string literal for status
          },
          { onConflict: "row_id" } // Ensure 'row_id' is your primary key or unique constraint
        )
        .select(); // .select() is good practice to get the updated row data back

      if (upsertError) {
        // If there's an error from Supabase, throw it to jump to the catch block
        throw upsertError;
      } else {
        toast.success("LSI keywords approved successfully!", {
          position: "bottom-right", // You can change this position as needed
        });
      }

      // --- SUCCESS TOAST ---
      // Display a success toast notification.
      // 'position: "top-right"' is an option here, but if you've already
      // configured your <Toaster /> component with a default position,
      // you might not need to specify it here.

      console.log("Analysis approved successfully:", upsertedData);
      // Optional: After successful approval, you might want to:
      // 1. Update the local state of the item (e.g., change its status to "Approved").
      // 2. Re-fetch the data to ensure the UI is in sync with the database.
      // 3. Close a modal or redirect the user.
    } catch (error) {
      // Catch any errors that occurred during the process (either from Supabase or thrown)
      console.error("Error approving analysis:", error.message || error);
      // --- ERROR TOAST (Highly Recommended for user feedback) ---
      // Display an error toast to inform the user about the failure.
      toast.error(
        `Failed to approve LSI keywords: ${error.message || "Unknown error"}`,
        {
          position: "top-right",
        }
      );
    } finally {
      // Optional: This block will always execute, regardless of success or failure.
      // It's a good place to hide loading indicators.
      // setIsLoading(false);
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

  const [editIntent, setEditIntent] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editOutline, setEditOutline] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editLSI, setEditLSI] = useState(false);
  const [editWordCount, setEditWordCount] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editDensity, setEditDensity] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editGaps, setEditGaps] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editOpportunities, setEditOpportunities] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });

  const [editedLsiData, setEditedLsiData] = useState({});

  const [editCompAnalysis, setEditCompAnalysis] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });

  const [editValueAdd, setEditValueAdd] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
  const [editedCompAnalysis, setEditedCompAnalysis] = useState("");
  const [editedValueAdd, setEditedValueAdd] = useState("");

  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isGeneratingValueAdd, setIsGeneratingValueAdd] = useState(false);

  //   !-----------------------------------
  const handleEditIntent = (item) => {
    setEditIntent({ ...editIntent, [`comp${item}`]: true });
  };
  const handleSaveIntent = (item) => {
    //! save intent function call
  };
  const handleCancelIntent = (item) => {
    setEditIntent({ ...editIntent, [`comp${item}`]: false });
  };

  //   !-----------------------------------
  const handleEditOutline = (item) => {
    setEditOutline({ ...editOutline, [`comp${item}`]: true });
  };
  const handleSaveOutline = () => {
    //! save outline function call
  };
  const handleCancelOutline = (item) => {
    setEditOutline({ ...editOutline, [`comp${item}`]: false });
  };

  //   !-----------------------------------
  const handleEditLSI = (item) => {
    // item is 1-based index (comp1, comp2, ...)
    // For each lsiData entry, initialize editedLsiData as an array of {keyword, value}
    const newEditedLsiData = { ...editedLsiData };
    lsiData.forEach((lsi, idx) => {
      const baseKeywords = String(lsi.lsi_keywords || "");
      const parts = baseKeywords.split(",");
      const pairs = [];
      for (let i = 0; i < parts.length; i += 2) {
        const keyword = parts[i] ? parts[i].trim() : "";
        const value = parts[i + 1] ? parts[i + 1].trim() : "";
        if (keyword) {
          pairs.push({ keyword, value });
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
        selectedRowIndex: index, // Set selectedRowIndex to the index + 1
      });

      // Transform the article data into an array of URLs
      const urls = article
        .filter((item) => typeof item.comp_url === "string" && item.comp_url) // Ensure comp_url is a valid string
        .flatMap((item) => item.comp_url.split("\n").map((url) => url.trim())) // Split by newline and trim whitespace
        .filter((url) => url); // Remove any empty strings

      if (urls.length === 0) {
        throw new Error("No valid competitor URLs found");
      }

      console.log("Competitor URLs:", urls);

      const backendPayload = {
        urls,
      };

      console.log("backendPayload", backendPayload);

      // const response = await fetch("/api/lsi-keywords", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(backendPayload),
      // });
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

  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    if (!row_id) {
      throw new Error("Invalid or missing row_id");
    }

    const { data: lsi_keywords, error } = await supabase
      .from("analysis")
      .select("lsi_keywords")
      .eq("row_id", row_id);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    } else {
      console.log("lsi_keywords", lsi_keywords);
      if (lsi_keywords && lsi_keywords.length > 0) {
        const jsonString = lsi_keywords[0].lsi_keywords;

        try {
          // 3. Parse the string into a JavaScript array
          const parsedData = JSON.parse(jsonString);

          const comp_contents = parsedData.map((item) => item.raw_text);
          const url = parsedData.map((item) => item.url);

          const competitorData = parsedData.map((item) => ({
            raw_text: item.raw_text,
            url: item.url,
          }));

          console.log("Data to send to API:", competitorData);

          console.log("url", url);

          console.log("Extracted Raw Texts:", comp_contents);

          const payload = {
            comp_contents: competitorData,
          };

          const response = await fetch("/api/comp-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `HTTP error: ${response.status}`
            );
          }

          const data = await response.json();
          setCompAnalysis(data);

          const { data: lsi_data, error } = await supabase
            .from("analysis")
            .upsert(
              {
                row_id: row_id,
                comp_analysis: data,
              },
              { onConflict: "row_id" }
            );

          if (lsi_data) {
            console.log("added succesfully");
          }

          console.log("data", data);
        } catch (parseError) {
          console.error(
            "Failed to parse lsi_keywords JSON string:",
            parseError
          );
        }
      }
    }
    setIsGeneratingAnalysis(false);
  };

  const generateValueAdd = async () => {
    setIsGeneratingValueAdd(true);
    try {
      if (!row_id) {
        // It's better to notify the user or log this, but throwing is fine too.
        throw new Error("Invalid or missing row_id");
      }

      // Fetch both pieces of data in parallel for better performance
      const [analysisResult, rowDetailsResult] = await Promise.all([
        supabase
          .from("analysis")
          .select("comp_analysis")
          .eq("row_id", row_id)
          .single(),
        supabase
          .from("row_details")
          .select("mission_plan")
          .eq("row_id", row_id)
          .single(),
      ]);

      const { data: analysisData, error: errorAnalysis } = analysisResult;
      const { data: rowDetailsData, error: errorMission } = rowDetailsResult;

      // FIX: Correctly check for and combine error messages.
      if (errorAnalysis || errorMission) {
        const errorMessage = [errorAnalysis?.message, errorMission?.message]
          .filter(Boolean)
          .join("; ");
        throw new Error(`Supabase error: ${errorMessage}`);
      }

      // FIX: Add checks to ensure data exists before trying to access properties.
      // This prevents "Cannot read properties of undefined" errors.
      if (!analysisData || !rowDetailsData) {
        throw new Error("Required data not found for the given row_id.");
      }

      // FIX: Use new variable names to avoid "Identifier has already been declared" error.
      const competitive_analysis_report = analysisData.comp_analysis;
      const mission_plan_context = rowDetailsData.mission_plan;

      const payload = {
        mission_plan_context, // Shorthand for mission_plan_context: mission_plan_context
        competitive_analysis_report,
      };

      console.log("payload", payload);

      const response = await fetch("/api/value_add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Provide a more graceful error message from the API.
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Successfully generated value add:", data);

      setValueAdd(data);

      // You can now use the 'data' to update state or perform the upsert.
      // For example: setCompAnalysis(data);

      // The commented-out upsert logic can now be safely used.

      const { error: upsertError } = await supabase.from("analysis").upsert(
        {
          row_id: row_id, // <-- Add this line
          value_add: data,
        },
        { onConflict: "row_id" }
      );

      if (upsertError) {
        throw new Error(`Failed to save analysis: ${upsertError.message}`);
      } else {
        console.log("Analysis saved successfully.");
      }
    } catch (error) {
      console.error("Failed to generate value add:", error);
      // Here you would typically show a notification to the user
      // e.g., toast.error(error.message);
    } finally {
      // FIX: This ensures the loading spinner is turned off regardless of success or failure.
      setIsGeneratingValueAdd(false);
    }
  };
  const handleSaveLSI = async (compIndex) => {
    const updatedLsi = lsiData.map((item, idx) => {
      const tableEditKey = `${idx}_${item.url}`;
      let lsi_keywords = item.lsi_keywords;

      if (editedLsiData[tableEditKey]) {
        // Reconstruct as comma-separated string: keyword1,value1,keyword2,value2,...
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
      selectedRowIndex: index, // Set selectedRowIndex to the index + 1
    });

    // Save to Supabase
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

  //   !-------------------------------------
  const handleEditWordCount = (item) => {
    setEditWordCount({ ...editWordCount, [`comp${item}`]: true });
  };
  const handleSaveWordCount = () => {
    //! save LSI function call
  };
  const handleCancelWordCount = (item) => {
    setEditWordCount({ ...editWordCount, [`comp${item}`]: false });
  };

  //   !-------------------------------------
  const handleEditDensity = (item) => {
    setEditDensity({ ...editDensity, [`comp${item}`]: true });
  };
  const handleSaveDensity = () => {
    //! save LSI function call
  };
  const handleCancelDensity = (item) => {
    setEditDensity({ ...editDensity, [`comp${item}`]: false });
  };

  //   !-------------------------------------
  const handleEditGaps = (item) => {
    setEditGaps({ ...editGaps, [`comp${item}`]: true });
  };
  const handleSaveGaps = () => {
    //! save Gaps function call
  };
  const handleCancelGaps = (item) => {
    setEditGaps({ ...editGaps, [`comp${item}`]: false });
  };

  //   !-------------------------------------
  const handleEditOpportunities = (item) => {
    setEditOpportunities({ ...editOpportunities, [`comp${item}`]: true });
  };
  const handleSaveOpportunities = () => {
    //! save Opportunities function call
  };
  const handleCancelOpportunities = (item) => {
    setEditOpportunities({ ...editOpportunities, [`comp${item}`]: false });
  };

  const handleEditCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: true });
    setEditedCompAnalysis(compAnalysis); // Load current value for editing
  };

  const handleEditValueAdd = (item) => {
    setEditValueAdd({ ...editValueAdd, [`comp${item}`]: true });
    setEditedValueAdd(valueAdd); // Load current value for editing
  };

  const handleSaveCompAnalysis = async (compIndex) => {
    // Save to Supabase
    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        comp_analysis: editedCompAnalysis,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.error("Supabase upsert error after API call:", error);
    } else {
      setCompAnalysis(editedCompAnalysis);
      setEditCompAnalysis({ ...editCompAnalysis, [`comp${compIndex}`]: false });
    }
  };

  const handleSaveValueAdd = async (compIndex) => {
    // Save to Supabase
    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        value_add: editedValueAdd,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.error("Supabase upsert error after API call:", error);
    } else {
      setValueAdd(editedValueAdd);
      setEditValueAdd({ ...editValueAdd, [`comp${compIndex}`]: false });
    }
  };

  const handleCancelCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: false });
    setEditedCompAnalysis(compAnalysis); // Reset to original
  };

  const handleCancelValueAdd = (item) => {
    setEditValueAdd({ ...editValueAdd, [`comp${item}`]: false });
    setEditedValueAdd(valueAdd); // Reset to the original value
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!row_id) return;

      // Fetch LSI and competitor analysis data from Supabase
      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords, comp_analysis")
        .eq("row_id", row_id)
        .single();

      // if (error) {
      //   console.error("Error fetching analysis data:", error);
      //   return;
      // }

      if (data) {
        // Parse and set LSI data
        if (data.lsi_keywords) {
          try {
            setLsiData(
              typeof data.lsi_keywords === "string"
                ? JSON.parse(data.lsi_keywords)
                : data.lsi_keywords
            );
          } catch (e) {
            setLsiData(data.lsi_keywords); // fallback if already parsed
          }
        }
        // Set competitor analysis data
        if (data.comp_analysis) {
          setCompAnalysis(data.comp_analysis);
        }
      }
    };

    fetchAnalysisData();
  }, [row_id]);

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
                  {/* lsi section */}
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
                            // Optional: Add some padding for a better click area
                            className="p-1 text-gray-600 hover:text-black"
                          >
                            <Pencil className="h-5 w-5" />{" "}
                            {/* <-- 2. Use the icon component */}
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

                    {/* {lsiData &&
                      lsiData.map((item, idx) => (
                        <div key={idx} className="mb-4">
                          <label className="block font-bold mb-1">
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
                          <textarea
                            disabled={!editLSI[`comp${index + 1}`]}
                            className="focus:outline-[#1abc9c] focus:outline-2 w-full p-2 border rounded"
                            rows="8"
                            value={
                              editLSI[`comp${index + 1}`]
                                ? editedLsiData[`${idx}_${item.url}`] !==
                                  undefined
                                  ? editedLsiData[`${idx}_${item.url}`]
                                  : item.lsi_keywords
                                : item.lsi_keywords
                            }
                            onChange={(e) => {
                              setEditedLsiData({
                                ...editedLsiData,
                                [`${idx}_${item.url}`]: e.target.value,
                              });
                            }}
                          />
                        </div>
                      ))} */}

                    {lsiData &&
                      lsiData.map((item, idx) => {
                        const baseKeywords = String(item.lsi_keywords || "");

                        const transformedKeywordsForTextarea = baseKeywords
                          .split(",") // Split by comma
                          .map((s) => s.trim()) // Trim whitespace from each part
                          .filter((s) => s) // Remove any empty strings (e.g., from "a,,b")
                          .join("\n"); // Join with newlines for textarea display

                        // 3. Prepare data for the TABLE DISPLAY (parsing into keyword/value pairs)
                        const keywordValuePairs = [];
                        const parts = baseKeywords.split(","); // Split the original string by comma
                        for (let i = 0; i < parts.length; i += 2) {
                          // Each pair consists of a keyword (at index i) and a value (at index i+1)
                          const keyword = parts[i] ? parts[i].trim() : "";
                          const value = parts[i + 1]
                            ? parseFloat(parts[i + 1].trim())
                            : null; // Parse the float value

                          // Only add to pairs if a keyword part exists
                          if (keyword) {
                            keywordValuePairs.push({
                              keyword,
                              value: isNaN(value) ? null : value, // Handle cases where parsing might result in NaN
                            });
                          }
                        }

                        // Determine if this specific item is in edit mode.
                        // Assuming 'index' from your original code refers to 'idx' from the map loop.
                        const isEditing = editLSI;

                        // Prepare editable data structure
                        const tableEditKey = `${idx}_${item.url}`;
                        const editedPairs =
                          editedLsiData[tableEditKey] ||
                          keywordValuePairs.map((pair) => ({ ...pair }));

                        return (
                          <div
                            key={idx}
                            className="mb-4 p-4 border border-gray-200 rounded-md"
                          >
                            {" "}
                            {/* Added some styling for better separation */}
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
                            <div className="overflow-x-auto mt-2">
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
                                                setEditedLsiData({
                                                  ...editedLsiData,
                                                  [tableEditKey]: newPairs,
                                                });
                                              }}
                                              className="w-full border rounded px-1"
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
                                                newPairs[pairIdx].value =
                                                  e.target.value;
                                                setEditedLsiData({
                                                  ...editedLsiData,
                                                  [tableEditKey]: newPairs,
                                                });
                                              }}
                                              className="w-full border rounded px-1"
                                            />
                                          ) : !isNaN(Number(pair.value)) &&
                                            pair.value !== "" ? (
                                            Number(pair.value).toFixed(10)
                                          ) : (
                                            pair.value || "N/A"
                                          )}
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
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-6 flex justify-end">
                    {/* <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Next
                    </button> */}

                    <button
                      onClick={handleApprove}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Approve
                    </button>
                  </div>

                  {/* <div>
                    <div className="mb-[8px] flex justify-between items-center">
                      <p className="font-bold mb-[8px]">Outline:</p>
                      <div className="flex gap-[8px]">
                        {!editOutline[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleEditOutline(index + 1);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {editOutline[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleSaveOutline(index + 1);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {editOutline[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleCancelOutline(index + 1);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      disabled={!editOutline[`comp${index + 1}`]}
                      className="focus:outline-[#1abc9c] focus:outline-2"
                      rows="20"
                      defaultValue={item.outline}
                    />
                  </div> */}

                  {/* <div>
                    <div className="mb-[8px] flex justify-between items-center">
                      <p className="font-bold mb-[8px]">Word Count:</p>
                      <div className="flex gap-[8px]">
                        {!editWordCount[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleEditWordCount(index + 1);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {editWordCount[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleSaveWordCount(index + 1);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {editWordCount[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleCancelWordCount(index + 1);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      disabled={!editWordCount[`comp${index + 1}`]}
                      className="focus:outline-[#1abc9c] focus:outline-2"
                      rows="1"
                      defaultValue={item.wordCount}
                    />
                  </div>
                  <div>
                    <div className="mb-[8px] flex justify-between items-center">
                      <p className="font-bold mb-[8px]">Density:</p>
                      <div className="flex gap-[8px]">
                        {!editDensity[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleEditDensity(index + 1);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {editDensity[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleSaveDensity(index + 1);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {editDensity[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleCancelDensity(index + 1);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      disabled={!editDensity[`comp${index + 1}`]}
                      className="focus:outline-[#1abc9c] focus:outline-2"
                      rows="1"
                      defaultValue={item.density}
                    />
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
