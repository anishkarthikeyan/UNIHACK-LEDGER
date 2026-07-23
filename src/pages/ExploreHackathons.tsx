import React, { useState } from 'react';
import { Search, Filter, Star, Clock, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface ExploreHackathonsProps {
  onNavigate?: (route: string) => void;
}

export default function ExploreHackathons({ onNavigate }: ExploreHackathonsProps) {
  const [interested, setInterested] = useState<Record<string, boolean>>({});
  const [activeDomain, setActiveDomain] = useState('All Domains');
  const [activeEligibleYear, setActiveEligibleYear] = useState('All Years');
  const [activeMode, setActiveMode] = useState('All Modes');
  const [activePrize, setActivePrize] = useState('All Prizes');
  const [lessThan10Days, setLessThan10Days] = useState(false);

  const toggleInterested = (title: string) => {
    setInterested(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const allHackathons = [
    { title: 'Tether Developers Cup', org: 'Tether', status: 'Ongoing', daysLeft: 9, daysLeftStr: '9 days left', tags: ['Local AI', 'P2P', 'wallets', 'PRIVACY'], prize: '8,000 USD', highlight: true, domain: 'AI', mode: 'Online', eligibleYear: 'All Years', registeredCount: 420 },
    { title: 'WEEX AI Wars II: Rise of Intelligence', org: 'WEEX LABS', status: 'Pre-registration', daysLeft: 26, daysLeftStr: '26 days left', tags: ['AI', 'Trading', 'Web3', 'Crypto'], prize: '200,000 USD', domain: 'Crypto / PQC', mode: 'Hybrid', eligibleYear: '3rd Year+', registeredCount: 156 },
    { title: 'HashKey Chain Horizon Hackathon', org: 'HashKey Chain', status: 'Ongoing', daysLeft: 6, daysLeftStr: '6 days left', tags: ['HSP', 'DeFi', 'AI', 'Web3'], prize: '12,000 USD', highlight: true, domain: 'Crypto / PQC', mode: 'Offline', eligibleYear: 'All Years', registeredCount: 231 },
    { title: 'Casper Agentic Buildathon 2026', org: 'Casper Network', status: 'Extended', daysLeft: 2, daysLeftStr: '2 days left', tags: ['Agentic AI', 'DeFi', 'Real-World Assets'], prize: '150,000 USD', domain: 'Web3', mode: 'Online', eligibleYear: 'All Years', registeredCount: 89 },
    { title: 'MunichTech Innovation Hackathon 2026', org: 'MunichTech EXPO', status: 'Pre-registration', daysLeft: 77, daysLeftStr: '77 days left', tags: ['Industry', 'AI', 'Robotics'], prize: '50,000 USD', domain: 'AI', mode: 'Offline', eligibleYear: '4th Year+', registeredCount: 54 },
    { title: 'KeeperHub - Agents Onchain Hackathon', org: 'KeeperHub', status: 'Pre-registration', daysLeft: 21, daysLeftStr: '21 days left', tags: ['Agents', 'Onchain', 'DeFi'], prize: '5,000 USD', domain: 'Quantum', mode: 'Hybrid', eligibleYear: 'All Years', registeredCount: 112 },
    { title: 'Code for Good 2025', org: 'CSE Department', status: 'Ended', daysLeft: -1, daysLeftStr: 'Ended', tags: ['Social Impact', 'Web'], prize: '1,000 USD', domain: 'Student', mode: 'Offline', eligibleYear: '1st & 2nd Year', registeredCount: 350 }
  ];

  const filteredHackathons = allHackathons.filter(h => {
    if (activeDomain !== 'All Domains' && h.domain !== activeDomain) return false;
    if (activeMode !== 'All Modes' && h.mode !== activeMode) return false;
    if (activeEligibleYear !== 'All Years' && h.eligibleYear !== activeEligibleYear) return false;
    if (lessThan10Days && h.daysLeft > 10) return false; // less than 10 days means closing soon, excluding ended
    if (lessThan10Days && h.status === 'Ended') return false;
    
    if (activePrize !== 'All Prizes') {
      const prizeNum = parseInt(h.prize.replace(/,/g, '').replace(' USD', ''));
      if (activePrize === '< 1,000 USD' && prizeNum >= 1000) return false;
      if (activePrize === '1,000 - 10,000 USD' && (prizeNum < 1000 || prizeNum > 10000)) return false;
      if (activePrize === '> 10,000 USD' && prizeNum <= 10000) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Explore Hackathons</h1>
        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">Discover and participate in exciting events</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative w-full">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search hackathons by title, organizer, domain..." 
            className="w-full pl-14 pr-6 py-4 bg-black border-4 border-neutral-800 rounded-full focus:border-yellow-400 focus:bg-neutral-900 text-sm outline-none text-white placeholder-neutral-500 font-bold transition-all"
          />
        </div>
      </div>
      
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-4 pb-4">
         <select 
           value={activeDomain}
           onChange={(e) => setActiveDomain(e.target.value)}
           className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
         >
           <option value="All Domains">All Domains</option>
           <option value="AI">AI</option>
           <option value="Crypto / PQC">Crypto / PQC</option>
           <option value="Web3">Web3</option>
           <option value="Quantum">Quantum</option>
           <option value="Student">Student</option>
         </select>
         
         <select 
           value={activeEligibleYear}
           onChange={(e) => setActiveEligibleYear(e.target.value)}
           className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
         >
           <option value="All Years">All Years</option>
           <option value="1st & 2nd Year">1st & 2nd Year</option>
           <option value="3rd Year+">3rd Year+</option>
           <option value="4th Year+">4th Year+</option>
         </select>

         <select 
           value={activeMode}
           onChange={(e) => setActiveMode(e.target.value)}
           className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
         >
           <option value="All Modes">All Modes</option>
           <option value="Online">Online</option>
           <option value="Offline">Offline</option>
           <option value="Hybrid">Hybrid</option>
         </select>

         <select 
           value={activePrize}
           onChange={(e) => setActivePrize(e.target.value)}
           className="px-6 py-3 bg-black border-2 border-neutral-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-white outline-none hover:border-yellow-400 transition-colors shrink-0"
         >
           <option value="All Prizes">All Prizes</option>
           <option value="< 1,000 USD">&lt; 1,000 USD</option>
           <option value="1,000 - 10,000 USD">1,000 - 10,000 USD</option>
           <option value="> 10,000 USD">&gt; 10,000 USD</option>
         </select>

         <label className={`flex items-center gap-2 px-6 py-3 border-2 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:border-yellow-400 transition-colors shrink-0 ${lessThan10Days ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-black border-neutral-800 text-white'}`}>
           <input type="checkbox" className="hidden" checked={lessThan10Days} onChange={(e) => setLessThan10Days(e.target.checked)} />
           Less than 10 days
         </label>
      </div>

      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">All Hackathons <span className="text-neutral-500 text-sm">({filteredHackathons.length})</span></h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredHackathons.map((h, i) => (
          <div key={i} className="bg-black rounded-[32px] border-4 border-neutral-800 flex flex-col hover:border-yellow-400 transition-colors group overflow-hidden">
            <div className="w-full h-40 bg-neutral-900 relative flex items-center justify-center border-b-2 border-neutral-800">
              {/* Image Placeholder */}
              <div className="w-16 h-16 border-4 border-neutral-800 rounded-full flex items-center justify-center text-neutral-400 font-bold uppercase text-[10px]">Image</div>
              
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <span className="px-3 py-1 bg-neutral-900 text-white-TMP text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                   <div className="w-4 h-4 bg-neutral-900 rounded-full"></div> {h.org}
                </span>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${
                    h.status === 'Ongoing' ? 'bg-green-500 text-white' : 
                    h.status === 'Ended' ? 'bg-neutral-700 text-neutral-400' :
                    h.status === 'Extended' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {h.status}
                  </span>
                  {h.status !== 'Ended' && (
                    <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-green-500 bg-neutral-900 rounded border border-neutral-800">
                      {h.daysLeftStr}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-black leading-tight mb-4 group-hover:text-yellow-400 transition-colors">{h.title} {h.highlight && '🏆'}</h3>
              
              <div className="flex flex-wrap gap-1.5 mb-6 mt-1">
                {h.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-yellow-400/20">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
                 <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Prize Pool</span>
                    <span className="font-mono font-bold text-lg text-white">{h.prize}</span>
                 </div>
                 <div className="flex flex-col gap-1 items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Registered</span>
                    <span className="font-mono font-bold text-sm text-white">{h.registeredCount}</span>
                 </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                 <button 
                   onClick={() => toggleInterested(h.title)}
                   className={`flex-1 py-3 border-2 rounded-full flex justify-center items-center gap-2 transition-colors text-[10px] font-bold uppercase tracking-widest ${
                     interested[h.title] 
                      ? 'bg-yellow-400 border-yellow-400 text-white' 
                      : 'bg-neutral-900 border-neutral-800 hover:border-white text-white'
                   }`}
                 >
                   {interested[h.title] ? <Check size={14} /> : <Star size={14} className="text-neutral-500" />} 
                   {interested[h.title] ? 'Interested' : 'Interested'}
                 </button>
                 <button 
                   onClick={() => onNavigate?.('hackathon-detail')}
                   className="flex-1 py-3 bg-neutral-900 text-white-TMP rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-neutral-700 transition-colors"
                 >
                   Details
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
