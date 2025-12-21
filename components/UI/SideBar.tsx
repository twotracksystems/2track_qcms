"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BookText,
  FolderKanban,
  CircleUserRound,
  User,
  Users,
  LogOut,
  LogIn,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient();
  const query = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [Fname, setFname] = useState<string | null>(null);
  const [Lname, setLname] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      setFname(data.user?.user_metadata.first_name || null);
      setLname(data.user?.user_metadata.last_name || null);
      setUserRole(data.user?.user_metadata.role || null);
      setUseremail(data.user?.email || null);
    };

    fetchUserEmail();
  }, [supabase]);

  const fullName =
    Fname || Lname ? [Fname, Lname].filter((value) => !!value).join(" ") : useremail || "";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during logout:", error.message);
    } else {
      localStorage.removeItem("customUserData");
      router.push("/login");
    }
  };

  const sidebarWidth = isCollapsed ? "w-24" : "w-72";

  const linkBase =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300";

  // Get breadcrumb label based on pathname
  const getBreadcrumbLabel = () => {
    const pathMap: { [key: string]: string } = {
      "/dashboard": "Dashboard",
      "/dashboard/user_management": "User Management",
      "/dashboard/customer_management": "Customer Management",
      "/dashboard/article_management": "Article Creation",
      "/dashboard/order_management": "Order Fabrication Management",
      "/dashboard/production_management": "Production Management",
      "/dashboard/measurement_management": "Measurement Management",
      "/dashboard/laboratory_management": "Laboratory Management",
    };
    return pathMap[query] || "Dashboard";
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-[#f5f7fb] text-slate-900">
        <aside
          className={`relative flex flex-col ${sidebarWidth} bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl transition-all duration-300 ease-in-out border-r border-blue-700/30`}
        >
          <div className="flex items-center justify-between px-5 pt-8 pb-6 border-b border-white/10">
            <div className={`${isCollapsed ? "hidden" : "flex"} items-center gap-3`}>
              <Image
                src="/Img/corex1.png"
                alt="Corex Logo"
                width={146}
                height={50}
                priority
                className="h-auto w-32 cursor-pointer transition-transform hover:scale-105"
                onClick={() => router.push("/dashboard/order_management")}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-full bg-white/10 p-2 text-white transition-all duration-300 hover:bg-white/20 hover:shadow-md border border-white/10"
            >
              <ChevronLeft
                className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? "-rotate-180" : ""}`}
              />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-2">
              {userRole == "Super Admin" ? (
                <>
                  <li>
                    <Link
                      href="/dashboard/user_management"
                      className={`${linkBase} ${
                        query == "/dashboard/user_management"
                          ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border border-white/20"
                          : "text-blue-100 hover:bg-white/10 hover:shadow-sm border border-transparent"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={isCollapsed ? "User Management" : undefined}
                    >
                      <Users className="h-5 w-5" />
                      {!isCollapsed && <span>User Management</span>}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/customer_management"
                      className={`${linkBase} ${
                        query == "/dashboard/customer_management"
                          ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border border-white/20"
                          : "text-blue-100 hover:bg-white/10 hover:shadow-sm border border-transparent"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={isCollapsed ? "Customer Management" : undefined}
                    >
                      <User className="h-5 w-5" />
                      {!isCollapsed && <span>Customer Management</span>}
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/dashboard/customer_management"
                    className={`${linkBase} ${
                      query == "/dashboard/customer_management"
                        ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border border-white/20"
                        : "text-blue-100 hover:bg-white/10 hover:shadow-sm border border-transparent"
                    } ${isCollapsed ? "justify-center px-0" : ""} transition-all duration-300`}
                    title={isCollapsed ? "Customer Management" : undefined}
                  >
                    <User className="h-5 w-5" />
                    {!isCollapsed && <span>Customer Management</span>}
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/dashboard/article_management"
                  className={`${linkBase} ${
                    query == "/dashboard/article_management"
                      ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border border-white/20"
                      : "text-blue-100 hover:bg-white/10 hover:shadow-sm border border-transparent"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                  title={isCollapsed ? "Article Creation" : undefined}
                >
                  <BookText className="h-5 w-5" />
                  {!isCollapsed && <span>Article Creation</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard/order_management"
                  className={`${linkBase} ${
                    query == "/dashboard/order_management"
                      ? "bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-md border border-white/20"
                      : "text-blue-100 hover:bg-white/10 hover:shadow-sm border border-transparent"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                  title={isCollapsed ? "Order Fabrication Management" : undefined}
                >
                  <FolderKanban className="h-5 w-5" />
                  {!isCollapsed && <span>Order Fabrication Management</span>}
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-full border border-blue-900 bg-white p-2 text-blue-900 shadow-md transition-all duration-300 hover:bg-blue-50 hover:shadow-lg lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold ml-4">
              <ChevronLeft className="h-4 w-4 rotate-180" />
              <span>{getBreadcrumbLabel()}</span>
            </div>

            <div className="flex flex-1 justify-end">
              <div className="flex items-center gap-4">
              {fullName ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-blue-900 shadow-sm transition-all duration-300 hover:shadow-md">
                    <CircleUserRound className="h-5 w-5" />
                    <span className="text-sm font-semibold">{fullName || "User"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:from-blue-800 hover:to-blue-900"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:from-blue-800 hover:to-blue-900"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </button>
              )}
            </div>
            </div>
          </header>

          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              className: "",
              duration: 5000,
              style: {
                background: "#fff",
                color: "#363636",
              },
            }}
          />

          <main className="flex-1 overflow-y-auto bg-[#f5f7fb] px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
