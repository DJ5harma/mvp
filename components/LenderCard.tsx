'use client';

import { LoanOffer } from '@/types';
import { Building2, Percent, Calendar, Tag, Sparkles, ArrowRight } from 'lucide-react';

interface LenderCardProps {
  lender: LoanOffer;
  index: number;
  onSelect: (lender: LoanOffer) => void;
}

export default function LenderCard({ lender, index, onSelect }: LenderCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover-lift cursor-pointer group" onClick={() => onSelect(lender)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            {index + 1}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>{lender.lenderName}</span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">{lender.loanType} Loan</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Best Match</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Percent className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-medium text-gray-600">Interest Rate</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{lender.interestRate}%</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-600">Max Tenure</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{Math.max(...lender.tenureOptions)} months</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Platform Discount:</span>
          <span className="font-semibold text-green-600">{lender.platformDiscount}% OFF</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Max Loan Amount:</span>
          <span className="font-semibold text-gray-900">₹{lender.maxAmount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tenure Options:</span>
          <span className="font-semibold text-gray-900">{lender.tenureOptions.join(', ')} months</span>
        </div>
      </div>

      {lender.specialOffers && lender.specialOffers.length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-gray-700">Special Offers:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lender.specialOffers.map((offer, idx) => (
              <span key={idx} className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium">
                {offer}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2 group-hover:scale-105">
        <span>Select This Lender</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

