import { JobModel } from '@/models/Job';

export async function getJob(jobId: string) {
  try {
    const job = await JobModel.findOne({ id: jobId });
    
    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
} 