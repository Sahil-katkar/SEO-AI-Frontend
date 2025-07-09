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
  // const [compAnalysis, setCompAnalysis] = useState("");

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

  const [isEditing, setIsEditing] = useState(false);

  //   !-----------------------------------
  useEffect(() => {
    const fetchAnalysisData = async (row_id) => {
      if (!row_id) return;

      const { data, error } = await supabase
        .from("analysis")
        .select("lsi_keywords")
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
              <CompetitorAnalysis row_id={row_id} />

              <ValueAdd row_id={row_id} />

              <MissionPlan row_id={row_id} />

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  //   disabled={isEditing}
                >
                  Next
                </button>
              </div>
            </div>
            {/* ))} */}
          </div>
        </main>
        <ToastContainer />
      </div>
    </>
  );
}
