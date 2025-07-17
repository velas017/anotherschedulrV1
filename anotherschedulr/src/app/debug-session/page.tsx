"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";

const DebugSessionPage = () => {
  const { data: session, status } = useSession();
  const [serverEnv, setServerEnv] = useState<any>(null);
  const [envLoading, setEnvLoading] = useState(true);
  const [serverSession, setServerSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dbData, setDbData] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    // Fetch server-side environment variables
    fetch('/api/debug/env')
      .then(res => res.json())
      .then(data => {
        setServerEnv(data);
        setEnvLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch environment data:', error);
        setEnvLoading(false);
      });

    // Fetch server-side session
    fetch('/api/auth/test')
      .then(res => res.json())
      .then(data => {
        setServerSession(data);
        setSessionLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch server session:', error);
        setSessionLoading(false);
      });

    // Fetch database verification data
    fetch('/api/debug/db')
      .then(res => res.json())
      .then(data => {
        setDbData(data);
        setDbLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch database data:', error);
        setDbLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Debug Information</h1>
          
          {/* Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Status</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${
                status === 'authenticated' ? 'bg-green-100 text-green-800' :
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>{status}</span></p>
              <p><strong>Has Session:</strong> {session ? "✅ Yes" : "❌ No"}</p>
            </div>
          </div>

          {/* Client-side Session Data */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Client-side Session Data</h2>
            <div className="bg-gray-100 p-4 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>

          {/* Server-side Session Data */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Server-side Session Check</h2>
            <div className="bg-gray-100 p-4 rounded">
              {sessionLoading ? (
                <p>Loading server session data...</p>
              ) : serverSession ? (
                <div>
                  <p className="mb-2">
                    <strong>Status:</strong>{" "}
                    <span className={serverSession.authenticated ? "text-green-600" : "text-red-600"}>
                      {serverSession.message}
                    </span>
                  </p>
                  <pre className="text-sm overflow-auto mt-2">
                    {JSON.stringify(serverSession, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-red-600">Failed to load server session data</p>
              )}
            </div>
          </div>

          {/* User Data */}
          {session?.user && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">User Information</h2>
              <div className="bg-gray-100 p-4 rounded">
                <p><strong>Name:</strong> {session.user.name || "Not provided"}</p>
                <p><strong>Email:</strong> {session.user.email || "Not provided"}</p>
                <p><strong>Image:</strong> {session.user.image || "Not provided"}</p>
                {session.user.image && (
                  <img 
                    src={session.user.image} 
                    alt="User avatar" 
                    className="w-16 h-16 rounded-full mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Server-side Environment Variables */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Server-side Environment Check</h2>
            <div className="bg-gray-100 p-4 rounded">
              {envLoading ? (
                <p>Loading server environment data...</p>
              ) : serverEnv ? (
                <div>
                  <p className="mb-2"><strong>Status:</strong> <span className={serverEnv.status.includes('✅') ? 'text-green-600' : 'text-red-600'}>{serverEnv.status}</span></p>
                  <div className="space-y-1">
                    {Object.entries(serverEnv.variables || {}).map(([key, data]: [string, any]) => (
                      <p key={key}><strong>{key}:</strong> {data.value}</p>
                    ))}
                  </div>
                  {serverEnv.recommendations && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {serverEnv.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-600">Failed to load server environment data</p>
              )}
            </div>
          </div>

          {/* Database Verification */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Database Verification</h2>
            <div className="bg-gray-100 p-4 rounded">
              {dbLoading ? (
                <p>Loading database data...</p>
              ) : dbData ? (
                <div>
                  <p className="mb-2">
                    <strong>Status:</strong>{" "}
                    <span className={dbData.status.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                      {dbData.status}
                    </span>
                  </p>
                  
                  {/* Database Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 p-3 bg-white rounded border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{dbData.stats?.totalUsers || 0}</div>
                      <div className="text-sm text-gray-600">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{dbData.stats?.totalSessions || 0}</div>
                      <div className="text-sm text-gray-600">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{dbData.stats?.activeSessions || 0}</div>
                      <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{dbData.stats?.expiredSessions || 0}</div>
                      <div className="text-sm text-gray-600">Expired</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{dbData.stats?.totalAccounts || 0}</div>
                      <div className="text-sm text-gray-600">OAuth</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {dbData.recommendations && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <strong>Database Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {dbData.recommendations.map((rec: string, index: number) => (
                          <li key={index} className={`text-sm ${rec.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recent Users */}
                  {dbData.data?.users && dbData.data.users.length > 0 && (
                    <div className="mb-4">
                      <strong>Recent Users:</strong>
                      <div className="mt-2 space-y-2">
                        {dbData.data.users.slice(0, 3).map((user: any) => (
                          <div key={user.id} className="p-2 bg-white rounded border text-sm">
                            <span className="font-medium">{user.email}</span> - {user.name || 'No name'} 
                            <span className="text-gray-500 ml-2">({user._count.sessions} sessions, {user._count.accounts} accounts)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {dbData.data?.sessions && dbData.data.sessions.length > 0 && (
                    <div className="mb-4">
                      <strong>Recent Sessions:</strong>
                      <div className="mt-2 space-y-2">
                        {dbData.data.sessions.slice(0, 3).map((session: any) => (
                          <div key={session.id} className="p-2 bg-white rounded border text-sm">
                            <span className="font-mono">{session.sessionToken}</span>
                            <div className="text-gray-500">
                              User: {session.user?.email} | Expires: {new Date(session.expires).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-red-600">Failed to load database data</p>
              )}
            </div>
          </div>

          {/* Client-side Environment Variables */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Client-side Environment Check</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || "Not accessible (normal)"}</p>
              <p className="text-sm text-gray-600 mt-1">Note: Sensitive variables are not exposed to the client for security</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/signin" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Go to Sign Up
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Go to Dashboard
              </Link>
              {session && (
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              )}
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Debug Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Check the browser console for detailed logs (🔍 prefix)</li>
              <li>If status is "loading" - wait for it to resolve</li>
              <li>If status is "unauthenticated" - try signing in again</li>
              <li>If session exists but dashboard shows "Access Denied" - check middleware logs</li>
              <li>Look for any error messages in the console</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSessionPage;