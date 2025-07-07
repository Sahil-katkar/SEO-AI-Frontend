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

          let linkHref;
          if (step.route === "/") {
            linkHref = "/";
          } else if (step.route === "keywords") {
            linkHref = `/${step.route}/${step.selectedFileId}`;
          } else {
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
