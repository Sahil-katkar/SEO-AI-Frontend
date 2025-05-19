// pages/api/save-file.js or app/api/save-file/route.js

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

// Helper function (assuming it works correctly as before)
function csvToJson(csv) {
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(), // Trim headers too, just in case
    transform: (value, header) => {
      // Note: The header might come trimmed now if transformHeader is used
      const trimmedHeader = header ? header.trim() : null;
      if (trimmedHeader && trimmedHeader.toUpperCase() === "COMPETITORS") {
        return value
          .replace(/(\r\n|\n|\r)/g, ",")
          .replace(/,+/g, ",")
          .replace(/^,|,$/g, "")
          .trim();
      }
      return value ? value.trim() : value; // Ensure values are trimmed, handle null/undefined
    },
  });

  if (result.errors.length > 0) {
    console.error("CSV parsing errors:", result.errors);
    // Provide more context if possible from errors
    const firstError = result.errors[0];
    const errorDetail = `Type: ${firstError.type}, Code: ${firstError.code}, Message: ${firstError.message}, Row: ${firstError.row}`;
    throw new Error("CSV parsing error: " + errorDetail);
  }

  return result.data; // This is an array of objects
}

export async function POST(request) {
  try {
    const { fileName, content } = await request.json();

    if (!fileName || !content) {
      return NextResponse.json(
        { detail: "Missing fileName or content" },
        { status: 400 }
      );
    }

    // 1. Convert CSV to JSON
    const jsonData = csvToJson(content); // jsonData is an array of objects

    // --- NEW: Sort the JSON data by WEIGHTAGE in descending order ---
    if (Array.isArray(jsonData)) {
      // Ensure it's an array before sorting
      jsonData.sort((a, b) => {
        // Get the WEIGHTAGE values, defaulting to 0 if missing or not a valid number
        // Use parseFloat to handle potential string numbers or empty strings
        const weightA = parseFloat(a?.WEIGHTAGE || "0") || 0;
        const weightB = parseFloat(b?.WEIGHTAGE || "0") || 0;

        // For descending order, subtract A's weight from B's weight
        return weightB - weightA;
      });
      console.log("JSON data sorted by WEIGHTAGE (Descending).");
    } else {
      console.warn("csvToJson did not return an array, skipping sort.");
    }
    // --- END NEW Sorting Logic ---

    const jsonString = JSON.stringify(jsonData, null, 2); // Stringify the sorted data

    // 2. Save to a directory in your NEXT.JS project (Existing Logic - Optional)
    let localSaveSuccess = false;
    let localFilePath = null;
    const localSaveDir = path.join(process.cwd(), "saved-files");
    try {
      if (!fs.existsSync(localSaveDir)) {
        fs.mkdirSync(localSaveDir, { recursive: true });
      }
      const jsonFileName = fileName.replace(/\.[^/.]+$/, "") + ".json";
      localFilePath = path.join(localSaveDir, jsonFileName);

      fs.writeFileSync(localFilePath, jsonString, "utf8"); // Save the sorted string
      console.log(`File saved locally in Next.js project: ${localFilePath}`);
      localSaveSuccess = true;
    } catch (localSaveError) {
      console.error(
        "Error saving file locally in Next.js project:",
        localSaveError
      );
      // Log the error, but don't necessarily fail the entire request yet
    }

    // 3. Send the JSON data to your BACKEND project (Existing Logic)
    const backendSaveUrl = process.env.BACKEND_SAVE_API_URL; // Get backend URL from environment variable

    let backendSaveAttempted = false;
    let backendSaveSuccess = false;
    let backendMessage = null;
    let backendFilePath = null;

    if (backendSaveUrl) {
      backendSaveAttempted = true;
      try {
        console.log(
          `Attempting to send JSON data to backend at: ${backendSaveUrl}`
        );
        const backendResponse = await fetch(backendSaveUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add any required authentication headers for your backend here
          },
          // Send the sorted jsonData object to the backend
          body: JSON.stringify({
            fileName: fileName.replace(/\.[^/.]+$/, "") + ".json", // Send the desired final JSON filename
            jsonData: jsonData, // Send the sorted data object
          }),
        });

        if (!backendResponse.ok) {
          const errorBody = await backendResponse
            .json()
            .catch(() => ({ detail: backendResponse.statusText }));
          console.error(
            `Backend saving failed: ${backendResponse.status} - ${backendResponse.statusText}`,
            errorBody
          );
          backendMessage = `Backend save failed: ${backendResponse.status} - ${
            errorBody.detail || JSON.stringify(errorBody)
          }`;
        } else {
          const successBody = await backendResponse.json();
          console.log(
            "JSON data successfully sent to backend for saving:",
            successBody
          );
          backendSaveSuccess = true;
          backendMessage =
            successBody.message || "JSON data saved successfully on backend.";
          backendFilePath = successBody.filepath;
        }
      } catch (backendFetchError) {
        console.error("Error sending data to backend API:", backendFetchError);
        backendMessage = `Network error contacting backend: ${backendFetchError.message}`;
      }
    } else {
      console.warn(
        "BACKEND_SAVE_API_URL environment variable is not set. Skipping backend save."
      );
      backendMessage = "Backend save skipped (URL not configured).";
    }

    // 4. Return a combined success response
    const overallStatus =
      localSaveSuccess || backendSaveSuccess
        ? 200
        : backendSaveAttempted
        ? 500
        : 500;
    // Adjusted overall status: 200 if ANY save succeeded, 500 if both failed attempts or backend attempted and failed.

    return NextResponse.json(
      {
        message: "File processing complete.",
        localSave: {
          attempted: true,
          success: localSaveSuccess,
          filePath: localFilePath,
          message: localSaveSuccess
            ? "Saved locally in Next.js project."
            : "Failed to save locally." +
              (localSaveSuccess
                ? ""
                : ` Error: ${localSaveError.message || "Unknown"}`), // Add error detail if failed
        },
        backendSave: {
          attempted: backendSaveAttempted,
          success: backendSaveSuccess,
          filePath: backendFilePath,
          message: backendMessage,
        },
      },
      { status: overallStatus }
    );
  } catch (error) {
    console.error(
      "An error occurred during file processing (before saves):",
      error
    );
    // If any error occurred *before* attempting saves (like CSV parse error)
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
