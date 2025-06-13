"use client";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loader from "@/components/common/Loader";
import { toast, ToastContainer } from "react-toastify"; // Add react-toastify imports
import "react-toastify/dist/ReactToastify.css"; // Add toastify styles

export default function Step3_OutlineCreation() {
  const { projectData, updateProjectData, setActiveStep, STEPS } =
    useAppContext();
  const [isLoading, setIsLoading] = useState(false); // General loading state for outline generation

  // Removed these states as they seem leftover from Step1 and not used in Step3
  // const [loadingFirst, setLoadingFirst] = useState(false);
  // const [loadingSave, setLoadingSave] = useState(false);
  // const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);
  // const [fileContent, setFileContent] = useState(null);
  // const [processingStatus, setProcessingStatus] = useState({});
  // const [docIdToUpdate, setDocIdToUpdate] = useState("");
  // const [findText, setFindText] = useState("");
  // const [replaceText, setReplaceText] = useState("");

  const [isSavingOutlineDoc, setIsSavingOutlineDoc] = useState(false); // <-- New state for saving outline doc
  const [error, setError] = useState(null); // Use a single error state

  // Removed newDocTitle, setNewDocTitle, newDocInitialContent, setNewDocInitialContent
  // as outline content comes from projectData.outline

  // The handleGenerateOutline function remains the same
  const handleGenerateOutline = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors

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
        // Call Next.js API route
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
      }
    } catch (e) {
      console.error("Failed to generate outline (caught error):", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`, { position: "top-right" });
      updateProjectData({ outline: "" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- MODIFIED HANDLER FOR CREATING DOC (to save outline) ---
  // Renamed from handleCreateDoc to be more specific
  const handleSaveOutlineAsDoc = async () => {
    setIsSavingOutlineDoc(true); // Start loading for this specific action
    setError(null); // Clear previous errors

    const outlineContent = projectData.outline.trim(); // Get content from the textarea state

    // Basic validation: Outline should not be empty
    if (!outlineContent) {
      const validationError =
        "The article outline is empty. Please generate or enter some content first.";
      console.error("Frontend Validation Error:", validationError);
      setError(validationError);
      setIsSavingOutlineDoc(false);
      toast.warning(validationError, { position: "top-right" });
      return; // Stop the function execution
    }

    // Define the title for the new doc
    const docTitle = "Outline Created"; // Fixed title as requested

    let responseText;

    try {
      console.log(
        `Frontend: Attempting to create doc with title '${docTitle}' and outline content.`
      );
      // *** Call the NEW Next.js API route for Docs creation ***
      const response = await fetch("/api/docs/create", {
        // This matches app/api/docs/create/route.js
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle, // Use the fixed title
          initial_content: outlineContent, // Pass the content from projectData.outline
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

      // Check the response status code from the Next.js API route (Expecting 201 Created on success)
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

      // Success case (response.ok is true, specifically looking for 201 from our API route)
      // Expecting {"success": true, "file_id": "...", "name": "...", "webViewLink": "...", ...} from the API route
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
        // Optional: Maybe update the file list after creation? Depends if user needs to see it here.
        // You'd need the handleListFiles function here, which is currently in Step1.
        // For now, let's skip listing files from Step3.
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
      setIsSavingOutlineDoc(false); // Stop loading
    }
  };
  // --- END MODIFIED HANDLER ---

  const handleNext = () => {
    // Add validation if needed (e.g., ensure outline is not empty)
    // if (!projectData.outline || !projectData.outline.trim()) {
    //   setError(
    //     "Outline is empty. Please generate or enter an outline before proceeding."
    //   );
    //   toast.warning("Outline is empty. Please generate or enter an outline.", {
    //     position: "top-right",
    //   });
    //   return;
    // }
    // setError(null); // Clear error before moving to the next step
    setActiveStep(STEPS[3].id); // Move to the next step (Step 4 based on STEPS[3].id)
  };

  // The useEffect hook to trigger initial generation
  useEffect(() => {
    console.log(
      "useEffect triggered in Step3. Checking generation conditions."
    );
    // Trigger generation only if keywords/intent are set AND outline is currently empty
    // Also ensure we are not already loading
    if (
      projectData.primaryKeyword &&
      projectData.primaryIntent &&
      !projectData.outline && // Check if outline is falsy (null, undefined, empty string)
      !isLoading // Prevent triggering if generation is already in progress
    ) {
      console.log(
        "Conditions met: primaryKeyword, primaryIntent set, outline empty, not already loading. Triggering handleGenerateOutline."
      );
      handleGenerateOutline(); // Automatically trigger outline generation
    } else {
      console.log("Generation conditions not met.");
    }
  }, [
    projectData.primaryKeyword,
    projectData.primaryIntent,
    projectData.outline,
  ]); // Depend on keywords, intent, and outline status

  return (
    <div className="step-component">
      <h3>4. Outline Creation</h3>
      <p>
        Generate an article outline based on competitor data and your keywords,
        then edit as needed.
      </p>

      {/* Generate Outline Button */}
      {/* Use isLoading state to disable */}
      {/* <button
        onClick={handleGenerateOutline}
        disabled={isLoading || isSavingOutlineDoc} // Disable if generating or saving
        className={`px-4 py-2 rounded text-white transition-colors ${
          isLoading || isSavingOutlineDoc
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isLoading
          ? "Generating Outline..."
          : "Generate Outline from Competitors"}
      </button> */}

      {/* Display error if any */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded break-words text-sm">
          <h4 className="font-semibold">Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Loader displayed if isLoading or isSavingOutlineDoc is true */}
      {(isLoading || isSavingOutlineDoc) && <Loader />}

      {/* Textarea for the outline */}
      <div className="mt-4">
        <h4 htmlFor="articleOutline" className="text-lg font-semibold mb-2">
          Article Outline (Editable):
        </h4>
        <textarea
          id="articleOutline"
          value={localStorage.getItem("outline")} // Always bind value to projectData.outline
          onChange={(e) => updateProjectData({ outline: e.target.value })}
          placeholder={
            isLoading
              ? "Generating outline..."
              : "Enter or generate your article outline here. Use H1, H2, H3 for structure."
          } // Placeholder reflects loading state
          rows="15"
          className="block w-full p-2 border border-gray-300 rounded-md resize-y"
          disabled={isLoading || isSavingOutlineDoc} // Disable textarea while busy
        ></textarea>
      </div>

      {/* --- NEW BUTTON TO SAVE OUTLINE AS DOC --- */}
      <button
        onClick={handleSaveOutlineAsDoc} // Call the modified handler
        disabled={
          isSavingOutlineDoc ||
          isLoading ||
          !projectData.outline ||
          !projectData.outline.trim()
        } // Disable if saving, generating, or outline is empty
        className={`mt-4 px-4 py-2 rounded text-white transition-colors ${
          isSavingOutlineDoc ||
          isLoading ||
          !projectData.outline ||
          !projectData.outline.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700" // Green color for saving
        }`}
      >
        {isSavingOutlineDoc ? "Saving Outline..." : "Confirm"}
      </button>
      {/* --- END NEW BUTTON --- */}

      {/* Next Button */}
      <button
        onClick={handleNext}
        // disabled={
        //   isLoading ||
        //   isSavingOutlineDoc ||
        //   !projectData.outline ||
        //   !projectData.outline.trim()
        // }
        className={`mt-4 px-4 py-2 rounded text-white transition-colors ${
          isLoading ||
          isSavingOutlineDoc ||
          !projectData.outline ||
          !projectData.outline.trim()
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700" // Different color for Next
        }`}
      >
        Next: Article {/* Step 4 is Persona based on STEPS[3].id */}
      </button>

      {/* Add ToastContainer to render toasts */}
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
