"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Step3_OutlineCreation() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [outlineContent, setOutlineContent] = useState(
    localStorage.getItem("article") || ""
  );
  const [editedOutline, setEditedOutline] = useState(
    localStorage.getItem("editedarticle") || ""
  );
  const [apiError, setApiError] = useState(null);
  const [isSavingOutlineDoc, setIsSavingOutlineDoc] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    setError(null);

    const persona = projectData.Persona || "Default Persona";
    const keywords = projectData.primaryKeyword || "";
    const intent = projectData.primaryIntent || "";

    if (!keywords || !intent) {
      const validationError =
        "Primary keyword and intent are required to generate an outline.";
      console.error("Frontend Validation Error:", validationError);
      setError(validationError);
      setIsLoading(false);
      toast.error(validationError, { position: "top-right" });
      return;
    }

    const bodyData = {
      Persona: persona,
      Keywords: keywords,
      Intent: intent,
    };

    let responseText;

    try {
      console.log("Frontend: Attempting to generate outline");
      const response = await fetch("/api/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      console.log(
        `Frontend Debug (generate outline): Received response status from Next.js API: ${response.status}`
      );

      try {
        responseText = await response.text();
        console.log(
          "Frontend Debug (generate outline): Raw API response text:",
          responseText
        );
      } catch (textError) {
        console.error(
          "Frontend Debug (generate outline): Failed to read response text:",
          textError
        );
        responseText = "";
      }

      let generatedOutline;
      try {
        generatedOutline = JSON.parse(responseText);
        console.log(
          "Frontend Debug (generate outline): Successfully parsed JSON data from API:",
          generatedOutline
        );
      } catch (parseError) {
        console.error(
          "Frontend Debug (generate outline): Failed to parse JSON from API response text.",
          parseError
        );
        const errorMessage = `Failed to parse JSON response from API: ${parseError.message}. Raw response: ${responseText}`;
        setError(errorMessage);
        toast.error(
          `Error: Invalid response format from API for outline. See console.`,
          { position: "top-right" }
        );
        return;
      }

      if (!response.ok) {
        console.error(
          "Frontend Debug (generate outline): Next.js API returned error status but JSON parsed:",
          response.status,
          generatedOutline
        );
        const errorMessage =
          generatedOutline && generatedOutline.error
            ? generatedOutline.error
            : `HTTP error! status: ${response.status}`;
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`, { position: "top-right" });
        return;
      }

      const outlineText = generatedOutline;

      if (typeof outlineText === "string" && outlineText.trim()) {
        console.log("Generated Outline:", outlineText);
        updateProjectData({ outline: outlineText });
        setOutlineContent(outlineText);
        localStorage.setItem("article", outlineText);
        toast.success("Outline generated successfully!", {
          position: "top-right",
        });
      } else if (generatedOutline && generatedOutline.error) {
        console.error(
          "Backend returned error on outline generation (via API):",
          generatedOutline.error
        );
        setError(generatedOutline.error);
        toast.error(`Error generating outline: ${generatedOutline.error}`, {
          position: "top-right",
        });
        updateProjectData({ outline: "" });
        setOutlineContent("");
      } else {
        console.error(
          "Unknown successful response structure on outline generation:",
          generatedOutline
        );
        const unknownError =
          "Unknown response format from API for outline generation.";
        setError(unknownError);
        toast.error(`Error: ${unknownError}`, { position: "top-right" });
        updateProjectData({ outline: "" });
        setOutlineContent("");
      }
    } catch (e) {
      console.error("Failed to generate outline (caught error):", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`, { position: "top-right" });
      updateProjectData({ outline: "" });
      setOutlineContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!outlineContent.trim()) {
      toast.error("Please enter an outline to edit.", {
        position: "top-right",
      });
      return;
    }

    setIsLoading(true);
    const payload = {
      users_id: "1122",
      Mainkeyword: "contentful",
      edit_content: {
        outline: outlineContent,
      },
    };

    try {
      console.log(
        "Frontend: Sending edited outline to /api/contentEdit",
        payload
      );
      const res = await fetch("/api/contentEdit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log("Frontend: Received response from /api/contentEdit", result);

      if (result.edited_outline) {
        setEditedOutline(result.edited_outline);
        localStorage.setItem("editedarticle", result.edited_outline);
        toast.success("Outline edited and saved successfully!", {
          position: "top-right",
        });
      } else {
        throw new Error("No edited outline returned from API");
      }
    } catch (error) {
      setApiError(error.message);
      console.error("handleEdit error:", error);
      toast.error(`Error editing outline: ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOutlineAsDoc = async () => {
    setIsSavingOutlineDoc(true);
    setError(null);

    const outlineContentTrimmed = outlineContent.trim();

    if (!outlineContentTrimmed) {
      const validationError =
        "The article outline is empty. Please generate or enter some content first.";
      console.error("Frontend Validation Error:", validationError);
      setError(validationError);
      setIsSavingOutlineDoc(false);
      toast.warning(validationError, { position: "top-right" });
      return;
    }

    const docTitle = "Outline Created";

    let responseText;

    try {
      console.log(
        `Frontend: Attempting to create doc with title '${docTitle}' and outline content.`
      );
      const response = await fetch("/api/docs/create", {
        // Fixed endpoint to match original code
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          initial_content: outlineContentTrimmed,
        }),
      });

      console.log(
        `Frontend Debug (save outline doc): Received response status from Next.js API: ${response.status}`
      );

      try {
        responseText = await response.text();
        console.log(
          "Frontend Debug (save outline doc): Raw API response text:",
          responseText
        );
      } catch (textError) {
        console.error(
          "Frontend Debug (save outline doc): Failed to read response text:",
          textError
        );
        responseText = "";
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log(
          "Frontend Debug (save outline doc): Successfully parsed JSON data from API:",
          result
        );
      } catch (parseError) {
        console.error(
          "Frontend Debug (save outline doc): Failed to parse JSON from API response text.",
          parseError
        );
        const errorMessage = `Failed to parse JSON response from API: ${parseError.message}. Raw response: ${responseText}`;
        setError(errorMessage);
        toast.error(
          `Error: Invalid response format from API for doc creation. See console.`,
          { position: "top-right" }
        );
        return;
      }

      if (!response.ok) {
        console.error(
          "Frontend Debug (save outline doc): Next.js API returned error status but JSON parsed:",
          response.status,
          result
        );
        const errorMessage =
          result && result.error
            ? result.error
            : `HTTP error! status: ${response.status}`;
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`, { position: "top-right" });
        return;
      }

      if (result && result.success && result.file_id) {
        console.log("Outline Doc creation successful:", result);
        toast.success(`Outline saved as Google Doc: "${result.name}"`, {
          position: "top-right",
          autoClose: 7000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (result && result.error) {
        console.error(
          "Backend tool returned error on doc creation (via API):",
          result.error
        );
        setError(result.error);
        toast.error(`Error saving outline as doc: ${result.error}`, {
          position: "top-right",
        });
      } else {
        console.error(
          "Unknown successful response structure from API on doc creation:",
          result
        );
        const unknownError =
          "Unknown success response format from API on doc creation.";
        setError(unknownError);
        toast.error(`Error: ${unknownError}`, { position: "top-right" });
      }
    } catch (e) {
      console.error(
        "Frontend Debug (save outline doc): Failed to fetch or process doc creation:",
        e
      );
      const errorMessage =
        e.message || "An unexpected error occurred during doc creation.";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`, { position: "top-right" });
    } finally {
      setIsSavingOutlineDoc(false);
    }
  };

  const handleNext = () => {
    setActiveStep(STEPS[3].id);
  };

  useEffect(() => {
    console.log(
      "useEffect triggered in Step3. Checking generation conditions."
    );
    if (
      projectData.primaryKeyword &&
      projectData.primaryIntent &&
      !projectData.outline &&
      !isLoading
    ) {
      console.log(
        "Conditions met: primaryKeyword, primaryIntent set, outline empty, not already loading. Triggering handleGenerateOutline."
      );
      handleGenerateOutline();
    } else {
      console.log("Generation conditions not met.");
    }
  }, [
    projectData.primaryKeyword,
    projectData.primaryIntent,
    projectData.outline,
    isLoading,
  ]);

  return (
    <div className="step-component">
      <h3>4. Outline Creation</h3>
      <p>
        Generate an article outline based on competitor data and your keywords,
        then edit as needed.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {(isLoading || isSavingOutlineDoc) && <Loader />}

      <div className="mt-4">
        <h4 htmlFor="articleOutline" className="text-lg font-semibold mb-2">
          Article Outline (Editable):
        </h4>
        <textarea
          id="articleOutline"
          value={outlineContent}
          onChange={(e) => setOutlineContent(e.target.value)}
          placeholder={
            isLoading
              ? "Generating outline..."
              : "Enter or generate your article outline here. Use H1, H2, H3 for structure."
          }
          rows="15"
          className="block w-full p-2 border border-gray-300 rounded-md resize-y"
          disabled={isLoading || isSavingOutlineDoc}
        ></textarea>

        <button
          onClick={handleEdit}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={isLoading || isSavingOutlineDoc}
        >
          Save & Generate
        </button>
      </div>

      <div className="mt-4">
        <h4 htmlFor="editedOutline" className="text-lg font-semibold mb-2">
          Updated Outline:
        </h4>
        <textarea
          id="editedOutline"
          value={editedOutline}
          onChange={(e) => setEditedOutline(e.target.value)}
          placeholder="Edited outline will appear here after processing."
          rows="15"
          className="block w-full p-2 border border-gray-300 rounded-md resize-y"
          disabled={isLoading || isSavingOutlineDoc}
        ></textarea>
      </div>

      <button
        onClick={handleSaveOutlineAsDoc}
        disabled={isSavingOutlineDoc || isLoading || !outlineContent.trim()}
        className={`mt-4 px-4 py-2 rounded text-white transition-colors ${
          isSavingOutlineDoc || isLoading || !outlineContent.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isSavingOutlineDoc ? "Saving Outline..." : "Confirm"}
      </button>

      <button
        onClick={handleNext}
        className={`mt-4 px-4 py-2 rounded text-white transition-colors ${
          isLoading || isSavingOutlineDoc || !outlineContent.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        Next: Article
      </button>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
