import Loader from "@/components/common/Loader";
import React from "react";

export default function loading() {
  return (
    <div className="flex justify-center items-center flex-1 h-[100vh]">
      <Loader />
    </div>
  );
}
