'use client';

import { LoanReport, UserScore } from '@/types';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, DollarSign, Calendar, Shield, FileText, Award } from 'lucide-react';

interface ReportPreviewProps {
  report: LoanReport;
  userScore: UserScore;
  lenderName?: string;
}

export default function ReportPreview({ report, userScore, lenderName }: ReportPreviewProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Loan Eligibility Report</h2>
            {lenderName && (
              <p className="text-sm text-gray-600">Application sent to: <span className="font-semibold text-indigo-600">{lenderName}</span></p>
            )}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full border-2 flex items-center space-x-2 ${getRiskColor(report.loanEligibility.riskLevel)}`}>
          {getRiskIcon(report.loanEligibility.riskLevel)}
          <span className="font-semibold">{report.loanEligibility.riskLevel.toUpperCase()} RISK</span>
        </div>
      </div>

      {/* Eligibility Status */}
      <div className={`mb-6 p-4 rounded-xl border-2 ${
        report.loanEligibility.eligible
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          {report.loanEligibility.eligible ? (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${report.loanEligibility.eligible ? 'text-green-800' : 'text-red-800'}`}>
              {report.loanEligibility.eligible ? '✅ You are ELIGIBLE for a loan!' : '❌ You are NOT eligible for a loan'}
            </h3>
            <p className={`text-sm mt-1 ${report.loanEligibility.eligible ? 'text-green-700' : 'text-red-700'}`}>
              {report.loanEligibility.eligible
                ? 'Your application has been sent to the lender for review.'
                : 'Your current financial profile does not meet the eligibility criteria. Please improve your credit score or financial stability.'}
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Your Overall Score: <span className={getScoreColor(userScore.totalScore)}>{userScore.totalScore}/100</span></span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{userScore.incomeStability}</div>
            <div className="text-xs text-gray-600 mt-1">Income Stability</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{userScore.emiBurden}</div>
            <div className="text-xs text-gray-600 mt-1">EMI Burden</div>
          </div>
          <div className="bg-pink-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-pink-600">{userScore.savingsRatio}</div>
            <div className="text-xs text-gray-600 mt-1">Savings Ratio</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{userScore.creditScore}</div>
            <div className="text-xs text-gray-600 mt-1">Credit Score</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{userScore.documentAccuracy}</div>
            <div className="text-xs text-gray-600 mt-1">Documents</div>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600">Max Loan Amount</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            ₹{report.loanEligibility.maxLoanAmount.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Recommended Tenure</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {report.loanEligibility.recommendedTenure} months
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Credit Score</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {report.creditScore} ({report.creditGrade})
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span>Financial Summary</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Income</span>
                <span className="font-semibold text-gray-900">₹{report.financialStability.monthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Expenses</span>
                <span className="font-semibold text-gray-900">₹{report.financialStability.monthlyExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">EMI Obligations</span>
                <span className="font-semibold text-gray-900">₹{report.financialStability.emiObligations.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Savings</span>
                <span className="font-semibold text-green-600">₹{report.financialStability.savings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Disposable Income</span>
                <span className={`font-semibold ${
                  report.financialStability.disposableIncome > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{report.financialStability.disposableIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">KYC Status</span>
                <span className="font-semibold text-green-600 uppercase">{report.kycResults.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span>Risk Assessment</span>
        </h3>
        <div className="space-y-2 text-sm">
          {report.loanEligibility.riskLevel === 'low' && (
            <p className="text-green-700">✅ Low risk profile - Strong financial stability and credit history.</p>
          )}
          {report.loanEligibility.riskLevel === 'medium' && (
            <>
              <p className="text-yellow-700">⚠️ Medium risk profile - Consider improving your credit score or reducing existing debt.</p>
              <p className="text-gray-600">• Your credit score is moderate</p>
              <p className="text-gray-600">• Some areas need improvement for better loan terms</p>
            </>
          )}
          {report.loanEligibility.riskLevel === 'high' && (
            <>
              <p className="text-red-700">❌ High risk profile - Significant improvements needed before loan approval.</p>
              <p className="text-gray-600">• Credit score needs improvement</p>
              <p className="text-gray-600">• High debt-to-income ratio</p>
              <p className="text-gray-600">• Limited savings buffer</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

