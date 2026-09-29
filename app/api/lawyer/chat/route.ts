import { NextRequest } from 'next/server';
import { getAuthenticatedUser, boundedText } from '@/lib/api-auth';

interface IPCSection {
  section: string;
  title: string;
  punishment: string;
  description: string;
  keywords: string[];
}

// Comprehensive IPC database for intelligent case analysis
const ipcDatabase: Record<string, IPCSection> = {
  // Land & Property Disputes
  '426': {
    section: '426',
    title: 'Mischief',
    punishment: 'Imprisonment up to 3 months or fine up to Rs. 250, or both',
    description: 'Whoever causes wrongful loss or damage to property with intent or knowledge that such act is likely to cause wrongful loss or damage.',
    keywords: ['damage', 'property', 'construction', 'unauthorized', 'building'],
  },
  '427': {
    section: '427',
    title: 'Causing Damage by Mischief',
    punishment: 'Imprisonment up to 6 months or fine up to Rs. 500, or both',
    description: 'Whoever commits mischief and thereby causes loss or damage to the amount of fifty rupees or upwards.',
    keywords: ['damage', 'construction', 'destruction', 'harm', 'property'],
  },
  '447': {
    section: '447',
    title: 'Criminal Trespass',
    punishment: 'Imprisonment up to 3 months or fine up to Rs. 250, or both',
    description: 'Whoever makes an intrusion into any field, tent, or building with intent to commit an offense or knowing it will cause damage.',
    keywords: ['trespass', 'land', 'intrusion', 'unauthorized', 'entry', 'building'],
  },
  '448': {
    section: '448',
    title: 'House Trespass',
    punishment: 'Imprisonment up to 3 months or fine up to Rs. 250, or both',
    description: 'Whoever commits criminal trespass by entering any building, tent used as human dwelling or place for worship.',
    keywords: ['house', 'building', 'trespass', 'property', 'land', 'enter'],
  },
  '425': {
    section: '425',
    title: 'Mischief by Injury to Property',
    punishment: 'Imprisonment up to 6 months or fine up to Rs. 500, or both',
    description: 'Whoever causes wrongful loss or damage to the public or person by damaging or diminishing any property.',
    keywords: ['damage', 'injury', 'property', 'construction', 'destroy'],
  },
  // Assault & Violence
  '354': {
    section: '354',
    title: 'Assault or Criminal Force',
    punishment: 'Imprisonment up to 3 years or fine up to Rs. 2,000, or both',
    description: 'Whoever assaults or uses criminal force to any person, intending to outrage modesty.',
    keywords: ['assault', 'punch', 'hit', 'beat', 'violence', 'injured', 'attack'],
  },
  '323': {
    section: '323',
    title: 'Voluntarily Causing Hurt',
    punishment: 'Imprisonment up to 3 months or fine up to Rs. 250, or both',
    description: 'Whoever voluntarily causes hurt shall be punished.',
    keywords: ['hurt', 'injury', 'pain', 'assault', 'violence', 'wound'],
  },
  '307': {
    section: '307',
    title: 'Attempt to Murder',
    punishment: 'Imprisonment up to 10 years and fine up to Rs. 1,000, or both',
    description: 'Whoever does any act with such intention or knowledge that if death resulted, would be guilty of murder.',
    keywords: ['attempted murder', 'stab', 'shoot', 'kill', 'life threat', 'attempt'],
  },
  // Theft & Property Crimes
  '379': {
    section: '379',
    title: 'Punishment for Theft',
    punishment: 'Imprisonment up to 3 years or fine up to Rs. 250, or both',
    description: 'Whoever intending to take dishonestly any movable property moves that property with intent to keep it without permission.',
    keywords: ['steal', 'theft', 'stolen', 'motorcycle', 'vehicle', 'robbery', 'took'],
  },
  '380': {
    section: '380',
    title: 'Theft in Dwelling-house',
    punishment: 'Imprisonment up to 7 years and fine up to Rs. 1,000, or both',
    description: 'Whoever commits theft in any building used as human dwelling or place for worship or repository.',
    keywords: ['theft', 'house', 'burglary', 'stolen', 'robbery', 'break'],
  },
  // Cheating & Fraud
  '420': {
    section: '420',
    title: 'Cheating and Dishonestly Inducing Delivery of Property',
    punishment: 'Imprisonment up to 7 years or fine up to Rs. 1,000, or both',
    description: 'Whoever cheats and by means of such cheating dishonestly induces to deliver any property.',
    keywords: ['cheat', 'fraud', 'deceive', 'scam', 'money', 'fake', 'false'],
  },
  // Wrongful Confinement
  '342': {
    section: '342',
    title: 'Punishment for Wrongful Confinement',
    punishment: 'Imprisonment up to 3 months or fine up to Rs. 250, or both',
    description: 'Whoever wrongfully confines any person.',
    keywords: ['confined', 'locked', 'imprisoned', 'held', 'captive', 'restrained'],
  },
  // Harassment & Intimidation
  '503': {
    section: '503',
    title: 'Criminal Intimidation',
    punishment: 'Imprisonment up to 2 years or fine up to Rs. 250, or both',
    description: 'Whoever threatens another with injury to person or property with intent to cause alarm.',
    keywords: ['threat', 'intimidation', 'blackmail', 'extortion', 'threatened', 'harassment'],
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { caseDescription } = body;

    if (!boundedText(caseDescription, 12000)) {
      return Response.json({ error: 'Case description is required and must be under 12,000 characters' }, { status: 400 });
    }

    // Find relevant IPC sections based on keywords
    const relevantSections = findRelevantIPCSections(caseDescription, ipcDatabase);

    // Generate professional FIR
    const fir = generateIntelligentFIR(caseDescription);

    return Response.json({
      fir,
      ipcSections: relevantSections,
    });
  } catch (error) {
    console.error('[v0] Lawyer chat error:', error);
    return Response.json({ error: 'Failed to generate legal analysis' }, { status: 500 });
  }
}

