"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";

export default function Step2_Intent() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [customKeywordInput, setCustomKeywordInput] = useState("");

  const handleGenerateLSI = async () => {
    if (!projectData.primaryKeyword) {
      alert("Please enter a primary keyword.");
      return;
    }
    setIsLoading(true);
    // Simulate API call for LSI keywords
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const mockLSI = [
      { text: `what is ${projectData.primaryKeyword}`, checked: true },
      { text: `${projectData.primaryKeyword} benefits`, checked: true },
      { text: `best ${projectData.primaryKeyword} reviews`, checked: false },
      { text: `how to use ${projectData.primaryKeyword}`, checked: true },
    ];
    updateProjectData({ lsiKeywords: mockLSI });
    setIsLoading(false);
  };

  const handleAddCustomKeyword = () => {
    if (customKeywordInput.trim() === "") return;
    const newKeyword = { text: customKeywordInput.trim(), checked: true };
    updateProjectData({
      customKeywords: [...projectData.customKeywords, newKeyword],
    });
    setCustomKeywordInput("");
  };

  const toggleLSIKeyword = (index) => {
    const updatedLSI = projectData.lsiKeywords.map((kw, i) =>
      i === index ? { ...kw, checked: !kw.checked } : kw
    );
    updateProjectData({ lsiKeywords: updatedLSI });
  };

  const toggleCustomKeyword = (index) => {
    const updatedCustom = projectData.customKeywords.map((kw, i) =>
      i === index ? { ...kw, checked: !kw.checked } : kw
    );
    updateProjectData({ customKeywords: updatedCustom });
  };

  const handleNext = () => {
    setActiveStep(STEPS[2].id);
  };

  useEffect(() => {
    if (
      projectData.primaryKeyword !== "" &&
      projectData.lsiKeywords.length <= 0
    ) {
      handleGenerateLSI();
    }
  }, [projectData]);

  return (
    <div className="step-component">
      <h3>2. Primary Keyword & Intent</h3>

      <h4 htmlFor="primaryKeyword">Primary Keyword:</h4>
      {projectData.primaryKeyword === "" ? (
        <Loader />
      ) : (
        <input
          disabled
          type="text"
          id="primaryKeyword"
          value={projectData.primaryKeyword}
          onChange={(e) =>
            updateProjectData({ primaryKeyword: e.target.value })
          }
          placeholder="Enter primary keyword"
        />
      )}

      <h4 htmlFor="primaryKeyword">Intent:</h4>
      {projectData.primaryIntent === "" ? (
        <Loader />
      ) : (
        <textarea
          id="primaryIntent"
          value={projectData.primaryIntent}
          onChange={(e) => updateProjectData({ primaryIntent: e.target.value })}
          placeholder="Enter intent"
          rows="5"
        ></textarea>
      )}

      {/* <button
        onClick={handleGenerateLSI}
        disabled={isLoading || !projectData.primaryKeyword}
      >
        {isLoading ? "Generating..." : "Generate LSI Keywords"}
      </button> */}

      {/* {isLoading && <Loader />} */}

      {/* {projectData.lsiKeywords.length > 0 && !isLoading && (
        <>
          <h4>LSI Keywords (Select to use):</h4>
          <ul className="keyword-list">
            {projectData.lsiKeywords.map((kw, index) => (
              <li key={`lsi-${index}`}>
                <input
                  type="checkbox"
                  id={`lsi-${index}`}
                  checked={kw.checked}
                  onChange={() => toggleLSIKeyword(index)}
                />
                <label htmlFor={`lsi-${index}`}>{kw.text}</label>
              </li>
            ))}
          </ul>
        </>
      )} */}

      {/* <h4>Custom Keywords:</h4>
      <div style={{ display: "flex", marginBottom: "15px" }}>
        <input
          type="text"
          value={customKeywordInput}
          onChange={(e) => setCustomKeywordInput(e.target.value)}
          placeholder="Add a custom keyword"
          style={{ flexGrow: 1, marginRight: "10px", marginBottom: "0" }}
          onKeyPress={(e) => e.key === "Enter" && handleAddCustomKeyword()}
        />
        <button onClick={handleAddCustomKeyword} className="ssecondary">
          Add
        </button>
      </div>
      {projectData.customKeywords.length > 0 && (
        <ul className="keyword-list">
          {projectData.customKeywords.map((kw, index) => (
            <li key={`custom-${index}`}>
              <input
                type="checkbox"
                id={`custom-${index}`}
                checked={kw.checked}
                onChange={() => toggleCustomKeyword(index)}
              />
              <label htmlFor={`custom-${index}`}>{kw.text}</label>
            </li>
          ))}
        </ul>
      )} */}
      <button onClick={handleNext}>Next: Audience & Intent</button>
    </div>
  );
}
