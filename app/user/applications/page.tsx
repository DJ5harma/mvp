'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Calendar,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  Bell
} from 'lucide-react';

interface UserApplication {
  _id: string;
  userId: string;
  lenderId: string;
  lenderName: string;
  status: 'pending' | 'approved' | 'rejected';
  userScore: number;
  creditScore: number;
  creditGrade: string;
  loanType: string;
  report?: {
    loanEligibility: {
      eligible: boolean;
      maxLoanAmount: number;
      recommendedTenure: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    financialStability: {
      monthlyIncome: number;
      monthlyExpenses: number;
      savings: number;
      emiObligations: number;
      disposableIncome: number;
    };
    userScore: number;
  };
  lenderMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function UserApplications() {
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (!sessionId) {
      router.push('/user/login');
      return;
    }
    fetchApplications();
  }, [sessionId, router]);

  const fetchApplications = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/user/applications?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch applications:', errorData.error);
        // If session not found or user not identified, show empty state
        if (response.status === 404) {
          setApplications([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">My Applications</h1>
            </div>
            <Link
              href={`/chat?sessionId=${sessionId}`}
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Chat</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{applications.length}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {applications.filter(a => a.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {applications.filter(a => a.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {applications.filter(a => a.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Your Loan Applications</h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No applications yet.</p>
              <p className="text-gray-500 text-sm mt-2">Start a new loan application to see it here.</p>
              <Link
                href={`/chat?sessionId=${sessionId}`}
                className="mt-6 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Start New Application
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => (
                <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors animate-fade-in">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                          <span>{app.lenderName}</span>
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>{app.loanType} Loan</span>
                          </span>
                          <span>•</span>
                          <span>Credit Score: <span className="font-semibold">{app.creditScore} ({app.creditGrade})</span></span>
                          <span>•</span>
                          <span>Score: <span className="font-semibold">{app.userScore}/100</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-4 py-2 rounded-full border-2 flex items-center space-x-2 ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="font-semibold">{app.status.toUpperCase()}</span>
                      </div>
                      <Link
                        href={`/user/chat/${app.lenderId}?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`}
                        className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat</span>
                      </Link>
                    </div>
                  </div>

                  {app.report && (
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-600">Max Loan Amount</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">
                          ₹{app.report.loanEligibility.maxLoanAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Recommended Tenure</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {app.report.loanEligibility.recommendedTenure} months
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-600">Risk Level</span>
                        </div>
                        <div className={`text-2xl font-bold ${getRiskColor(app.report.loanEligibility.riskLevel)}`}>
                          {app.report.loanEligibility.riskLevel.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}

                  {app.lenderMessage && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1">
                          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Message from {app.lenderName}</h4>
                            <p className="text-blue-800 text-sm">{app.lenderMessage}</p>
                          </div>
                        </div>
                        <Link
                          href={`/user/chat/${app.lenderId}?sessionId=${sessionId}${userId ? `&userId=${userId}` : ''}`}
                          className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
                        >
                          Reply →
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                    <span>Applied on: {new Date(app.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    {app.updatedAt && app.updatedAt !== app.createdAt && (
                      <span>Last updated: {new Date(app.updatedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

