"use client";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step3_OutlineCreation() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const bodyData = {
      Persona: "abc",
      Keywords: "xyz",
      Intent: "lmn",
    };
    const response = await fetch("/api/generate-outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // cache: "no-store",
      body: JSON.stringify(bodyData),
    });
    const generatedOutline = await response.json()
    setIsLoading(false);
    updateProjectData({ outline: generatedOutline })
    handleNext();
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
      <h3>4. Outline Creation</h3>
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
