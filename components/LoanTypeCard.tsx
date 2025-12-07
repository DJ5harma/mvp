'use client';

import { LoanType } from '@/types';
import { getLoanTypeInfo } from '@/lib/matching';

interface LoanTypeCardProps {
  loanType: LoanType;
  onSelect: (loanType: LoanType) => void;
}

export default function LoanTypeCard({ loanType, onSelect }: LoanTypeCardProps) {
  const info = getLoanTypeInfo(loanType);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{loanType} Loan</h3>
      <p className="text-gray-600 mb-4">{info.description}</p>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          {info.benefits.map((benefit, idx) => (
            <li key={idx}>{benefit}</li>
          ))}
        </ul>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onSelect(loanType)}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Select
        </button>
        <button
          onClick={() => {/* Show more info modal */}}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          More Info
        </button>
      </div>
    </div>
  );
}

