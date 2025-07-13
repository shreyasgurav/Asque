import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { authenticatedFetch } from '@/lib/auth';

interface UserInfo {
  uid: string;
  phoneNumber?: string;
  email?: string;
}

export default function DebugUserPage() {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authenticatedFetch('/api/debug/user-info');
      const result = await response.json();
      
      if (result.success && result.data) {
        setUserInfo(result.data);
      } else {
        setError(result.error || 'Failed to fetch user info');
      }
    } catch (err: any) {
      console.error('Error fetching user info:', err);
      setError('Failed to fetch user info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Debug User Info</h1>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p>You are not logged in.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug User Info</h1>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client-Side User Info</h2>
          <div className="space-y-2">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Phone:</strong> {user.phoneNumber || 'Not set'}</p>
            <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Server-Side User Info</h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          ) : userInfo ? (
            <div className="space-y-2">
              <p><strong>UID:</strong> {userInfo.uid}</p>
              <p><strong>Phone:</strong> {userInfo.phoneNumber || 'Not set'}</p>
              <p><strong>Email:</strong> {userInfo.email || 'Not set'}</p>
            </div>
          ) : (
            <p>No data available</p>
          )}
          
          <button
            onClick={fetchUserInfo}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>If phone numbers don't match, you won't be able to access bots</li>
            <li>Try logging out and logging back in</li>
            <li>Check the browser console for more detailed error messages</li>
            <li>Check the server logs for ownership verification details</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 