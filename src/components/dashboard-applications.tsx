'use client'

import { useState, useEffect, useCallback } from 'react'
// import logo from '@/app/logos/logo.png'
import hunterLogo from '@/app/logos/hunter.png'
import { UploadButton } from "@/utils/uploadthing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Mail, Calendar, Phone, Search, User, Clipboard, Pencil, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from "@/components/ui/switch"
// import Masonry from 'react-masonry-css'
// import { FaThLarge, FaList } from 'react-icons/fa'
import { useMediaQuery } from 'react-responsive'
import Image from 'next/image'
import { List, Grid } from 'lucide-react'
import { LinkedInLogoIcon } from '@radix-ui/react-icons'
import { Separator } from "@/components/ui/separator"
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from '@/components/header'
import {
  SignedIn,
  SignedOut
} from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs';
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { useToast } from "@/hooks/use-toast"
import { FaSync } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';

// Define types for Hunter.io email data
interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  sources: Array<any>;
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
}

// Job status options
const jobStatuses = ['Yet to Apply', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Accepted']

// Define types for job data
interface Job {
  id?: string;
  userId: string;
  company: string;
  position: string;
  status: 'Yet to Apply' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted';
  website: string;
  resumeLink: string;
  jobDescription: string;
  dateApplied: string;
  // Add other fields as needed, but keep them optional
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
  dateUpdated?: string;
  flag?: 'no_response' | 'update' | string;
  hunterData?: {
    domain: string;
    pattern?: string;
    organization?: string;
    emails?: HunterEmail[];
    dateUpdated?: string;
  };
}

// Define types for Hunter.io search results
interface HunterIoResult {
  name: string;
  email: string;
  position: string;
}

// Sample job data (expanded)
// const initialJobs: Job[] = [
//   {
//     id: 1,
//     company: 'TechNova Solutions',
//     position: 'Senior Frontend Developer',
//     status: 'Applied',
//     website: 'https://technovasolutions.com',
//     resumeLink: '/resumes/frontend_dev_resume.pdf',
//     coverLetterLink: '/cover_letters/technova_cover_letter.pdf',
//     jobDescription: 'TechNova is seeking an experienced frontend developer to lead our UI/UX team in creating innovative web applications...',
//     notes: 'Applied through their careers portal. Emphasized experience with React and TypeScript.',
//     contactName: 'Sarah Johnson',
//     contactEmail: 'sjohnson@technovasolutions.com',
//     contactPhone: '(555) 123-4567',
//     interviewDate: '2023-07-15',
//     lastUpdated: '2023-07-01',
//     flag: 'no_response'
//   },
//   {
//     id: 2,
//     company: 'DataSphere Analytics',
//     position: 'Data Engineer',
//     status: 'Phone Screen',
//     website: 'https://datasphereanaly.com',
//     resumeLink: '/resumes/data_engineer_resume.pdf',
//     coverLetterLink: '/cover_letters/datasphere_cover_letter.pdf',
//     jobDescription: 'Join our data engineering team to build scalable data pipelines and optimize our big data infrastructure...',
//     notes: 'Phone screen scheduled with the hiring manager. Prepare to discuss experience with Apache Spark and AWS.',
//     contactName: 'Michael Chen',
//     contactEmail: 'mchen@datasphereanaly.com',
//     contactPhone: '(555) 987-6543',
//     interviewDate: '2023-07-10',
//     lastUpdated: '2023-07-05',
//     flag: 'update'
//   },
//   {
//     id: 3,
//     company: 'GreenTech Innovations',
//     position: 'Full Stack Developer',
//     status: 'Interview',
//     website: 'https://greentechinno.com',
//     resumeLink: '/resumes/fullstack_dev_resume.pdf',
//     coverLetterLink: '/cover_letters/greentech_cover_letter.pdf',
//     jobDescription: 'GreenTech is looking for a versatile full stack developer to help build our next-generation sustainable energy management platform...',
//     notes: 'Second round interview scheduled. Will involve a technical assessment and meeting with the team.',
//     contactName: 'Emily Rodriguez',
//     contactEmail: 'erodriguez@greentechinno.com',
//     contactPhone: '(555) 246-8135',
//     interviewDate: '2023-07-20',
//     lastUpdated: '2023-07-12',
//     flag: 'update'
//   },
//   {
//     id: 4,
//     company: 'CloudSecure Systems',
//     position: 'DevOps Engineer',
//     status: 'Applied',
//     website: 'https://cloudsecuresys.com',
//     resumeLink: '/resumes/devops_engineer_resume.pdf',
//     coverLetterLink: '/cover_letters/cloudsecure_cover_letter.pdf',
//     jobDescription: 'We are seeking a skilled DevOps engineer to enhance our cloud infrastructure and implement robust security measures...',
//     notes: 'Submitted application online. Highlighted experience with Kubernetes and CI/CD pipelines.',
//     contactName: 'Alex Thompson',
//     contactEmail: 'athompson@cloudsecuresys.com',
//     contactPhone: '(555) 369-2580',
//     interviewDate: '',
//     lastUpdated: '2023-07-08',
//     flag: 'no_response'
//   },
//   {
//     id: 5,
//     company: 'QuantumAI Research',
//     position: 'Machine Learning Engineer',
//     status: 'Offer',
//     website: 'https://quantu',
//     resumeLink: '/path/to/resume5.pdf',
//     coverLetterLink: '/path/to/coverletter5.pdf',
//     jobDescription: 'Join our cutting-edge AI team...',
//     notes: 'Received offer, negotiating salary',
//     contactName: 'Eva Brown',
//     contactEmail: 'eva@aiinnovations.com',
//     contactPhone: '(333) 444-5555',
//     interviewDate: '2023-06-05',
//     lastUpdated: '2023-06-18',
//     flag: 'update'
//   },
// ]



// Placeholder function for hunter.io API call
// const searchHunterIo = async (company: string): Promise<HunterIoResult[]> => {
//   // This would be replaced with an actual API call to hunter.io
//   await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
//   return [
//     { name: 'John Smith', email: 'john.smith@' + company.toLowerCase() + '.com', position: 'HR Manager' },
//     { name: 'Jane Doe', email: 'jane.doe@' + company.toLowerCase() + '.com', position: 'Talent Acquisition Specialist' },
//     { name: 'Mike Johnson', email: 'mike.johnson@' + company.toLowerCase() + '.com', position: 'Department Head' },
//   ];
// };

// Move getStatusColor function outside of the main component
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Yet to Apply': return 'bg-blue-100 text-blue-800'
    case 'Applied': return 'bg-blue-100 text-blue-800'
    case 'Phone Screen': return 'bg-yellow-100 text-yellow-800'
    case 'Interview': return 'bg-purple-100 text-purple-800'
    case 'Offer': return 'bg-green-100 text-green-800'
    case 'Rejected': return 'bg-red-100 text-red-800'
    case 'Accepted': return 'bg-emerald-100 text-emerald-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Add getFlagIcon function
const getFlagIcon = (flag: string) => {
  switch (flag) {
    case 'no_response':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    case 'update':
      return <Clock className="w-5 h-5 text-blue-500" />
    default:
      return null
  }
}

export function AppliedTrack() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  // const [hunterIoResults, setHunterIoResults] = useState<HunterIoResult[]>([])
  // const [isSearchingHunterIo, setIsSearchingHunterIo] = useState<boolean>(false)
  const [layoutMode, setLayoutMode] = useState<'list' | 'masonry'>('list')
  const [columns, setColumns] = useState(3)
  // const containerRef = useRef<HTMLDivElement>(null)
  const isTablet = useMediaQuery({ maxWidth: 1024 })
  const isMobile = useMediaQuery({ maxWidth: 640 })
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState<boolean>(false)
  const { isLoaded, userId } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const { toast } = useToast()
  const searchParams = useSearchParams();

  useEffect(() => {
    const updateColumns = () => {
      if (isMobile) {
        setColumns(1)
      } else if (isTablet) {
        setColumns(2)
      } else {
        setColumns(3)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [isMobile, isTablet])

  useEffect(() => {
    if (isLoaded && userId) {
      fetch('/api/jobs')
        .then(response => response.json())
        .then(data => setJobs(data))
        .catch(error => console.error('Error fetching jobs:', error));
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch('/api/resumes');
        if (response.ok) {
          const data = await response.json();
          setResumes(data);
        }
      } catch (error) {
        console.error('Error fetching resumes:', error);
      }
    };

    fetchResumes();
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const tier = searchParams.get('tier');
    
    if (success === 'true' && tier) {
      toast({
        title: "Subscription Upgraded!",
        description: `Thanks for upgrading to ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier.`,
        variant: "default",
      });
    }
  }, [searchParams, toast]);

  const handleKeyDown = (e: React.KeyboardEvent, job: Job) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const currentStatusIndex = jobStatuses.indexOf(job.status)
      const newStatusIndex = e.key === 'ArrowLeft' 
        ? (currentStatusIndex - 1 + jobStatuses.length) % jobStatuses.length
        : (currentStatusIndex + 1) % jobStatuses.length
      updateJobStatus(job.id || '', jobStatuses[newStatusIndex] as Job['status'])
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'n') {
        e.preventDefault()
        // Open modal to add new job
        setSelectedJob({
          userId: userId || '',
          company: '',
          position: '',
          status: 'Yet to Apply',
          website: '',
          resumeLink: '',
          coverLetterLink: '',
          jobDescription: '',
          notes: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          interviewDate: '',
          dateApplied: new Date().toISOString().split('T')[0],
        })
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const updateJobStatus = (jobId: string, newStatus: Job['status']) => {
    const updatedJobs = jobs.map(job => 
      job.id === jobId ? { 
        ...job, 
        status: newStatus, 
        dateUpdated: new Date().toISOString(),
        flag: 'update' as const  // Use 'as const' to narrow the type
      } : job
    );
    setJobs(updatedJobs);
    
    const updatedJob = updatedJobs.find(job => job.id === jobId);
    if (updatedJob) {
      updateJobDetails(updatedJob);
    }
  };

  const openJobDetails = (job: Job) => {
    setSelectedJob(job)
    setIsViewDetailsModalOpen(true)
  }

  const closeJobDetails = () => {
    setIsViewDetailsModalOpen(false)
    setSelectedJob(null)
  }

  const addNewJob = async (newJob: Job) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });

      if (!response.ok) {
        throw new Error('Failed to add new job');
      }

      const addedJob = await response.json();
      setJobs([...jobs, addedJob]);
      setIsModalOpen(false);
      toast({
        title: "Job Added",
        description: "The new job has been successfully added.",
      })
    } catch (error) {
      console.error('Error adding new job:', error);
      toast({
        title: "Error",
        description: "Failed to add the new job. Please try again.",
        variant: "destructive",
      })
    }
  };

  const updateJobDetails = async (updatedJob: Job) => {
    try {
      if (!updatedJob.id) {
        // This is a new job, so we should add it instead of updating
        await addNewJob(updatedJob);
        return;
      }

      const response = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedJob),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const result = await response.json();
      setJobs(jobs.map(job => job.id === updatedJob.id ? result : job));
      setIsModalOpen(false);
      toast({
        title: "Job Updated",
        description: "The job has been successfully updated.",
      })
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update the job. Please try again.",
        variant: "destructive",
      })
    }
  };

  // const searchHunterIoContacts = async () => {
  //   if (selectedJob) {
  //     setIsSearchingHunterIo(true)
  //     try {
  //       const results = await searchHunterIo(selectedJob.company, selectedJob.position)
  //       setHunterIoResults(results)
  //     } catch (error) {
  //       console.error('Error searching Hunter.io:', error)
  //       setHunterIoResults([])
  //     }
  //     setIsSearchingHunterIo(false)
  //   }
  // }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      (job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (job.position?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchResumes = useCallback(async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  }, []);

  const openNewJobModal = async () => {
    // Fetch the latest resumes before opening the modal
    await fetchResumes();

    const today = new Date().toISOString().split('T')[0];
    setSelectedJob({
      userId: userId || '',
      company: '',
      position: '',
      status: 'Yet to Apply',
      website: '',
      resumeLink: '',
      jobDescription: '',
      dateApplied: today,
    });
    setIsModalOpen(true);
  };

  const handleNotificationClick = () => {
    // Handle notification click
    console.log('Notification clicked')
  }

  const handleProfileClick = () => {
    // Handle profile click
    console.log('Profile clicked')
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (selectedJob) {
        setSelectedJob({...selectedJob, jobDescription: text});
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleResumeUpload = useCallback((res: any) => {
    const uploadedFile = res[0];
    console.log("Uploaded file:", uploadedFile);
    const saveResume = async (uploadedFile: any) => {
      try {
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: uploadedFile.url,
            fileId: uploadedFile.key,
            resumeId: "RESUME_" + uploadedFile.key,
            fileName: uploadedFile.name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save resume');
        }

        const data = await response.json();
        console.log('Resume saved:', data);
        
        // Update the resumes state and the selected job's resumeLink
        setResumes(prevResumes => [...prevResumes, {
          resumeId: "RESUME_" + uploadedFile.key,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name
        }]);
        if (selectedJob) {
          setSelectedJob({...selectedJob, resumeLink: uploadedFile.url});
        }
      } catch (error) {
        console.error('Error saving resume:', error);
      }
    };

    saveResume(uploadedFile);
  }, [selectedJob]);

  return (
    <>
    <Header
        user={{ name: 'John Doe' }}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
      />
      <SignedOut>
        <SignedOutCallback />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto p-4">
          
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="All">All Statuses</option>
                {jobStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-md">
                <Button
                  variant={layoutMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setLayoutMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={layoutMode === 'masonry' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setLayoutMode('masonry')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              
            </div>
          </div>

          <AnimatePresence>
            {layoutMode === 'list' ? (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id || `job-${job.company}-${job.position}`} // Add a unique key here
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobCard 
                      job={job} 
                      openJobDetails={openJobDetails} 
                      handleKeyDown={handleKeyDown} 
                      layoutMode={layoutMode} 
                      updateJobStatus={updateJobStatus}
                      updateJobDetails={updateJobDetails}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id || `job-${job.company}-${job.position}`} // Add a unique key here
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobCard 
                      job={job} 
                      openJobDetails={openJobDetails} 
                      handleKeyDown={handleKeyDown} 
                      layoutMode={layoutMode} 
                      updateJobStatus={updateJobStatus}
                      updateJobDetails={updateJobDetails}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedJob?.id ? 'Edit Job' : 'Add New Job'}</DialogTitle>
              </DialogHeader>
              {selectedJob && (
                <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div className="space-y-4 p-4">
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input 
                        id="company" 
                        value={selectedJob.company || ''} 
                        onChange={(e) => setSelectedJob({...selectedJob, company: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Position *</Label>
                      <Input 
                        id="position" 
                        value={selectedJob.position || ''} 
                        onChange={(e) => setSelectedJob({...selectedJob, position: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Company Website *</Label>
                      <Input 
                        id="website" 
                        value={selectedJob.website || ''} 
                        onChange={(e) => {
                          let trimmedWebsite = e.target.value.trim()
                            .replace(/^(https?:\/\/)?(www\.)?/, '')  // Remove http://, https://, and www.
                            .replace(/\/$/, '')  // Remove trailing slash
                            .split('/')[0];  // Keep only the domain part
                          setSelectedJob({...selectedJob, website: trimmedWebsite});
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="jobDescription">Job Description *</Label>
                      <Textarea 
                        id="jobDescription" 
                        value={selectedJob.jobDescription || ''} 
                        onChange={(e) => setSelectedJob({...selectedJob, jobDescription: e.target.value})}
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="resumeLink">Resume *</Label>
                      <Select 
                        value={selectedJob.resumeLink} 
                        onValueChange={(value) => setSelectedJob({...selectedJob, resumeLink: value})}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a resume" />
                        </SelectTrigger>
                        <SelectContent>
                          {resumes.map((resume) => (
                            <SelectItem key={resume.resumeId} value={resume.fileUrl}>
                              {resume.fileName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Upload New Resume</Label>
                      <UploadButton
                        endpoint="pdfUploader"
                        onClientUploadComplete={handleResumeUpload}
                        onUploadError={(error: Error) => {
                          console.error(error);
                          alert("Upload failed");
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateApplied">Date Applied *</Label>
                      <Input 
                        id="dateApplied" 
                        type="date" 
                        value={selectedJob.dateApplied || ''} 
                        onChange={(e) => setSelectedJob({...selectedJob, dateApplied: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <Button onClick={() => updateJobDetails(selectedJob as Job)} className="w-full">
                  {selectedJob?.id ? 'Update Job' : 'Add Job'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 text-2xl"
            onClick={openNewJobModal}
          >
            +
          </Button>

          <ViewDetailsModal
            isOpen={isViewDetailsModalOpen}
            onClose={closeJobDetails}
            job={selectedJob}
            setSelectedJob={setSelectedJob}
            setIsModalOpen={setIsModalOpen}
            updateJobDetails={updateJobDetails}
          />

          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        </div>
      </SignedIn>
    </>
  )
}

// Update JobCard component
function JobCard({ job, openJobDetails, handleKeyDown, layoutMode, updateJobStatus, updateJobDetails, sendToast=true }: { 
  job: Job, 
  openJobDetails: (job: Job) => void, 
  handleKeyDown: (e: React.KeyboardEvent, job: Job) => void, 
  layoutMode: 'list' | 'masonry', 
  updateJobStatus: (jobId: string, newStatus: Job['status']) => void,
  updateJobDetails: (job: Job) => Promise<void>,
  sendToast?: boolean
}) {
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = (newStatus: string) => {
    updateJobStatus(job.id || '', newStatus as Job['status']);
    setIsStatusSelectOpen(false);
  };

  const searchHunterDomain = async () => {
    setIsLoading(true);
    try {
      // Clean the domain from the website field
      const domain = job.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      
      const response = await fetch(`/api/hunter?domain=${domain}`);
      if (!response.ok) throw new Error('Failed to fetch Hunter data');
      
      const hunterResult = await response.json();

      console.log('Hunter Result:', hunterResult);
      
      // Update the job with Hunter data
      const updatedJob = {
        ...job,
        hunterData: {
          ...hunterResult.data,
          dateUpdated: new Date().toISOString()
        }
      };
      
      // Call the existing updateJobDetails function
      await updateJobDetails(updatedJob);
      
      
        toast({
          title: "Hunter Data Updated",
        description: `Found ${hunterResult.data.data.emails?.length || 0} email patterns for ${domain}`,
      });
    } catch (error) {
      console.error('Error fetching Hunter data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Hunter data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderHunterPreview = () => {
    if (!job.hunterData?.emails?.length) return null;

    const previewEmails = job.hunterData.emails.slice(0, 2);
    const remainingCount = Math.max(0, job.hunterData.emails.length - 2);

    return (
      <div className="space-y-2">
        {previewEmails.map((email, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{email.first_name} {email.last_name}</span>
            <Badge variant="outline" className="text-xs">
              {email.position}
            </Badge>
          </div>
        ))}
        {remainingCount > 0 && (
          <p className="text-sm text-gray-500 text-right">
            +{remainingCount} more contacts
          </p>
        )}
      </div>
    );
  };

  return (
    <Card 
      className="w-full hover:shadow-lg transition-shadow duration-300"
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, job)}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-2xl">{job.company}</span>
          <Select
            open={isStatusSelectOpen}
            onOpenChange={setIsStatusSelectOpen}
            value={job.status}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className={`w-[140px] ${getStatusColor(job.status)}`}>
              <SelectValue>{job.status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {jobStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={layoutMode === 'list' ? 'flex' : ''}>
          <div className={layoutMode === 'list' ? 'w-[70%] pr-4' : 'w-full'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4" id="job-details-section">
              <div>
                <h3 className="text-xl font-semibold">{job.position}</h3>
                <p className="text-sm text-gray-500">
                  Last updated: {job.dateUpdated ? format(new Date(job.dateUpdated), 'PPP') : 'Not available'}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {getFlagIcon(job.flag || '')}
                    </TooltipTrigger>
                    <TooltipContent>
                      {job.flag === 'no_response' ? 'No response yet' : 'Recent update'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href={job.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                <ExternalLink className="w-4 h-4 mr-1" />
                Company Website
              </a>
              <a href={job.resumeLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                <FileText className="w-4 h-4 mr-1" />
                Resume (standard)
              </a>
              <a href={job.coverLetterLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                <Mail className="w-4 h-4 mr-1" />
                Cover Letter (Ready)
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </a>
              {job.interviewDate && (
                <span className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  Interview: {job.interviewDate}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Application Progress</h4>
              <div className="flex items-center space-x-1">
                {jobStatuses.map((status, index) => {
                  const isCompleted = jobStatuses.indexOf(job.status) >= index;
                  const isCurrent = job.status === status;
                  return (
                    <div key={status} className="flex items-center">
                      {index > 0 && <div className="h-0.5 w-2 bg-gray-300"></div>}
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${isCompleted 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                          } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        {isCompleted ? (index + 1) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div 
              onClick={() => openJobDetails(job)} 
              className="w-full mt-4 cursor-pointer"
            >
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </div>
            {/* this is a comment */}
          </div>
          {layoutMode === 'list' && (
            <div className="w-[30%] pl-4 border-l" id="hunter-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Image src={hunterLogo} alt={job.company} className="w-[100px] h-auto" />
                </div>
                <div className="flex items-center">
                  {!job.hunterData && (
                    <Button
                      variant="outline"
                      size="sm" 
                      onClick={searchHunterDomain}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <FaSync className="w-4 h-4 animate-spin" />
                      ) : (
                        'Search Domain'
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {job.hunterData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Email Pattern</h4>
                    <Badge variant="secondary" className="text-xs">
                      {job.hunterData.pattern}
                    </Badge>
                  </div>
                  {renderHunterPreview()}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openJobDetails(job)}
                  >
                    View All Contacts
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No Hunter data available</p>
                  <p className="text-xs mt-1">Click search to find email patterns</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// New ViewDetailsModal component
function ViewDetailsModal({ isOpen, onClose, job, setSelectedJob, setIsModalOpen, updateJobDetails }: {
  isOpen: boolean,
  onClose: () => void,
  job: Job | null,
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  updateJobDetails: (job: Job) => void
}) {
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isJobDescriptionCollapsed, setIsJobDescriptionCollapsed] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>('details');

  if (!job) return null;

  const renderField = (label: string, value: string | number | undefined, field: keyof Job) => {
    return (
      <div className="relative group">
        <Label className="font-semibold">{label}</Label>
        {editMode ? (
          <Input
            value={value || ''}
            onChange={(e) => setSelectedJob({ ...job, [field]: e.target.value })}
            className="mt-1"
          />
        ) : (
          <p className="text-sm mt-1">{value || 'N/A'}</p>
        )}
      </div>
    );
  };

  const renderHunterTab = () => {
    if (!job.hunterData?.emails?.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          No Hunter.io data available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Email Pattern</h3>
          <Badge variant="secondary">{job.hunterData.pattern}</Badge>
        </div>
        
        <div className="space-y-4">
          {job.hunterData.emails.map((email, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {email.first_name} {email.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{email.position}</p>
                </div>
                <Badge variant="outline">{email.confidence}% confidence</Badge>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-mono">{email.value}</p>
                </div>
                {email.phone_number && (
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{email.phone_number}</p>
                  </div>
                )}
                {email.department && (
                  <div>
                    <Label>Department</Label>
                    <p className="text-sm">{email.department}</p>
                  </div>
                )}
                {email.seniority && (
                  <div>
                    <Label>Seniority</Label>
                    <p className="text-sm capitalize">{email.seniority}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                {email.linkedin && (
                  <a href={email.linkedin} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <LinkedInLogoIcon className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Button>
                  </a>
                )}
                {email.twitter && (
                  <a href={`https://twitter.com/${email.twitter}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Twitter</Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.company}</DialogTitle>
          <div className="flex space-x-4 mt-4">
            <Button
              variant={activeTab === 'details' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('details')}
            >
              Details
            </Button>
            <Button
              variant={activeTab === 'hunter' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('hunter')}
            >
              Hunter.io Data
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {renderField("Position", job.position, "position")}
                  <Badge className={`${getStatusColor(job.status)} text-sm`}>{job.status}</Badge>
                  <p className="text-sm text-gray-500">
                    Last updated: {job.dateUpdated ? format(new Date(job.dateUpdated), 'PPP') : 'Not available'}
                  </p>
                  {renderField("Website", job.website, "website")}
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Contact Information</h4>
                  {renderField("Contact Name", job.contactName, "contactName")}
                  {renderField("Contact Email", job.contactEmail, "contactEmail")}
                  {renderField("Contact Phone", job.contactPhone, "contactPhone")}
                </div>
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Job Description</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsJobDescriptionCollapsed(!isJobDescriptionCollapsed)}
                  >
                    {isJobDescriptionCollapsed ? 'Expand' : 'Collapse'}
                  </Button>
                </div>
                {!isJobDescriptionCollapsed && (
                  editMode ? (
                    <Textarea
                      value={job.jobDescription || ''}
                      onChange={(e) => setSelectedJob({ ...job, jobDescription: e.target.value })}
                      className="min-h-[100px] mt-1"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap mt-1">{job.jobDescription}</p>
                  )
                )}
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Notes</h4>
                  {!editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      Add Notes
                    </Button>
                  )}
                </div>
                {editMode ? (
                  <Textarea
                    value={job.notes || ''}
                    onChange={(e) => setSelectedJob({ ...job, notes: e.target.value })}
                    className="min-h-[100px] mt-1"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap mt-1">{job.notes || 'No notes added yet.'}</p>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Important Dates</h4>
                {renderField("Interview Date", job.interviewDate, "interviewDate")}
                {renderField("Date Applied", job.dateApplied, "dateApplied")}
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Documents</h4>
                <div className="space-y-4">
                  {job.resumeLink && (
                    <div>
                      <Label className="font-semibold">Resume</Label>
                      <embed src={job.resumeLink} type="application/pdf" width="100%" height="400px" />
                    </div>
                  )}
                  {job.coverLetterLink && (
                    <div>
                      <Label className="font-semibold">Cover Letter</Label>
                      <embed src={job.coverLetterLink} type="application/pdf" width="100%" height="400px" />
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField("Salary", job.salary, "salary")}
                  {renderField("Location", job.location, "location")}
                  {renderField("Remote Type", job.remoteType, "remoteType")}
                  {renderField("Job Type", job.jobType, "jobType")}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {renderHunterTab()}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="edit-mode">Edit Mode</Label>
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={(checked) => setEditMode(checked)}
            />
          </div>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={() => {
              onClose();
              if (job) updateJobDetails(job);
            }}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add this component at the end of the file or in a separate file
const SignedOutCallback = () => {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return null;
};

// Add this new component at the end of the file
function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [userDetails, setUserDetails] = useState({
    about: '',
  });
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const [newResumeName, setNewResumeName] = useState('');

  const handleUserDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleResumeUpload = useCallback((res: any) => {
    const uploadedFile = res[0];
    console.log("Uploaded file:", uploadedFile);
    const saveResume = async (uploadedFile: any) => {
      try {
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: uploadedFile.url,
            fileId: uploadedFile.key,
            resumeId: "RESUME_" + uploadedFile.key,
            fileName: uploadedFile.name,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save resume');
        }

        const data = await response.json();
        console.log('Resume saved:', data);
        
        // Update the resumes state immediately after successful upload
        setResumes(prevResumes => [...prevResumes, {
          resumeId: "RESUME_" + uploadedFile.key,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name
        }]);
      } catch (error) {
        console.error('Error saving resume:', error);
      }
    };

    saveResume(uploadedFile);
  }, []);

  const fetchResumes = useCallback(async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  }, []);

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setUserDetails({ about: data.about });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
    fetchUserDetails();
    
  }, [fetchResumes, fetchUserDetails]);

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDetails),
      });

      if (response.ok) {
        onClose();
      } else {
        console.error('Failed to update user details');
      }
    } catch (error) {
      console.error('Error updating user details:', error);
    }
  };

  const handleRemoveResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes?resumeId=${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchResumes();
      } else {
        console.error('Failed to remove resume');
      }
    } catch (error) {
      console.error('Error removing resume:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
              <p className="text-sm text-gray-500 mb-2">This is used to help generate more accurate cover letters and other documents.</p>
              <div className="space-y-2">
                <Textarea
                  className="min-h-[100px]"
                  name="about"
                  placeholder="About Me"
                  value={userDetails.about}
                  onChange={handleUserDetailsChange}
                />
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumes</h3>
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <div key={resume.resumeId} className="flex items-center space-x-2">
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {resume.fileName}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResume(resume.resumeId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <h2 className="text-lg font-semibold mb-2">Upload Resume</h2>
                <div className="flex items-center justify-center border border-gray-300 p-4 rounded-md">
                  <UploadButton
                    endpoint="pdfUploader"
                    onClientUploadComplete={handleResumeUpload}
                    onUploadError={(error: Error) => {
                      console.error(error);
                      alert("Upload failed");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 flex justify-end">
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

