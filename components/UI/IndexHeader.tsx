"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/UI/Footer";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BookText,
  BookUser,
  Boxes,
  CircleUserRound,
  FileChartColumnIncreasing,
  LayoutDashboard,
  Microscope,
  ShoppingCart,
  User,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function IndexHeader(){

  const queryClient = new QueryClient();
  const query = usePathname();
  console.log(query);

  const router = useRouter();
  const supabase = createClient(); // Create the Supabase client instance

  const [useremail, setUseremail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
 
    const [Fname, setFname] = useState<string | null>(null);
    const [Lname, setLname] = useState<string | null>(null);
    useEffect(() => {
      const fetchUserEmail = async () => {
        const { data } = await supabase.auth.getUser();
        setFname(data.user?.user_metadata.first_name || null);
        setLname(data.user?.user_metadata.last_name || null);
        console.log("User Data:", data);
  
      };
      
      fetchUserEmail();
    }, []);
    
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during logout:", error.message);
    } else {
      // Clear additional client-side data if needed
      localStorage.removeItem("customUserData"); // Example for custom storage
      // Redirect to the login page or another route
      router.push("/login");
    }
  };
  return (
    <QueryClientProvider client={queryClient}>
        <div
        className="navbar border-b-2 bg-blue-900 border-black text-black"
       
      >
          <div className="flex-1">
            <div className="flex-none lg:hidden ">
              <label
                htmlFor="my-drawer-3"
                aria-label="open sidebar"
                className="btn btn-square btn-ghost"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                  className="inline-block h-20 w-20 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </label>
            </div>
            <Image
              src="/Img/corex1.png"
              className=""
              alt="logo"
              width={214}
              height={85}
              onClick={() => router.push("/dashboard/order_management")}
            />
          </div>
          <div className="flex-none gap-2">
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-auto rounded-full">
                <CircleUserRound className="place-content-center w-full" />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-slate-300 rounded-box z-[1] mt-3 w-52 p-2 shadow"
              >
                <li>
                  <span className="text-black">{Lname+" "+Fname}</span>
                </li>
                <li>
                  <a className="text-black" onClick={handleLogout}>
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
      </div>
    </QueryClientProvider>
  );
}
