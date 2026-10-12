import { Contract } from '../types';

export const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: 'contract-saas-2026',
    title: 'Enterprise Master SaaS Agreement (2026)',
    contractType: 'SaaS Agreement',
    uploadedAt: '2026-07-20',
    fileSize: '1.4 MB',
    status: 'ANALYZED',
    healthScore: 68,
    executiveOpinion: 'This contract strongly favors the Software Provider. Key issues include unlimited legal risk on the customer, automatic 12% price increases every year, and short data transfer windows if the agreement ends. We recommend negotiating these points before signing.',
    topRisks: [
      'Unlimited legal liability for the customer without equal protection from the software provider.',
      'Automatic 12% annual price increase during auto-renewal.',
      'Provider liability is capped at only 3 months of fees while customer risk is uncapped.',
      'Customer data is permanently deleted within 14 days after termination without an export grace period.'
    ],
    governingLaw: 'Laws of India (Courts at Bengaluru, Karnataka)',
    parties: ['Aura Cloud Solutions Pvt. Ltd. (Provider)', 'Apex India Enterprises Pvt. Ltd. (Customer)'],
    effectiveDate: 'August 1, 2026',
    expirationDate: 'July 31, 2029',
    clauses: [
      {
        id: 'c-101',
        sectionNumber: 'Section 1.2',
        title: 'Software Access & Permitted Usage',
        originalText: 'Provider hereby grants Customer a non-exclusive, non-transferable, revocable license to access the Platform solely for internal business operations. Customer shall not reverse engineer, decompile, or allow unauthorized third parties to access the Platform.',
        riskLevel: 'LOW',
        category: 'IP Rights',
        riskExplanation: 'Standard, fair usage terms preventing unauthorized copying or sharing of the software.',
        suggestedRewrite: 'Provider grants Customer and its Indian subsidiaries/affiliates a non-exclusive, non-transferable license to access and use the Platform for internal business operations.',
        negotiationAdvice: 'Add "and its Indian subsidiaries/affiliates" so your branch offices are legally covered.',
        confidenceScore: 98,
        referencedPrecedents: ['Indian Contract Act, 1872 (Section 23)', 'Information Technology Act, 2000'],
        pageNumber: 1
      },
      {
        id: 'c-102',
        sectionNumber: 'Section 4.1',
        title: 'Payment Terms & Annual Price Increases',
        originalText: 'Customer shall pay all invoices within fifteen (15) days of receipt. All fees automatically increase by twelve percent (12%) upon each annual renewal term without prior written notice from Provider.',
        riskLevel: 'HIGH',
        category: 'Payment Terms',
        riskExplanation: '15 days payment deadline is very tight for Indian corporate approval cycles, and a mandatory 12% yearly price hike increases cost rapidly.',
        suggestedRewrite: 'Customer shall pay all valid invoices within forty-five (45) days of receipt. Annual fee increases upon renewal shall not exceed 3% or the RBI Consumer Price Index (CPI), with 90 days prior written notice.',
        negotiationAdvice: 'Reject the 12% auto-increase. Limit price hikes to 3% max and ask for 45-day payment cycles.',
        confidenceScore: 95,
        referencedPrecedents: ['RBI Inflation Benchmark 2026', 'Commercial Payment Guidelines (MSME Act standards)'],
        pageNumber: 2
      },
      {
        id: 'c-103',
        sectionNumber: 'Section 7.3',
        title: 'Limitation of Liability (Unfair Cap)',
        originalText: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVIDER’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL BE LIMITED TO THE FEES PAID BY CUSTOMER IN THE THREE (3) MONTHS PRECEDING THE CLAIM. CUSTOMER’S LIABILITY SHALL BE UNCAPPED.',
        riskLevel: 'HIGH',
        category: 'Limitation of Liability',
        riskExplanation: 'Unfair one-sided protection. The software provider caps its risk to 3 months of fees, while your company has unlimited financial risk.',
        suggestedRewrite: 'EXCEPT FOR GROSS NEGLIGENCE OR BREACH OF DATA PRIVACY LAWS, EACH PARTY’S TOTAL LIABILITY SHALL BE CAPPED AT THE TOTAL FEES PAID IN THE PREVIOUS TWELVE (12) MONTHS.',
        negotiationAdvice: 'Demand equal 12-month fee caps for both parties, with exceptions for data breaches and gross misconduct.',
        confidenceScore: 97,
        referencedPrecedents: ['High Court Commercial Contract Precedents', 'Digital Personal Data Protection (DPDP) Act, 2023'],
        pageNumber: 3
      },
      {
        id: 'c-104',
        sectionNumber: 'Section 8.2',
        title: 'Legal Protection & Indemnity',
        originalText: 'Customer agrees to defend, indemnify, and hold harmless Provider against any and all third-party claims, losses, damages, or legal fees arising out of Customer’s use of the Service or any alleged violation of Applicable Law.',
        riskLevel: 'HIGH',
        category: 'Indemnification',
        riskExplanation: 'Requires you to pay provider legal fees even if a problem is caused by software bugs or system failures.',
        suggestedRewrite: 'Each party shall protect and defend the other against third-party claims resulting from its own gross negligence, misconduct, or copyright infringement.',
        negotiationAdvice: 'Make legal protection mutual so both companies are held responsible only for their own mistakes.',
        confidenceScore: 96,
        referencedPrecedents: ['Indian Contract Act, 1872 (Section 124)', 'Bar Council Commercial Digest'],
        pageNumber: 4
      },
      {
        id: 'c-105',
        sectionNumber: 'Section 11.4',
        title: 'Contract Ending & Data Deletion',
        originalText: 'Upon termination or expiration of this Agreement for any reason, Provider may immediately delete all Customer Data after fourteen (14) calendar days without liability.',
        riskLevel: 'MEDIUM',
        category: 'Termination',
        riskExplanation: '14 days is too short to safely download and backup all your business data when ending the service.',
        suggestedRewrite: 'Upon ending this Agreement, Provider shall keep Customer Data safe for ninety (90) days and help export all data in standard CSV/Excel format before secure deletion.',
        negotiationAdvice: 'Require a 90-day grace period for data download and transfer.',
        confidenceScore: 94,
        referencedPrecedents: ['DPDP Act 2023 (Data Erasure Rules)', 'IT Act 2000 Data Portability Standards'],
        pageNumber: 5
      }
    ],
    recommendations: [
      'Balance Section 7.3 so both parties have a mutual 12-month limit on financial liability.',
      'Reduce yearly price increase in Section 4.1 from 12% to a maximum 3% cap.',
      'Extend data backup time in Section 11.4 from 14 days to 90 days after contract ends.',
      'Ensure legal responsibility in Section 8.2 applies equally to both parties.'
    ],
    negotiationChecklist: [
      {
        id: 'chk-1',
        item: 'Equal Financial Liability Cap',
        status: 'CRITICAL',
        rationale: 'Currently provider risk is capped at 3 months while customer risk is unlimited.'
      },
      {
        id: 'chk-2',
        item: 'Cap Annual Price Hike at 3%',
        status: 'CRITICAL',
        rationale: 'Prevents unexpected 12% price hikes every year.'
      },
      {
        id: 'chk-3',
        item: '90-Day Data Export Time',
        status: 'IMPORTANT',
        rationale: 'Gives enough time to safely transfer business records.'
      },
      {
        id: 'chk-4',
        item: 'SLA Guarantee & Uptime Credits',
        status: 'OPTIONAL',
        rationale: 'Request 99.9% uptime with bill discount credits for server downtime.'
      }
    ],
    timelineEvents: [
      {
        id: 't-1',
        date: '2026-08-01',
        title: 'Contract Start Date',
        clauseRef: 'Preamble',
        importance: 'LOW'
      },
      {
        id: 't-2',
        date: '2027-06-01',
        title: 'Renewal Notice Deadline (60 days prior)',
        clauseRef: 'Section 4.1',
        importance: 'HIGH'
      },
      {
        id: 't-3',
        date: '2027-08-01',
        title: 'Year 2 Price Revision Trigger',
        clauseRef: 'Section 4.1',
        importance: 'HIGH'
      },
      {
        id: 't-4',
        date: '2029-07-31',
        title: 'Contract Completion & Data Transfer Window',
        clauseRef: 'Section 11.4',
        importance: 'MEDIUM'
      }
    ]
  },
  {
    id: 'contract-employment-2026',
    title: 'Senior Software Engineer Employment Agreement',
    contractType: 'Employment',
    uploadedAt: '2026-07-18',
    fileSize: '820 KB',
    status: 'ANALYZED',
    healthScore: 82,
    executiveOpinion: 'A fair employment agreement with strong salary terms, but contains a 2-year nationwide non-compete clause which is generally void and unenforceable under Section 27 of the Indian Contract Act.',
    topRisks: [
      '24-month nationwide non-compete restriction after leaving the company.',
      'Broad ownership of personal projects created during personal time.'
    ],
    governingLaw: 'Laws of India (High Court of Delhi, New Delhi)',
    parties: ['Veritas Tech Labs India Pvt. Ltd. (Employer)', 'Rohan Sharma (Employee)'],
    effectiveDate: 'September 15, 2026',
    expirationDate: 'Indefinite (Full-time Employment)',
    clauses: [
      {
        id: 'c-201',
        sectionNumber: 'Section 3.1',
        title: 'Base Salary & Performance Bonus',
        originalText: 'Employee shall receive an initial base salary of ₹24,00,000 per annum, payable in monthly installments, plus eligibility for an annual performance bonus of up to 20%.',
        riskLevel: 'SAFE',
        category: 'Payment Terms',
        riskExplanation: 'Standard salary structure with annual performance bonus.',
        suggestedRewrite: 'Employee shall receive a base salary of ₹24,00,000 per annum (payable monthly), with an annual performance bonus of up to 20% based on clear project goals.',
        negotiationAdvice: 'Request documented goals for bonus evaluation.',
        confidenceScore: 99,
        referencedPrecedents: ['Indian IT Sector Compensation Standards 2026'],
        pageNumber: 1
      },
      {
        id: 'c-202',
        sectionNumber: 'Section 6.2',
        title: 'Post-Employment Non-Compete Restriction',
        originalText: 'For a period of twenty-four (24) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, consult for, or hold equity in any business competing with Employer in India.',
        riskLevel: 'HIGH',
        category: 'General',
        riskExplanation: 'Post-employment non-competes are void in India under Section 27 of the Indian Contract Act, 1872.',
        suggestedRewrite: 'Employee agrees that during active employment and for a period of six (6) months after leaving, Employee shall not poach company clients or employees.',
        negotiationAdvice: 'Ask to remove the post-employment non-compete or change it to a standard 6-month non-poaching agreement.',
        confidenceScore: 98,
        referencedPrecedents: ['Section 27, Indian Contract Act, 1872', 'Supreme Court of India Ruling (Percept D’Mark)'],
        pageNumber: 2
      }
    ],
    recommendations: [
      'Remove the 24-month non-compete clause as it is invalid under Indian law.',
      'Clarify that personal projects made outside work hours remain employee property.'
    ],
    negotiationChecklist: [
      {
        id: 'chk-e1',
        item: 'Remove Post-Employment Non-Compete',
        status: 'CRITICAL',
        rationale: 'Non-compete clauses after leaving a job are legally void under Indian law.'
      }
    ],
    timelineEvents: [
      {
        id: 'te-1',
        date: '2026-09-15',
        title: 'Employment Start Date & Probation Period',
        clauseRef: 'Section 2.1',
        importance: 'HIGH'
      }
    ]
  },
  {
    id: 'contract-mnda-2026',
    title: 'Mutual Non-Disclosure Agreement (MNDA)',
    contractType: 'NDA',
    uploadedAt: '2026-07-15',
    fileSize: '410 KB',
    status: 'ANALYZED',
    healthScore: 94,
    executiveOpinion: 'A balanced agreement that protects confidential business information for both companies equally for a standard period of 3 years.',
    topRisks: [
      'Informal verbal disclosures need written confirmation within 30 days.'
    ],
    governingLaw: 'Laws of India (High Court of Judicature at Bombay, Mumbai)',
    parties: ['ContractOS Technologies Pvt. Ltd.', 'Quantum AI Systems India Pvt. Ltd.'],
    effectiveDate: 'July 15, 2026',
    expirationDate: 'July 15, 2029',
    clauses: [
      {
        id: 'c-301',
        sectionNumber: 'Section 2.1',
        title: 'Definition of Confidential Information',
        originalText: 'Confidential Information includes all non-public technical, financial, product, design, software source code, customer data, and business strategy shared verbally or in writing.',
        riskLevel: 'LOW',
        category: 'Confidentiality',
        riskExplanation: 'Standard definition that safely covers secret business plans, designs, and financial details.',
        suggestedRewrite: 'Confidential Information includes all non-public technical, financial, and business information clearly marked as Confidential.',
        negotiationAdvice: 'Standard agreement. Ensure oral disclosures during meetings are confirmed in writing within 30 days.',
        confidenceScore: 99,
        referencedPrecedents: ['Indian Contract Act, 1872 - Confidentiality Standards'],
        pageNumber: 1
      }
    ],
    recommendations: [
      'Standard MNDA ready for signing with minimal changes.'
    ],
    negotiationChecklist: [
      {
        id: 'chk-m1',
        item: 'Written Record of Verbal Meetings',
        status: 'OPTIONAL',
        rationale: 'Send brief email summaries after meetings to document confidential discussions.'
      }
    ],
    timelineEvents: [
      {
        id: 'tm-1',
        date: '2029-07-15',
        title: 'NDA Expiration Date',
        clauseRef: 'Section 5.1',
        importance: 'LOW'
      }
    ]
  }
];

