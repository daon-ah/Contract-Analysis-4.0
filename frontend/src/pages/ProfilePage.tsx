import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Phone, 
  FileText, 
  Check, 
  Save, 
  Sparkles,
  CreditCard,
  Award,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenUpload: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onOpenUpload
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [role, setRole] = useState(user?.role || '');
  
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      id: user?.id || 'usr-1',
      name,
      email,
      phone,
      organization,
      role,
      planTier: 'Pro Business Plan',
      contractsAnalyzedCount: 38,
      redlinesGeneratedCount: 124
    };
    onUpdateUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Banner / Header Card */}
        <div className="paper-sheet p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#2C4235] text-white flex items-center justify-center font-serif text-2xl font-bold border-2 border-[#9E824A] shadow-sm">
              {name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-[#1C1C1A]">{name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9E824A]/10 text-[#9E824A] uppercase font-sans border border-[#9E824A]/20">
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-[#6E6D6A] font-sans mt-0.5">
                {role} • {organization}
              </p>
              <p className="text-[11px] text-[#6E6D6A] font-mono mt-1">
                {email}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-[#E8E5E0] pt-4 md:pt-0">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#2C4235] text-white text-xs font-semibold rounded-full hover:bg-[#1E2E25] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-[#9E824A]" />
              <span>Vault Workspace</span>
            </button>
          </div>
        </div>

        {/* Usage Stats Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="paper-sheet p-5 space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold text-[#6E6D6A] uppercase tracking-wider block">
              Agreements Audited
            </span>
            <div className="text-2xl font-serif font-bold text-[#2C4235]">38 Contracts</div>
            <p className="text-[11px] text-[#6E6D6A]">SOC-2 encrypted vault</p>
          </div>

          <div className="paper-sheet p-5 space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold text-[#6E6D6A] uppercase tracking-wider block">
              Redlines Executed
            </span>
            <div className="text-2xl font-serif font-bold text-[#9E824A]">124 Clauses</div>
            <p className="text-[11px] text-[#6E6D6A]">Protective & balanced stances</p>
          </div>

          <div className="paper-sheet p-5 space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold text-[#6E6D6A] uppercase tracking-wider block">
              Subscription Plan
            </span>
            <div className="text-base font-serif font-bold text-[#1C1C1A] flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Award className="w-4 h-4 text-[#9E824A]" />
              <span>Enterprise Partner</span>
            </div>
            <p className="text-[11px] text-[#3B6E52] font-semibold">Unlimited AI Counsel Audits</p>
          </div>
        </div>

        {/* Profile Settings Form Card */}
        <div className="paper-sheet p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E8E5E0] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1C1C1A]">Account & Security Settings</h2>
              <p className="text-xs text-[#6E6D6A]">Update your official legal profile credentials and integration keys.</p>
            </div>
            {savedSuccess && (
              <span className="px-3 py-1 bg-[#3B6E52]/10 text-[#3B6E52] text-xs font-bold rounded-full flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1A] mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[#6E6D6A]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9F7F3] border border-[#E8E5E0] rounded-md text-xs text-[#1C1C1A] focus:outline-none focus:border-[#2C4235]"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1A] mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#6E6D6A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9F7F3] border border-[#E8E5E0] rounded-md text-xs text-[#1C1C1A] focus:outline-none focus:border-[#2C4235]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1A] mb-1.5">
                  Mobile Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#6E6D6A]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9F7F3] border border-[#E8E5E0] rounded-md text-xs text-[#1C1C1A] focus:outline-none focus:border-[#2C4235]"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1A] mb-1.5">
                  Law Firm / Organization
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-[#6E6D6A]" />
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F9F7F3] border border-[#E8E5E0] rounded-md text-xs text-[#1C1C1A] focus:outline-none focus:border-[#2C4235]"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#1C1C1A] mb-1.5">
                  Role & Practice Title
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F7F3] border border-[#E8E5E0] rounded-md text-xs text-[#1C1C1A] focus:outline-none focus:border-[#2C4235]"
                />
              </div>

            </div>

            {/* Form Actions */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2C4235] text-white text-xs font-semibold rounded-full hover:bg-[#1E2E25] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#9E824A]" />
                <span>Save Profile Credentials</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
