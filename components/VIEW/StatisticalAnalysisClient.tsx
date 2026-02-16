"use client";

import dynamic from "next/dynamic";
import SideBar from "@/components/UI/SideBar";

const StatisticalAnalysisTable = dynamic(
  () => import("@/components/VIEW/StatisticalAnalysisTable"),
  { ssr: false }
);

export default function StatisticalAnalysisClient() {
  return (
    <SideBar>
      <StatisticalAnalysisTable />
    </SideBar>
  );
}
