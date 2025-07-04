"use client";

import Loader from "@/components/common/Loader";
import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react"; // <-- 1. Import the icon at the top of your file
import { usePathname, useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [lsiData, setLsiData] = useState("");
  const [compAnalysis, setCompAnalysis] = useState("");
  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id; // From /contentBrief/[file_id]/index route
  const index = params.index;

  // const projectData = useAppContext();
  const row_id = "1B3w0VIoRh_cRb-Q9WGmOzgLyLrAjmCkmnmRJrT4KkDg_1";
  const supabase = createClientComponentClient();

  // console.log("selectedFileId", projectData.selected);

  // NEW: Handler for the "Next" button
  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/content/${fileId}/${index}`);
    // Example: router.push(`/next-step-url/${fileId}/${index}`);
    // Replace with your actual navigation logic.
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
  const [editLSI, setEditLSI] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });
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
    setEditLSI({ ...editLSI, [`comp${item}`]: true });
  };

  const generateLsi = async () => {
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
    return data;
  };

  const generateAnalysis = async () => {
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
  };
  const handleSaveLSI = async (compIndex) => {
    // Gather the edited LSI values for this competitor
    const updatedLsi = lsiData.map((item, idx) => ({
      ...item,
      raw_text:
        editedLsiData[`${compIndex - 1}_${item.url}`] !== undefined
          ? editedLsiData[`${compIndex - 1}_${item.url}`]
          : item.raw_text,
    }));

    // Save to Supabase
    const { data: lsi_data, error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        lsi_keywords: updatedLsi,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      console.error("Supabase upsert error after API call:", error);
    } else {
      console.log("LSI updated in db");
      setLsiData(updatedLsi); // Update local state if needed
      setEditLSI({ ...editLSI, [`comp${compIndex}`]: false });
    }
  };
  const handleCancelLSI = (item) => {
    setEditLSI({ ...editLSI, [`comp${item}`]: false });
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

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!row_id) return;

      // Fetch LSI and competitor analysis data from Supabase
      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords, comp_analysis")
        .eq("row_id", row_id)
        .single();

      if (error) {
        console.error("Error fetching analysis data:", error);
        return;
      }

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
      <div className="container px-4 py-6">
        <main className="main-content step-component">
          <h3 className="text-xl font-semibold mb-6 text-blue-600">
            2. Analysis
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
                          onClick={() => {
                            generateLsi();
                          }}
                        >
                          Generate LSI
                        </button>
                        {!editLSI[`comp${index + 1}`] && (
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
                        {editLSI[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleSaveLSI(index + 1);
                            }}
                          >
                            Save
                          </button>
                        )}
                        {editLSI[`comp${index + 1}`] && (
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
                    {/* <textarea
                      disabled={!editLSI[`comp${index + 1}`]}
                      className="focus:outline-[#1abc9c] focus:outline-2"
                      rows="4"
                      defaultValue={lsiData}
                    /> */}
                    {lsiData &&
                      lsiData.map((item, index) => (
                        <div key={index} className="mb-4">
                          {" "}
                          {/* A key is required for lists in React */}
                          <label className="block font-bold mb-1">
                            Result {index + 1} (Source:{" "}
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
                              // editedLsiData[`${index}_${item.url}`] !==
                              // undefined
                              //   ? editedLsiData[`${index}_${item.url}`]
                              //   : item.raw_text
                              `${item.lsi_keywords}`
                            }
                            onChange={(e) => {
                              setEditedLsiData({
                                ...editedLsiData,
                                [`${index}_${item.url}`]: e.target.value,
                              });
                            }}
                          />
                        </div>
                      ))}
                  </div>
                  {/* lsi section end*/}
                  {/* <div>
                    <p className="font-bold text-[24px]">
                      Competitor {index + 1}
                    </p>
                  </div> */}
                  <div>
                    <div className="mb-[8px] flex justify-between items-center">
                      <p className="font-bold text-[24px] ">
                        Competitor Analysis
                      </p>
                      <div className="flex gap-[8px]">
                        <button
                          onClick={() => {
                            generateAnalysis();
                          }}
                        >
                          Generate Analysis
                        </button>
                        {!editIntent[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleEditIntent(index + 1);
                            }}
                          >
                            <Pencil className="h-5 w-5" />{" "}
                            {/* <-- 2. Use the icon component */}
                          </button>
                        )}
                        {editIntent[`comp${index + 1}`] && (
                          <button onClick={handleSaveIntent}>Save</button>
                        )}
                        {editIntent[`comp${index + 1}`] && (
                          <button
                            onClick={() => {
                              handleCancelIntent(index + 1);
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      disabled={!editIntent[`comp${index + 1}`]}
                      className="focus:outline-[#1abc9c] focus:outline-2"
                      rows="2"
                      defaultValue={compAnalysis}
                    />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    // disabled={isEditing} // Optional: disable "Next" while editing
                    >
                      Next
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
