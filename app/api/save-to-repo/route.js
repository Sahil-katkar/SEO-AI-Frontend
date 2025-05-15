import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

function csvToJson(csv) {
  // Parse CSV using PapaParse
  const result = Papa.parse(csv, {
    header: true, // Use first row as headers
    skipEmptyLines: true,
    transform: (value, header) => {
      if (header.toUpperCase() === "COMPETITORS") {
        // Replace line breaks with commas for COMPETITORS, specific to this row
        return value
          .replace(/(\r\n|\n|\r)/g, ",")
          .replace(/,+/g, ",")
          .replace(/^,|,$/g, "")
          .trim();
      }
      return value.trim();
    },
  });

  if (result.errors.length > 0) {
    throw new Error("CSV parsing error: " + result.errors[0].message);
  }

  // Return the parsed data without modifying COMPETITORS further
  return result.data;
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

    // Convert CSV to JSON
    const jsonData = csvToJson(content);

    // Save to a directory in your project
    const saveDir = path.join(process.cwd(), "saved-files");
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    const jsonFileName = fileName.replace(/\.[^/.]+$/, "") + ".json";
    const filePath = path.join(saveDir, jsonFileName);

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");

    return NextResponse.json({
      message: "File saved as JSON successfully",
      filePath,
    });
  } catch (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
