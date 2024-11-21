import { Job as PrismaJob, GeneratedResume, GeneratedCoverLetter } from '@prisma/client';

export interface Job extends Omit<PrismaJob, 'generatedResumes' | 'generatedCoverLetters'> {
  latestGeneratedResume: GeneratedResume | null;
  latestGeneratedCoverLetter: GeneratedCoverLetter | null;
}

export interface GeneratedResumeWithStatus extends GeneratedResume {
  status: 'generating' | 'ready' | 'failed' | 'not_started';
}

export interface GeneratedCoverLetterWithStatus extends GeneratedCoverLetter {
  status: 'generating' | 'ready' | 'failed' | 'not_started';
}
