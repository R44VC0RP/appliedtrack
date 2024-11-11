import mongoose from 'mongoose';

export enum JobStatus {
  YET_TO_APPLY = 'Yet to Apply',
  APPLIED = 'Applied',
  PHONE_SCREEN = 'Phone Screen',
  INTERVIEW = 'Interview',
  OFFER = 'Offer',
  REJECTED = 'Rejected',
  ACCEPTED = 'Accepted',
  ARCHIVED = 'Archived'
}

// First, create an interface for the plain job object
export interface IJob {
  id?: string;
  userId: string;
  company: string;
  position: string;
  status: JobStatus;
  website: string;
  resumeLink: string;
  jobDescription: string;
  dateApplied: string;
  coverLetterLink?: string;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  interviewDate?: string;
  salary?: number;
  location?: string;
  remoteType?: 'On-site' | 'Remote' | 'Hybrid';
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  dateCreated?: string;
  dateUpdated?: string;
  flag?: 'no_response' | 'update' | string;
  hunterData?: {
    domain: string;
    pattern?: string;
    organization?: string;
    emails?: Array<{
      value: string;
      type: string;
      confidence: number;
      sources: Array<{
        uri: string | null;
        [key: string]: any;
      }>;
      first_name?: string;
      last_name?: string;
      position?: string;
      seniority?: string;
      department?: string;
      linkedin?: string;
      twitter?: string;
      phone_number?: string;
      verification?: {
        date: string;
        status: string;
      };
    }>;
    dateUpdated?: string;
    meta?: {
      results: number;
      limit: number;
      offset: number;
      params: {
        domain: string;
        [key: string]: any;
      };
    };
  };
  isArchived?: boolean;
  coverLetter?: {
    url: string;
    status: 'generating' | 'ready' | 'failed' | 'not_started';
    dateGenerated?: string;
  };
  aiRated: boolean;
  aiNotes: string;
  aiRating: number;
}

// Then extend it for the mongoose document


const JobSchema = new mongoose.Schema({
  id: String,
  userId: String,
  company: String,
  position: String,
  status: {
    type: String,
    enum: ['Yet to Apply', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Archived']
  },
  website: String,
  resumeLink: String,
  jobDescription: String,
  dateApplied: String,
  coverLetterLink: String,
  notes: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  interviewDate: String,
  salary: Number,
  location: String,
  remoteType: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid']
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship']
  },
  dateCreated: String,
  dateUpdated: String,
  flag: String,
  hunterData: {
    domain: String,
    pattern: String,
    organization: String,
    emails: Array,
    dateUpdated: String,
    meta: {
      results: Number,
      limit: Number,
      offset: Number,
      params: Object
    }
  },
  isArchived: Boolean,
  coverLetter: {
    url: String,
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed', 'not_started']
    },
    dateGenerated: String
  },
  aiRated: Boolean,
  aiNotes: String,
  aiRating: Number
});


export type Job = mongoose.Document & IJob;

// Fix the model export to handle Next.js hot reloading properly
const JobModel = (mongoose.models?.Job || mongoose.model('Job', JobSchema)) as mongoose.Model<Job>;

// Export the model
export { JobModel };
