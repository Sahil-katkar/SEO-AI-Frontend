"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step4_OutlineCreation() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    // Simulate API call for outline generation
    // This would use projectData.primaryKeyword, selected LSI/custom keywords, etc.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    
    // const body = {
    //   Persona: "abc",
    //   Keywords: "xyz",
    //   Intent: "lmn",
    // };
    // const pythonResponse = await fetch(
    //   "http://127.0.0.1:8000/generate-outline/",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     cache: "no-store",
    //     body: body,
    //   }
    // );

    // const data = await pythonResponse.json();
    // console.log("data", data);

    // const mockOutline = `H1: The Ultimate Guide to ${
    //   projectData.primaryKeyword || "Your Topic"
    // }`;
  };

  const handleNext = () => {
    // Add validation if needed
    // if (!projectData.outline.trim()) {
    //   alert("Please generate or provide an outline.");
    //   return;
    // }
    setActiveStep(STEPS[4].id);
  };

  return (
    <div className="step-component">
      <h3>4. Competitor Analysis & Outline Generation</h3>
      <p>
        Generate an article outline based on competitor data and your keywords,
        then edit as needed.
      </p>
      <button onClick={handleGenerateOutline} disabled={isLoading}>
        {isLoading
          ? "Generating Outline..."
          : "Generate Outline from Competitors"}
      </button>

      {isLoading && <Loader />}

      {!isLoading && (
        <>
          <label htmlFor="articleOutline">Article Outline (Editable):</label>
          <textarea
            id="articleOutline"
            value={projectData.outline}
            onChange={(e) => updateProjectData({ outline: e.target.value })}
            placeholder="Enter or generate your article outline here. Use H1, H2, H3 for structure."
            rows="15"
          ></textarea>
        </>
      )}
      <button onClick={handleNext} disabled={isLoading}>
        Next: Content Parameters
      </button>
    </div>
  );
}
