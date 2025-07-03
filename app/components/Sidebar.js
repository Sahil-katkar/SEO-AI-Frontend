"use client";

import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const {
    STEPS,
    // activeStep,
    // setActiveStep
    projectData,
  } = useAppContext();

  const router = useRouter();
  const pathName = usePathname();

  // console.log(pathName);
  // localStorage.getItem(`spreadsheet_${fileId}`);

  return (
    <aside className="sidebar">
      <h2 className="font-bold">SEO AI</h2>
      <ul>
        {STEPS.map((step, index) => {
          console.log("step.route", step.route);
          console.log("pathName", pathName);
          console.log("pathName.includes", pathName.includes(step.route));
          return (
            <li
              key={step.id}
              className={`
              whitespace-nowrap
              ${
                step.route === pathName ? "active" :
                step.route !== "/" && pathName.includes(step.route)
                  ? "active"
                  : ""
              }
              
              `}
              onClick={() => {
                if (step.route === "/") {
                  router.push(step.route);
                }
                // else {
                //   router.push(projectData.fileId);
                // }
              }}
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
