import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Contract } from '../../types';

interface LeftSidebarProps {
  contracts: Contract[];
  activeContractId: string | null;
  onSelectContract: (id: string) => void;
  onOpenUpload?: () => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  contracts,
  activeContractId,
  onSelectContract,
  activeFilter,
  setActiveFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'SaaS Agreement', label: 'SaaS' },
    { id: 'Employment', label: 'Employment' },
    { id: 'NDA', label: 'NDA' },
    { id: 'MSA', label: 'MSA' },
    { id: 'Vendor Contract', label: 'Vendor' }
  ];

  const filteredContracts = contracts.filter((c) => {
    const matchesFilter = activeFilter === 'ALL' || c.contractType === activeFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.parties.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <aside className="w-64 bg-white border-r border-[#EAEAEA] flex flex-col h-[calc(100vh-4rem)] select-none shrink-0">
      
      {/* Search Input */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#888888]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contracts..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F8F8F6] border border-[#EAEAEA] rounded text-xs text-[#181818] placeholder-[#888888] focus:outline-none focus:border-[#244B3C] transition-colors"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar border-b border-[#EAEAEA]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
              activeFilter === cat.id
                ? 'bg-[#244B3C] text-white'
                : 'bg-[#F8F8F6] text-[#6A6A6A] hover:bg-[#EAEAEA] hover:text-[#181818]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Contracts List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredContracts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#888888]">
            No contracts match filters.
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const isSelected = contract.id === activeContractId;
            const highRiskCount = contract.clauses.filter(c => c.riskLevel === 'HIGH').length;

            return (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract.id)}
                className={`p-2.5 rounded transition-all cursor-pointer group border ${
                  isSelected
                    ? 'bg-[#F0F4F2] border-[#244B3C]/30 text-[#181818]'
                    : 'bg-white border-transparent hover:bg-[#F8F8F6] hover:border-[#EAEAEA]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold line-clamp-1 ${isSelected ? 'text-[#244B3C]' : 'text-[#181818]'}`}>
                    {contract.title}
                  </span>
                  <span className={`text-[10px] font-mono font-bold shrink-0 ${
                    contract.healthScore < 70 ? 'text-[#C14F4A]' : contract.healthScore < 85 ? 'text-[#C58F3D]' : 'text-[#244B3C]'
                  }`}>
                    {contract.healthScore}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6A6A6A] mt-1">
                  <span className="truncate max-w-[120px]">{contract.contractType}</span>
                  <div className="flex items-center gap-2">
                    {highRiskCount > 0 && (
                      <span className="text-[10px] text-[#C14F4A] font-medium flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {highRiskCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#EAEAEA] text-[11px] text-[#888888] flex items-center justify-between">
        <span className="font-mono text-[10px]">ContractOS v2.4</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#244B3C]"></div>
          <span>Engine Ready</span>
        </div>
      </div>

    </aside>
  );
};

