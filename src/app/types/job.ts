import { Job as PrismaJob, GeneratedResume, GeneratedCoverLetter, HunterCompany, HunterEmail } from '@prisma/client';

export interface Job extends Omit<PrismaJob, 'generatedResumes' | 'generatedCoverLetters'> {
  latestGeneratedResume: GeneratedResume | null;
  latestGeneratedCoverLetter: GeneratedCoverLetter | null;
  hunterCompanies: (HunterCompany & { emails: HunterEmail[] })[] | null;
}

export interface GeneratedResumeWithStatus extends GeneratedResume {
  status: 'generating' | 'ready' | 'failed' | 'not_started';
}

export interface GeneratedCoverLetterWithStatus extends GeneratedCoverLetter {
  status: 'generating' | 'ready' | 'failed' | 'not_started';
}