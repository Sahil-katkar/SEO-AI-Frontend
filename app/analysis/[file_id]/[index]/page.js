"use client";

import Loader from "@/components/common/Loader";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import MissionPlan from "@/components/MissionPlan";
import StatusHeading from "@/components/StatusHeading";
import ValueAdd from "@/components/ValueAdd";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function Analysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [lsiData, setLsiData] = useState("");
  const [compAnalysis, setCompAnalysis] = useState("");

  const router = useRouter();
  const params = useParams();
  const fileId = params.file_id;
  const index = params.index;
  const [status, setstatus] = useState("");

  const row_id = `${fileId}_${index}`;
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("analysis")
        .select("status")
        .eq("row_id", row_id);

      console.log("status", data[0]?.status);

      if (data) {
        setstatus(data[0]?.status);
      } else {
        toast.error(error?.message || "Error fetching status", {
          position: "top-right",
        });
      }
    };

    fetchStatus();
  }, [row_id]);

  const handleNext = () => {
    console.log("Navigating to the next step...");
    router.push(`/content/${fileId}/${index}`);
  };

  const [editCompAnalysis, setEditCompAnalysis] = useState({
    comp1: false,
    comp2: false,
    comp3: false,
  });

  const [editedCompAnalysis, setEditedCompAnalysis] = useState("");
  // const [editedValueAdd, setEditedValueAdd] = useState("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  // const [isGeneratingValueAdd, setIsGeneratingValueAdd] = useState(false);
  const [isAnalysisGenerated, setIsAnalysisGenerated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  //   !-----------------------------------
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

          try {
            const response = await fetch("/api/comp-analysis", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            let data;
            if (!response.ok) {
              let errorMsg = `HTTP error: ${response.status}`;
              try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
              } catch (jsonErr) {
                errorMsg = response.statusText || errorMsg;
              }
              throw new Error(errorMsg);
            } else {
              data = await response.json();
            }

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
          } catch (e) {
            let msg = e.message || "";
            if (msg.includes("404")) {
              msg = "The requested resource was not found (404).";
            } else if (msg.includes("501")) {
              msg = "This feature is not implemented on the server (501).";
            } else if (msg === "Failed to fetch") {
              msg = "API is not available. Please try again later.";
            } else if (!msg) {
              msg = "An unexpected error occurred.";
            }
            toast.error(msg, { position: "top-right" });
          }
        } catch (parseError) {
          toast.error("Error ", {
            position: "top-right",
          });
        }
      }
    }
    setIsGeneratingAnalysis(false);
    setIsAnalysisGenerated(true);
  };

  const handleEditCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: true });
    setEditedCompAnalysis(compAnalysis);
  };

  // const handleEditValueAdd = (item) => {
  //   setEditValueAdd({ ...editValueAdd, [`comp${item}`]: true });
  //   setEditedValueAdd(valueAdd);
  // };

  const handleSaveCompAnalysis = async (compIndex) => {
    const { error } = await supabase.from("analysis").upsert(
      {
        row_id: row_id,
        comp_analysis: editedCompAnalysis,
      },
      { onConflict: "row_id" }
    );

    if (error) {
      toast.error(error.message || "Error saving competitor analysis", {
        position: "top-right",
      });
    } else {
      setCompAnalysis(editedCompAnalysis);
      setEditCompAnalysis({ ...editCompAnalysis, [`comp${compIndex}`]: false });
    }
  };

  // const handleSaveValueAdd = async (compIndex) => {
  //   const { error } = await supabase.from("analysis").upsert(
  //     {
  //       row_id: row_id,
  //       value_add: editedValueAdd,
  //     },
  //     { onConflict: "row_id" }
  //   );

  //   if (error) {
  //     toast.error(error.message || "Error saving value add", {
  //       position: "top-right",
  //     });
  //   } else {
  //     setValueAdd(editedValueAdd);
  //     setEditValueAdd({ ...editValueAdd, [`comp${compIndex}`]: false });
  //   }
  // };

  const handleCancelCompAnalysis = (item) => {
    setEditCompAnalysis({ ...editCompAnalysis, [`comp${item}`]: false });
    setEditedCompAnalysis(compAnalysis);
  };

  useEffect(() => {
    const fetchAnalysisData = async (row_id) => {
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

    fetchAnalysisData(row_id);
  }, [row_id]);

  return (
    <>
      <div className="container px-4 py-6">
        <main className="main-content step-component">
          <StatusHeading status={status} />

          <h3 className="text-xl font-semibold mb-6 text-blue-600">Analysis</h3>

          {isLoading && <Loader />}

          <div className="flex flex-col gap-[30px]">
            {/* {analysisArr.map((item, index) => ( */}
            <div
              // key={index}
              className="flex flex-col gap-[30px] rounded-[12px] border-[1px] border-gray-200 py-3 px-4 text-sm hover:bg-gray-50 transition"
            >
              <CompetitorAnalysis
                compAnalysis={compAnalysis}
                generateAnalysis={generateAnalysis}
                isGeneratingAnalysis={isGeneratingAnalysis}
                editCompAnalysis={editCompAnalysis}
                index={index}
                handleEditCompAnalysis={handleEditCompAnalysis}
                handleSaveCompAnalysis={handleSaveCompAnalysis}
                handleCancelCompAnalysis={handleCancelCompAnalysis}
                editedCompAnalysis={editedCompAnalysis}
                setEditedCompAnalysis={setEditedCompAnalysis}
              />

              <ValueAdd compAnalysis={compAnalysis} row_id={row_id} />

              <MissionPlan
                isEditing={isEditing}
                handleNext={handleNext}
                row_id={row_id}
              />
            </div>
            {/* ))} */}
          </div>
        </main>
        <ToastContainer />
      </div>
    </>
  );
}
