'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/seed-lenders', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to seed lenders');
      }
    } catch (err) {
      setError('An error occurred while seeding lenders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Seed Dummy Lenders</h1>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-green-600 font-semibold mb-2">Lenders seeded successfully!</p>
            <div className="text-sm text-gray-600 space-y-1 mt-4">
              <p><strong>HDFC Bank:</strong> demo@hdfc.com / demo123</p>
              <p><strong>ICICI Bank:</strong> demo@icici.com / demo123</p>
              <p><strong>Axis Bank:</strong> demo@axis.com / demo123</p>
            </div>
            <a
              href="/lender/login"
              className="mt-6 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              Go to Lender Login
            </a>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              This will create 3 dummy lenders in the database for testing purposes.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Seeding...</span>
                </>
              ) : (
                <span>Seed Lenders</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

