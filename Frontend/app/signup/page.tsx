"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { AlertTriangle } from "lucide-react";
import { setUser } from "@/lib/slices/authSlice";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch(); // Add this
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // console.log("Registering user...");
      // console.log("Full Name:", fullName);
      // console.log("Email:", email);
      const response = await fetch(`${API_URL}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname: fullName, email, password }),
        credentials: "include",
      });

      // console.log(response);

      const flag =await checkOtp();
      // console.log("Otp Verified status: ", flag);
      if (!flag) {
        setOtpError("Please verify your OTP");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.data.user)); // ✅ Correct Redux dispatch
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);

        router.push("/dashboard");
      } else {
        const data = await response.json();
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/user/get-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      if (response.ok) {
        setOtpError("");
        alert("OTP sent to your email");
        // Handle OTP retrieval success
      } else {
        const data = await response.json();
        setError(data.message || "Failed to get OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check OTP
  const checkOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });
      // console.log("Verify otp response", response);
      // console.log(response.ok);
      if (response.ok === true) {
        // console.log("OTP verified successfully");
        setOtpVerified(true);
        setOtpError("");
        return true;
      } else {
        setError("Failed to verify OTP");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-20">
      <div className="flex justify-center mb-6">
        <AlertTriangle className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-center mb-6">
        Sign up for ABSENS
      </h1>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {otpError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{otpError}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="button" onClick={getOTP} className="bg-primary">
              Get OTP
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              id="otp"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-primary"
          disabled={isLoading}
        >
          {isLoading ? <Loader size="sm" /> : "Sign Up"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
