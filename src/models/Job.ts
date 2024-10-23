import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  id: String,
  userId: String,
  company: String,
  position: String,
  status: String,
  website: String,
  resumeLink: String,
  hunterData: Object,
  coverLetterLink: String,
  jobDescription: String,
  notes: String,
  contactName: String,
  contactEmail: String,
  contactPhone: String,
  interviewDate: Date,
  dateApplied: Date,
  salary: Number,
  location: String,
  remoteType: String,
  jobType: String,
  dateCreated: Date,
  dateUpdated: Date,
  flag: String,
});

export const JobModel = mongoose.models.Job || mongoose.model('Job', JobSchema);
