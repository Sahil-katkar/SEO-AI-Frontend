"use client";

import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { STEPS } = useAppContext(); // STEPS array contains the derived selectedFileId/selectedRowIndex
  const pathName = usePathname();

  return (
    <aside className="sidebar">
      <h2 className="font-bold">SEO AI</h2>
      <ul>
        {STEPS.map((step) => {
          let isActive = false;
          if (step.route === "/") {
            isActive = pathName === "/";
          } else {
            const pathSegments = pathName.split("/").filter(Boolean);
            const currentRouteSegment = pathSegments[0];
            isActive = currentRouteSegment === step.route;
          }

          // 2. Construct the href for the link based on specific patterns
          let linkHref;
          if (step.route === "/") {
            // Connect Google Drive (root)
            linkHref = "/";
          } else if (step.route === "keywords") {
            // SPECIAL CASE: For 'keywords' step, only include selectedFileId
            linkHref = `/${step.route}/${step.selectedFileId}`;
          } else {
            // DEFAULT CASE: For all other dynamic steps (LSI Keywords, Mission Plan, Analysis, Content),
            // include both selectedFileId and selectedRowIndex
            linkHref = `/${step.route}/${step.selectedFileId}/${step.selectedRowIndex}`;
          }

          return (
            <li
              key={step.id}
              className={`
                whitespace-nowrap
                ${isActive ? "active" : ""}
              `}
            >
              <Link href={linkHref}>{step.name}</Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
