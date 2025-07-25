"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token is invalid or has expired.",
  Default: "Something went wrong during authentication.",
  OAuthSignin: "Error during OAuth sign in process.",
  OAuthCallback: "Error in OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth account.",
  EmailCreateAccount: "Could not create email account.",
  Callback: "Error in callback handler.",
  OAuthAccountNotLinked: "Your email is already associated with another account. Please sign in with your original method.",
  EmailSignin: "Check your email address.",
  CredentialsSignin: "Invalid email or password.",
  SessionRequired: "You must be signed in to access this page.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      setError(errorParam);
      console.log("🔍 Auth error:", errorParam);
    }
  }, [searchParams]);

  const getErrorMessage = (error: string) => {
    return errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;
  };

  const getErrorAdvice = (error: string) => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return "Try signing in with the method you originally used to create your account.";
      case "AccessDenied":
        return "This might happen if you cancelled the sign-in process or your account doesn't have access.";
      case "Configuration":
        return "Please contact support if this error persists.";
      case "CredentialsSignin":
        return "Please check your email and password and try again.";
      default:
        return "Please try signing in again. If the problem persists, contact support.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600">There was a problem signing you in</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error Display */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {getErrorMessage(error)}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{getErrorAdvice(error)}</p>
                </div>
                {error && (
                  <div className="mt-3 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    Error code: {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </Link>
          </div>

          {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Error:</strong> {error || "No error parameter"}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>Time:</strong> {new Date().toISOString()}</p>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Check the browser console and server logs for more details.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}