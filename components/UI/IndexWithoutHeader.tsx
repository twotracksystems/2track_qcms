"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/UI/Footer";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
export default function IndexWithoutHeader({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="drawer bg-red-700">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </div>
        <div className="drawer-side"></div>
      </div>
    </QueryClientProvider>
  );
}
