'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoanReport } from '@/types';
import { LogOut, TrendingUp, Users, FileText, MessageSquare, CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Application {
  _id: string;
  userId: string;
  lenderId: string;
  status: 'pending' | 'approved' | 'rejected';
  userScore: number;
  creditScore: number;
  creditGrade: string;
  loanType: string;
  report?: LoanReport;
  user?: {
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: Date;
  lenderMessage?: string;
}

export default function LenderDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('lenderToken');
    if (!token) {
      router.push('/lender/login');
      return;
    }

    fetchApplications(token);
  }, [router]);

  const fetchApplications = async (token: string) => {
    try {
      const response = await fetch('/api/lenders/applications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      } else if (response.status === 401) {
        localStorage.removeItem('lenderToken');
        router.push('/lender/login');
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject', message?: string) => {
    const token = localStorage.getItem('lenderToken');
    if (!token) return;

    setProcessingId(applicationId);
    try {
      const response = await fetch('/api/lenders/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ applicationId, action, message }),
      });

      if (response.ok) {
        // Refresh applications
        await fetchApplications(token);
      } else {
        alert('Failed to update application');
      }
    } catch (error) {
      console.error('Failed to update application:', error);
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const stats = {
    total: applications.length,
    eligible: applications.filter(a => a.report?.loanEligibility.eligible).length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Lender Dashboard</h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('lenderToken');
                router.push('/lender/login');
              }}
              className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.eligible}</div>
            <div className="text-sm text-gray-600">Eligible</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Loan Applications</h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No loan applications yet.</p>
              <p className="text-gray-500 text-sm mt-2">Applications will appear here once borrowers submit their KYC.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => {
                const report = app.report;
                if (!report) return null;
                
                return (
                  <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors animate-fade-in">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {app.user?.name || report.userIdentity.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Credit Score: <span className="font-semibold">{report.creditScore}</span></span>
                          <span>Grade: <span className="font-semibold">{report.creditGrade}</span></span>
                          <span>Score: <span className="font-semibold">{app.userScore}/100</span></span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          report.loanEligibility.eligible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.loanEligibility.eligible ? 'Eligible' : 'Not Eligible'}
                        </span>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApplicationAction(app._id, 'approve')}
                              disabled={processingId === app._id}
                              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleApplicationAction(app._id, 'reject')}
                              disabled={processingId === app._id}
                              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => router.push(`/lender/chat/${app.userId}`)}
                          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Financial Summary</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Income:</span>
                            <span className="font-semibold text-gray-900">₹{report.financialStability.monthlyIncome.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Expenses:</span>
                            <span className="font-semibold text-gray-900">₹{report.financialStability.monthlyExpenses.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Savings:</span>
                            <span className="font-semibold text-green-600">₹{report.financialStability.savings.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">EMI Obligations:</span>
                            <span className="font-semibold text-gray-900">₹{report.financialStability.emiObligations.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Loan Eligibility</span>
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Loan Amount:</span>
                            <span className="font-semibold text-indigo-600">₹{report.loanEligibility.maxLoanAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recommended Tenure:</span>
                            <span className="font-semibold text-gray-900">{report.loanEligibility.recommendedTenure} months</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Risk Level:</span>
                            <span className={`font-semibold ${
                              report.loanEligibility.riskLevel === 'low' ? 'text-green-600' :
                              report.loanEligibility.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {report.loanEligibility.riskLevel.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">KYC Status:</span>
                            <span className="font-semibold text-green-600">{report.kycResults.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