function findRelevantIPCSections(
  caseDescription: string,
  database: Record<string, IPCSection>
): Array<{
  section: string;
  title: string;
  punishment: string;
  applicability: string;
}> {
  const lowerCase = caseDescription.toLowerCase();
  const matchedSections: Array<{ section: IPCSection; matchCount: number }> = [];

  Object.values(database).forEach((ipc) => {
    const matchCount = ipc.keywords.filter((keyword) => lowerCase.includes(keyword)).length;
    if (matchCount > 0) {
      matchedSections.push({ section: ipc, matchCount });
    }
  });

  // Sort by relevance (more keyword matches = more relevant)
  return matchedSections
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 5)
    .map((match) => ({
      section: match.section.section,
      title: match.section.title,
      punishment: match.section.punishment,
      applicability: `${match.section.description} Your case mentions: ${match.section.keywords
        .filter((k) => lowerCase.includes(k))
        .join(', ')}.`,
    }));
}

function generateIntelligentFIR(caseDescription: string): string {
  const now = new Date();
  const caseKeywords = extractKeywords(caseDescription);
  const firNumber = Math.floor(Math.random() * 10000);

  return `FIRST INFORMATION REPORT (FIR)
================================================================

FIR NO.           : 2024/${firNumber}
DATE OF FIR       : ${now.toLocaleDateString('en-IN')}
TIME              : ${now.toLocaleTimeString('en-IN')}
POLICE STATION    : [Local Police Station]
JURISDICTION      : [City/District Name]

COMPLAINANT DETAILS:
────────────────────────────────────────────────────────────────
Name              : [Complainant Name]
Age               : [Age]
Gender            : [Gender]
Address           : [Full Address]
Phone             : [Contact Number]

ACCUSED DETAILS:
────────────────────────────────────────────────────────────────
Name              : ${caseKeywords.accused || '[Accused Name]'}
Age               : [Age]
Gender            : [Gender]
Address           : [Address]
Occupation        : [Occupation]
Criminal Record   : [If Any]

INCIDENT DETAILS:
────────────────────────────────────────────────────────────────
Date of Incident  : ${caseKeywords.date || '[Date]'}
Time of Incident  : ${caseKeywords.time || '[Time]'}
Location          : [Location/Address]
Nature of Offense : ${caseKeywords.offense || 'As detailed below'}

FACTS & CIRCUMSTANCES:
────────────────────────────────────────────────────────────────
${caseDescription}

The complainant states that the above facts are true and correct 
to the best of knowledge and belief. The accused has committed 
an offense as narrated above.

EVIDENCE & WITNESSES:
────────────────────────────────────────────────────────────────
Physical Evidence : ${caseKeywords.evidence || '[Describe]'}
Documents         : [Photos, videos, medical records, etc.]
Witnesses         : 
  1. [Witness Name & Contact]
  2. [Witness Name & Contact]

POLICE ACTION TAKEN:
────────────────────────────────────────────────────────────────
- Case registered
- Preliminary investigation initiated
- Evidence collected and documented
- Further investigation to follow

================================================================`;
}

function extractKeywords(text: string): Record<string, string> {
  const lowerText = text.toLowerCase();
  const keywords: Record<string, string> = {};

  // Extract accused name
  const accusedMatch = text.match(
    /(?:my |the |an )?(?:neighbor|person|friend|relative)\s+(?:named|is|called|[A-Z][a-z]+)/i
  );
  if (accusedMatch) {
    const parts = accusedMatch[0].split(/named|is|called/);
    if (parts[1]) keywords.accused = parts[1].trim();
  }

  // Extract date patterns
  const dateMatch = text.match(/(\d{1,2})\s+(\w+)\s+(?:at\s+)?(\d{1,2})?/i);
  if (dateMatch) keywords.date = `${dateMatch[1]} ${dateMatch[2]}`;

  // Extract time
  const timeMatch = text.match(/at\s+(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
  if (timeMatch) keywords.time = timeMatch[0];

  // Extract evidence
  const evidenceKeywords = ['photo', 'cctv', 'video', 'medical', 'document', 'witness'];
  const foundEvidence = evidenceKeywords.filter((e) => lowerText.includes(e));
  if (foundEvidence.length > 0) keywords.evidence = foundEvidence.join(', ').toUpperCase();

  // Extract offense type
  if (lowerText.includes('building') || lowerText.includes('construction'))
    keywords.offense = 'Unauthorized Construction/Trespass on Land';
  else if (lowerText.includes('assault') || lowerText.includes('beat'))
    keywords.offense = 'Criminal Assault/Voluntarily Causing Hurt';
  else if (lowerText.includes('steal') || lowerText.includes('theft'))
    keywords.offense = 'Theft';
  else if (lowerText.includes('threat'))
    keywords.offense = 'Criminal Intimidation';

  return keywords;
}
