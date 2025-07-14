"use client"; // This page uses client-side hooks/interactions (e.g., button onClick)

import { Router } from "next/router";
import React from "react";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  const handleConnectGoogleDrive = () => {
    router.push(`/`);
  };

  return (
    // Outer container: Takes full viewport width and height, sets background
    // Removed p-4 to allow the inner card to extend closer to the edges
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 w-full">
      {/* The "card" element itself, now stretching to full width */}
      {/* Removed max-w-lg, added w-full */}
      {/* We're also removing rounded-lg if you truly want edge-to-edge.
          If you want rounded corners but full width, it might look strange,
          but you can keep rounded-lg. I'll remove it for true full-width. */}
      <div className="bg-white dark:bg-gray-800 shadow-xl text-center w-full py-8">
        {" "}
        {/* py-8 for vertical padding */}
        {/* Inner container for content: This will apply horizontal padding
            to prevent text from touching screen edges, making it readable. */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {" "}
          {/* Responsive horizontal padding and max-width for content */}
          {/* Icon */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Google Drive to Get Started
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6"></p>
          {/* Call to Action Button */}
          <button
            onClick={handleConnectGoogleDrive}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <svg
              className="-ml-1 mr-3 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3z" />
            </svg>
            Connect Google Drive
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
