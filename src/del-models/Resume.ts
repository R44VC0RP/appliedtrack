import mongoose, { Document, Schema } from 'mongoose';

interface Resume extends Document {

  userId: string;
  fileUrl: string;
  fileId: string;
  fileName: string;
  resumeId: string;
  dateCreated: Date;
  dateUpdated: Date;
}

const ResumeSchema = new Schema<Resume>({
  userId: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileId: { type: String, required: true },
  fileName: { type: String, required: true },
  resumeId: { type: String, required: true, unique: true },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
});

const ResumeModel = mongoose.models.Resume || mongoose.model<Resume>('Resume', ResumeSchema);
