"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (<QueryClientProvider client={queryClient}>
    
      <main className="bg-base-200">
        <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 5010,
        style: {
          background: "#fff",
          color: "#363636",
        },
      }}
    />{children}</main>
    </QueryClientProvider>
  );
}
