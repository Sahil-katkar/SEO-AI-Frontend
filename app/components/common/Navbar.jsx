// frontend/components/common/Navbar.jsx
"use client"; // If it uses Supabase auth status, it might need to be client

import React from "react";
import Link from "next/link";
// import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import Button from "../ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  //   const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //   useEffect(() => {
  //     // const getUser = async () => {
  //     //   const {
  //     //     data: { user },
  //     //   } = await supabase.auth.getUser();
  //     //   setUser(user);
  //     //   setLoading(false);
  //     // };
  //     // getUser();

  //     // Optional: Listen for auth state changes
  //     const {
  //       data: { subscription },
  //     } = supabase.auth.onAuthStateChange((_event, session) => {
  //       setUser(session?.user ?? null);
  //       setLoading(false);
  //     });

  //     return () => subscription.unsubscribe(); // Cleanup subscription
  //   }, [supabase.auth]);

  //   const handleLogout = async () => {
  //     // await supabase.auth.signOut();
  //     router.push("/login"); // Redirect to login after logout
  //     // Optional: router.refresh(); // To refresh server components
  //   };

  return (
    <nav className="p-4 bg-gray-800 text-white flex justify-between items-center">
      {" "}
      {/* Basic styling */}
      <Link href="/">
        <span className="text-xl font-bold cursor-pointer">SEO-AI Chat</span>
      </Link>
      <div>
        {loading ? (
          <span>Loading...</span>
        ) : user ? (
          <div className="flex items-center">
            {/* Optional: Display user email or username */}
            {/* <span className="mr-4 text-sm">{user.email}</span> */}
            <Button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "1px solid white",
                color: "white",
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <>
            <Link href="/login" className="mr-4">
              Login
            </Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
