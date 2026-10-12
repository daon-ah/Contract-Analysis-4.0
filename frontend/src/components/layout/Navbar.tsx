import React from 'react';
import { 
  FileText, 
  Sparkles, 
  LogOut, 
  Upload, 
  Scale,
  Compass,
  FileCheck2,
  Sliders,
  HelpCircle,
  Download,
  ChevronRight
} from 'lucide-react';
import { Contract, ArticleView, UserProfile } from '../../types';
import { ContractosLogo } from '../common/ContractosLogo';

interface NavbarProps {
  currentContract: Contract | null;
  activeArticle: ArticleView;
  setActiveArticle: (article: ArticleView) => void;
  user: UserProfile | null;
  onOpenUpload: () => void;
  onLogout: () => void;
  onOpenCounsel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentContract,
  activeArticle,
  setActiveArticle,
  user,
  onOpenUpload,
  onLogout,
  onOpenCounsel
}) => {
  const navItems: { id: ArticleView; label: string; icon: React.ReactNode }[] = [
    { id: 'art-2-review', label: 'Review', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'art-3-negotiation', label: 'Negotiate', icon: <Scale className="w-3.5 h-3.5" /> },
    { id: 'art-1-upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { id: 'art-6-execution', label: 'Export', icon: <FileCheck2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-16 border-b border-[#E8E5E0] bg-white/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-40 shrink-0 select-none sticky top-0 shadow-xs">
      
      {/* Brand Logo & Active Document Indicator */}
      <div className="flex items-center gap-4 lg:gap-6">
        <ContractosLogo 
          variant="horizontal" 
          size="sm" 
          onClick={() => setActiveArticle('preamble')} 
        />

        <div className="h-5 w-px bg-[#E8E5E0] hidden md:block"></div>

        {/* Current Document Pill */}
        {currentContract ? (
          <div 
            onClick={() => setActiveArticle('art-2-review')}
            className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-[#F9F7F3] border border-[#E8E5E0] rounded-full text-xs hover:border-[#2C4235]/40 transition-colors cursor-pointer group"
          >
            <span className="uppercase font-sans text-[10px] text-[#2C4235] font-bold tracking-wider">
              {currentContract.contractType}
            </span>
            <span className="text-[#1C1C1A] font-semibold truncate max-w-[160px]" title={currentContract.title}>
              {currentContract.title}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentContract.healthScore < 70 
                ? 'bg-[#A83832]/10 text-[#A83832]' 
                : 'bg-[#3B6E52]/10 text-[#3B6E52]'
            }`}>
              Health: {currentContract.healthScore}/100
            </span>
          </div>
        ) : (
          <span className="hidden xl:inline text-xs text-[#6E6D6A] font-sans">
            No active agreement selected
          </span>
        )}
      </div>

      {/* Main Clean Navigation Tabs */}
      <nav className="flex items-center bg-[#F4F1EA] p-1 rounded-full border border-[#E8E5E0] overflow-x-auto no-scrollbar max-w-xl">
        {navItems.map((item) => {
          const isActive = activeArticle === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveArticle(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#1C1C1A] shadow-sm font-bold border border-[#E8E5E0]'
                  : 'text-[#6E6D6A] hover:text-[#1C1C1A] hover:bg-white/60'
              }`}
            >
              <span className={isActive ? 'text-[#2C4235]' : 'text-[#6E6D6A]'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right User Profile Section */}
      <div className="flex items-center gap-3">
        {/* User Account Button -> Profile View */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveArticle('profile')}
              title={`View Profile: ${user.name}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                activeArticle === 'profile' 
                  ? 'bg-[#2C4235] text-white shadow-xs' 
                  : 'hover:bg-[#F4F1EA] text-[#1C1C1A]'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#9E824A] text-white flex items-center justify-center text-xs font-bold font-serif shrink-0">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold font-sans hidden md:inline truncate max-w-[120px]">
                {user.name}
              </span>
            </button>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-[#6E6D6A] hover:text-[#A83832] transition-colors cursor-pointer rounded-full hover:bg-black/5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveArticle('auth')}
            className="px-4 py-1.5 bg-[#F4F1EA] hover:bg-[#E8E5E0] text-xs font-bold text-[#2C4235] rounded-full cursor-pointer font-sans transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

    </header>
  );
};
