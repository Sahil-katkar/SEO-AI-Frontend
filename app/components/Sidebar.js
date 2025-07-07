"use client";

import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation"; // useRouter is not used in the final version, can be removed.

export default function Sidebar() {
  const { STEPS, projectData } = useAppContext();
  // const router = useRouter();
  const pathName = usePathname();

  return (
    <aside className="sidebar">
      <h2 className="font-bold">SEO AI</h2>
      <ul>
        {STEPS.map((step) => {
          console.log("step.route", step.route);
          console.log("pathName", pathName);
          console.log("pathName.includes", pathName.includes(step.route));
          let isActive = false;

          if (step.route === "/") {
            // For the root path, an exact match is required
            isActive = pathName === "/";
          } else {
            // For other steps, check if the pathName starts with
            // the step's route segment followed by a slash.
            // This ensures we match the full segment (e.g., "/lsi-keywords/")
            // and avoid false positives from substring matches like "keywords" within "lsi-keywords".
            isActive = pathName.startsWith(`/${step.route}/`);

            // This condition also handles cases where fileId or rowIndex might be empty,
            // as the href typically creates paths like /route// (e.g., /lsi-keywords//)
            // if those values are empty. The startsWith check would still work.
          }

          return (
            <li
              key={step.id}
              className={`
                whitespace-nowrap
                ${isActive ? "active" : ""}
              `}
              // Removed the onClick handler on <li>. The <Link> component
              // handles navigation, and this onClick was largely redundant
              // or only partially implemented for the root path.
              // Letting <Link> handle navigation is the standard and cleaner approach.
            >
              <Link
                href={`${
                  step.route === "/"
                    ? "/"
                    : `/${step.route}/${step.selectedFileId}/${step.selectedRowIndex}`
                }`}
              >
                {step.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
