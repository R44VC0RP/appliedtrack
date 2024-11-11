'use client'

import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react'
// import logo from '@/app/logos/logo.png'
import hunterLogo from '@/app/logos/hunter.png'
import ReactConfetti from 'react-confetti';
import { UploadButton } from "@/utils/uploadthing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Mail, Calendar, Phone, Search, User, Clipboard, Pencil, Settings, Archive, Settings2, Download, Loader2, Sparkles, Check, Bot, Users, Globe2 } from 'lucide-react'
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
  SignedOut
} from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs';
import { OurFileRouter } from "@/app/api/uploadthing/core";
// import { useToast } from "@/hooks/use-toast"
import { FaSync } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FaTable } from 'react-icons/fa'
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ClearbitAutocomplete from '@/components/ui/clearbit';
import JobTitleAutocomplete from '@/components/ui/job-title-autocomplete';
import { Checkbox } from "@/components/ui/checkbox"
import { LayoutGrid, LayoutList, Table2 } from 'lucide-react'
import { OnboardingModal } from '@/components/onboarding-modal';
import { auth } from '@clerk/nextjs/server';
import { userInfo } from 'os';

// Model Imports
import { IJob as Job } from '@/models/Job';
import { JobStatus } from '@/models/Job';
import { toast } from "sonner"

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Job status options
// const jobStatuses = ['Yet to Apply', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Archived']
const jobStatuses = Object.values(JobStatus);
// Define types for job data
// interface Job {
//   id?: string;
//   userId: string;
//   company: string;
//   position: string;
//   status: 'Yet to Apply' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted' | 'Archived';
//   website: string;
//   resumeLink: string;
//   jobDescription: string;
//   dateApplied: string;
//   // Add other fields as needed, but keep them optional
//   coverLetterLink?: string;
//   notes?: string;
//   contactName?: string;
//   contactEmail?: string;
//   contactPhone?: string;
//   interviewDate?: string;
//   salary?: number;
//   location?: string;
//   remoteType?: 'On-site' | 'Remote' | 'Hybrid';
//   jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
//   dateCreated?: string;
//   dateUpdated?: string;
//   flag?: 'no_response' | 'update' | string;
//   hunterData?: {
//     domain: string;
//     pattern?: string;
//     organization?: string;
//     emails?: HunterEmail[];
//     dateUpdated?: string;
//     meta?: {
//       results: number;
//       limit: number;
//       offset: number;
//       params: {
//         domain: string;
//         [key: string]: any;
//       };
//     };
//   };
//   isArchived?: boolean;
//   coverLetter?: {
//     url: string;
//     status: 'generating' | 'ready' | 'failed' | 'not_started';
//     dateGenerated?: string;
//   };
//   aiRated: boolean,
//   aiNotes: string,
//   aiRating: number,
// }

// ============= Types & Interfaces =============
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: keyof Job | null;
  direction: SortDirection;
}

interface ColumnDef {
  id: keyof Job;
  label: string;
  required?: boolean;
  sortable?: boolean;
  render?: (job: Job) => React.ReactNode;
}

type AddJobStep = {
  title: string;
  field: keyof Job;
  type: 'text' | 'url' | 'textarea' | 'resume-date' | 'clearbit' | 'job-title';
  placeholder?: string;
};

// Hunter.io categories for the hunter.io search
type HunterCategory = 'executive' | 'it' | 'finance' | 'management' | 'sales' | 'legal' | 'support' | 'hr' | 'marketing' | 'communication' | 'education' | 'design' | 'health' | 'operations';

// ============= Constants =============
const columnDefs: ColumnDef[] = [
  { id: 'company', label: 'Company', required: true, sortable: true },
  { id: 'position', label: 'Position', sortable: true },
  { id: 'status', label: 'Status', required: true, sortable: true },
  { id: 'dateApplied', label: 'Date Applied', sortable: true },
  { id: 'dateUpdated', label: 'Last Updated', sortable: true },
  // Add more columns as needed
];

const addJobSteps: AddJobStep[] = [
  {
    title: "What company are you applying to?",
    field: "company",
    type: "clearbit",
    placeholder: "Search for company..."
  },
  {
    title: "What's the company's website?",
    field: "website",
    type: "url",
    placeholder: "Enter company website"
  },
  {
    title: "What position are you applying for?",
    field: "position",
    type: "job-title",
    placeholder: "Search for position title..."
  },
  {
    title: "Paste the job description",
    field: "jobDescription",
    type: "textarea",
    placeholder: "Paste job description here, this will help us generate a cover letter and draft an email to the hiring manager."
  },
  {
    title: "Select resume and confirm date",
    field: "resumeLink",
    type: "resume-date"
  }
];

const hunterCategories: { value: HunterCategory; label: string }[] = [
  { value: 'executive', label: 'Executive' },
  { value: 'it', label: 'IT' },
  { value: 'finance', label: 'Finance' },
  { value: 'management', label: 'Management' },
  { value: 'sales', label: 'Sales' },
  { value: 'legal', label: 'Legal' },
  { value: 'support', label: 'Support' },
  { value: 'hr', label: 'HR' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'communication', label: 'Communication' },
  { value: 'education', label: 'Education' },
  { value: 'design', label: 'Design' },
  { value: 'health', label: 'Health' },
  { value: 'operations', label: 'Operations' }
];

// ============= Utils =============
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

const getUserInformation = async () => {
  const response = await fetch('/api/user');
  if (response.ok) {
    return await response.json();
  }
  return null;
}

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

const getInitialSortPreference = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jobSortPreference') || 'newest';
  }
  return 'newest';
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 640;
};



const generateCoverLetter = async (
  job: Job,
  setIsGenerating: Dispatch<SetStateAction<"generating" | "ready" | "failed" | "not_started">>
) => {
  try {
    const response = await fetch('/api/genai', {
      method: 'POST',
      body: JSON.stringify({ job, action: 'cover-letter' }),
    });

    const data = await response.json();

    if (data.success) {
      // Update to match the server's expected structure
      const response_update = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: job.id,
          coverLetter: {
            url: data.data.pdfUrl,  // This is what we receive from genai
            status: 'ready',
            dateGenerated: new Date().toISOString(),
            dateUpdated: new Date().toISOString()  // Add this to track updates
          }
        }),
      });

      if (!response_update.ok) {
        throw new Error('Failed to update job with cover letter');
      }

      setIsGenerating("ready");
    }
  } catch (error) {
    console.error('Error generating cover letter:', error);
    setIsGenerating("failed");
  }
};


//#region ============= Custom Hooks =============
function useClientMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [query]);

  // Return false during SSR, actual value after mounting
  return mounted ? matches : false;
}

export function AppliedTrack() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  // const [hunterIoResults, setHunterIoResults] = useState<HunterIoResult[]>([])
  // const [isSearchingHunterIo, setIsSearchingHunterIo] = useState<boolean>(false)
  const [layoutMode, setLayoutMode] = useState<'list' | 'masonry' | 'table'>('list')
  const [columns, setColumns] = useState(3)
  // const containerRef = useRef<HTMLDivElement>(null)
  const isTablet = useClientMediaQuery('(max-width: 1024px)')
  const isMobile = useClientMediaQuery('(max-width: 640px)')
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState<boolean>(false)
  const { isLoaded, userId } = useAuth();
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const searchParams = useSearchParams();
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Job>>(
    new Set(columnDefs.map(col => col.id))
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>('details');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // Move the useEffect to the top level of the component
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !userId) return;

      try {
        const data = await getUserInformation();
        setShowOnboarding(!data.onBoardingComplete);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, userId]); // Add dependencies

  // Add useEffect to handle localStorage
  useEffect(() => {
    const savedPreference = getInitialSortPreference();
    setSortBy(savedPreference);
  }, []);

  // Add mounting state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateLayout = () => {
      if (isMobile) {
        setLayoutMode('list');
        setColumns(1);
      } else if (isTablet) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [isMobile, isTablet, mounted]);


  useEffect(() => {
    if (isLoaded && userId) {
      // console.log("Fetching jobs");
      fetch('/api/jobs')
        .then(response => response.json())
        .then(data => {
          // console.log("Jobs fetched:", data);
          setJobs(data)
        })
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
      toast("Subscription Upgraded!", {
        description: `Thanks for upgrading to ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier.`
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
          status: JobStatus.YET_TO_APPLY,
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
          aiRated: false,
          aiNotes: '',
          aiRating: 0,
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
      toast.success("Job Added")
    } catch (error) {
      console.error('Error adding new job:', error);
      toast.error("Failed to add the new job. Please try again.")
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
      // console.log("There are ", jobs.length, " jobs");
      setJobs(jobs.map(job => job.id === updatedJob.id ? result : job));
      setIsModalOpen(false);
      // toast({
      //   title: "Job Updated",
      //   description: "The job has been successfully updated.",
      // })
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error("Failed to update the job. Please try again.")
    }
  };

  const handleAIRecommendation = async (job: Job) => {
    // Create a loading toast that we can update later
    const loadingToast = toast.loading("Analyzing job application...", {
      duration: Infinity // Keep the toast until we dismiss it
    });
  
    try {
      const response = await fetch('/api/genai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job, action: 'ai-rating' }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate AI rating');
      }
  
      const data = await response.json();
  
      if (data.success) {
        // Update the job with AI rating data
        const updatedJob = {
          ...job,
          aiRated: true,
          aiRating: data.data.aiRating,
          aiNotes: data.data.aiNotes,
          dateUpdated: new Date().toISOString()
        };
  
        await updateJobDetails(updatedJob);
  
        // Update the loading toast with success message
        toast.success(`Your application received a ${data.data.aiRating}/100 match score.`, {
          id: loadingToast, // Update the existing toast then dismiss it after 5 seconds
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error generating AI rating:', error);
      // Update the loading toast with error message
      toast.error("Failed to analyze application. Please try again.", {
        id: loadingToast, // Update the existing toast then dismiss it after 5 seconds
        duration: 5000
      });
    }
  };


  const filteredJobs = useMemo(() => {
    // console.log("Filtering jobs with status:", statusFilter);
    // console.log("Current jobs:", jobs);

    let filtered = jobs.filter(job => {
      // Search term filter
      const matchesSearch =
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.position?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Archived') {
          matchesStatus = !!job.isArchived;
        } else {
          matchesStatus = job.status === statusFilter && !job.isArchived;
        }
      } else {
        // When "All" is selected, show all non-archived jobs
        matchesStatus = !job.isArchived;
      }

      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating_asc':
          return a.aiRating - b.aiRating;
        case 'rating_desc':
          return b.aiRating - a.aiRating;
        case 'newest':
          return new Date(b.dateCreated || '').getTime() - new Date(a.dateCreated || '').getTime();
        case 'oldest':
          return new Date(a.dateCreated || '').getTime() - new Date(b.dateCreated || '').getTime();
        case 'updated':
          return new Date(b.dateUpdated || '').getTime() - new Date(a.dateUpdated || '').getTime();
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'status':
          return jobStatuses.indexOf(a.status) - jobStatuses.indexOf(b.status);
        default:
          return 0;
      }
    });
  }, [jobs, searchTerm, statusFilter, sortBy]);

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
    await fetchResumes();
    setIsModalOpen(true);
  };

  const handleNotificationClick = () => {
    // Handle notification click
    // console.log('Notification clicked')
  }

  const handleProfileClick = () => {
    // Handle profile click
    // console.log('Profile clicked')
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (selectedJob) {
        setSelectedJob({ ...selectedJob, jobDescription: text });
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleResumeUpload = useCallback((res: any) => {
    const uploadedFile = res[0];
    // console.log("Uploaded file:", uploadedFile);
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
        // console.log('Resume saved:', data);

        // Update the resumes state and the selected job's resumeLink
        setResumes(prevResumes => [...prevResumes, {
          resumeId: "RESUME_" + uploadedFile.key,
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name
        }]);
        if (selectedJob) {
          setSelectedJob({ ...selectedJob, resumeLink: uploadedFile.url });
        }
      } catch (error) {
        console.error('Error saving resume:', error);
      }
    };

    saveResume(uploadedFile);
  }, [selectedJob]);

  const sortedJobs = useMemo(() => {
    // console.log(filteredJobs);
    if (!sortState.column || !sortState.direction) return filteredJobs;

    return [...filteredJobs].sort((a, b) => {
      const aVal = a[sortState.column!];
      const bVal = b[sortState.column!];

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredJobs, sortState]);

  // Add this helper function to check for active jobs
  const hasActiveJobs = useMemo(() => {
    return filteredJobs.some(job => !job.isArchived);
  }, [filteredJobs]);

  // Return null or loading state during SSR
  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-muted-foreground">Booting up...</p>
        </div>
      </div>
    );
  }

  // Update the onboarding completion handler
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowConfetti(true);
    setShowWelcomeModal(true);
    // Remove confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      {showOnboarding && (
        <OnboardingModal 
          isOpen={showOnboarding} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
            Welcome to AppliedTrack! {'\u{1F389}'}
            </DialogTitle>
            <DialogDescription className="text-center">
              Your job search journey starts here. Let's help you land your dream job!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-4 text-center">
            <p className="text-muted-foreground">
              Here's what you can do next:
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Add your first job application
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Track application statuses
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Generate AI-powered cover letters
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button 
              className="w-full"
              onClick={() => setShowWelcomeModal(false)}
            >
              Let's Get Started!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Header
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
      />
      <SignedOut>
        <SignedOutCallback />
      </SignedOut>
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
            {/* Hide layout controls on mobile */}
            {!isMobile && (
              <div className="flex items-center space-x-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {jobStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'Archived'
                          ? `${status} (${jobs.filter(job => job.isArchived === true).length})`
                          : `${status} (${jobs.filter(job => job.status === status && !job.isArchived).length})`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('jobSortPreference', value);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Most Recently Added</SelectItem>
                    <SelectItem value="rating_asc">Lowest Match</SelectItem>
                    <SelectItem value="rating_desc">Highest Match</SelectItem>
                    <SelectItem value="oldest">Least Recently Added</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="company">Company Name</SelectItem>
                    <SelectItem value="status">Application Status</SelectItem>
                    
                  </SelectContent>
                </Select>

                <div className="bg-background border rounded-lg p-1 flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutMode === 'list' ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setLayoutMode('list')}
                          className="h-8 w-8"
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>List View</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutMode === 'masonry' ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setLayoutMode('masonry')}
                          className="h-8 w-8"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Grid View</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutMode === 'table' ? 'default' : 'ghost'}
                          size="icon"
                          onClick={() => setLayoutMode('table')}
                          className="h-8 w-8"
                        >
                          <Table2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Table View</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>

          {!hasActiveJobs ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
              <div className="text-center space-y-4 max-w-lg">
                <h2 className="text-2xl font-bold text-foreground">Start Tracking Your Job Applications</h2>
                <p className="text-muted-foreground">
                  Keep track of your job applications, manage contacts, and never miss an opportunity.
                  Click the + button to add your first job application or click here to add your first job application.

                </p>
                <Button onClick={openNewJobModal}>Add Your First Job Application</Button>

              </div>
            </div>
          ) : (
            <AnimatePresence>
              {layoutMode === 'table' ? (
                <div className="w-full">
                  <div className="flex justify-end mb-4">
                    <Dialog open={showColumnSelector} onOpenChange={setShowColumnSelector}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          Configure Columns
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Visible Columns</DialogTitle>
                          <DialogDescription>
                            Select which columns you want to display in the table.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {columnDefs.map((col) => (
                            <div key={col.id} className="flex items-center space-x-2">
                              <Switch
                                id={`col-${col.id}`}
                                checked={visibleColumns.has(col.id)}
                                disabled={col.required}
                                onCheckedChange={(checked) => {
                                  setVisibleColumns(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(col.id);
                                    } else if (!col.required) {
                                      next.delete(col.id);
                                    }
                                    return next;
                                  });
                                }}
                              />
                              <Label htmlFor={`col-${col.id}`} className="flex-1">
                                {col.label}
                                {col.required && (
                                  <span className="ml-2 text-xs text-gray-500">(Required)</span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columnDefs
                          .filter(col => visibleColumns.has(col.id))
                          .map((col) => (
                            <TableHead
                              key={col.id}
                              className={col.sortable ? 'cursor-pointer select-none hover:bg-gray-50' : ''}
                              onClick={() => {
                                if (!col.sortable) return;
                                setSortState(prev => ({
                                  column: col.id,
                                  direction:
                                    prev.column === col.id
                                      ? prev.direction === 'asc'
                                        ? 'desc'
                                        : prev.direction === 'desc'
                                          ? null
                                          : 'asc'
                                      : 'asc'
                                }));
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {col.label}
                                {col.sortable && (
                                  <span className="text-gray-400">
                                    {sortState.column === col.id ? (
                                      sortState.direction === 'asc' ? (
                                        <FaSortUp className="text-blue-500" />
                                      ) : sortState.direction === 'desc' ? (
                                        <FaSortDown className="text-blue-500" />
                                      ) : (
                                        <FaSort />
                                      )
                                    ) : (
                                      <FaSort />
                                    )}
                                  </span>
                                )}
                              </div>
                            </TableHead>
                          ))}
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedJobs.map((job) => (
                        <TableRow key={job.id}>
                          {columnDefs
                            .filter(col => visibleColumns.has(col.id))
                            .map((col) => (
                              <TableCell key={col.id}>
                                {col.id === 'status' ? (
                                  <Badge className={`${getStatusColor(job.status)}`}>
                                    {job.status}
                                  </Badge>
                                ) : col.id === 'dateApplied' || col.id === 'dateUpdated' ? (
                                  job[col.id] ? format(new Date(job[col.id]!), 'PP') : 'N/A'
                                ) : col.id === 'contactName' ? (
                                  <div className="flex flex-col">
                                    <span>{job.contactName || 'N/A'}</span>
                                    {job.contactEmail && (
                                      <a href={`mailto:${job.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                                        {job.contactEmail}
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  String(job[col.id] || 'N/A')
                                )}
                              </TableCell>
                            ))}
                          <TableCell>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openJobDetails(job)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Select
                                value={job.status}
                                onValueChange={(value) => updateJobStatus(job.id || '', value as Job['status'])}
                              >
                                <SelectTrigger className="w-[130px]">
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : layoutMode === 'list' ? (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job.id || `job-${job.company}-${job.position}`}
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
                        setActiveTab={setActiveTab}
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
                      key={job.id || `job-${job.company}-${job.position}`}
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
                        setActiveTab={setActiveTab}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <SteppedAddJobModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={addNewJob}
            resumes={resumes}
          />

          <Button
            className="fixed bottom-4 right-4 rounded-full w-12 h-12 text-2xl shadow-lg hover:shadow-xl transition-shadow"
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
            activeTab={activeTab}
            handleAIRecommendation={handleAIRecommendation}
          />

          
        </div>
    </>
  )
}

//#endregion

//#region ============= Small Components =============
const SignedOutCallback = () => {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return null;
};



const CoverLetterButton = ({ job }: { job: Job }) => {
  const [isGenerating, setIsGenerating] = useState<"generating" | "ready" | "failed" | "not_started">(job.coverLetter?.status || "not_started");
  const [resumeUrl, setResumeUrl] = useState(job.resumeLink);
  const [coverLetterUrl, setCoverLetterUrl] = useState(job.coverLetter?.url);

  // if (job.coverLetter?.status === 'ready') {
  //   setIsGenerating("ready");
  // }

  if (!job.coverLetter) {
    return null;
  }

  switch (isGenerating) {
    case 'generating':
      return (
        <Button variant="outline" size="sm" disabled className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating Cover Letter...
        </Button>
      );

    case 'ready':
      return (
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100"
          onClick={async () => {
            try {
              // Fetch the PDF file
              const response = await fetch(coverLetterUrl || '');
              const blob = await response.blob();

              // Create a temporary URL for the blob
              const url = window.URL.createObjectURL(blob);

              // Create a temporary anchor element
              const link = document.createElement('a');
              link.href = url;
              link.download = `${job.company.replace(/\s+/g, '_')}_coverletter.pdf`;

              // Append to document, click, and cleanup
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Revoke the temporary URL
              window.URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Error downloading cover letter:', error);
              toast.error("Failed to download the cover letter. Please try again.")
            }
          }}
        >
          <Download className="w-4 h-4" />
          <span>Download Cover Letter</span>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </Button>
      );

    case 'failed':
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600"
          onClick={() => {
            setIsGenerating("generating");
            generateCoverLetter(job, setIsGenerating);
          }}
        >
          <>
            <AlertCircle className="h-4 w-4" />
            Generation Failed - Retry
          </>
        </Button>
      );

    case 'not_started':
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            setIsGenerating("generating");
            generateCoverLetter(job, setIsGenerating);
          }}
        >

          <>
            <Sparkles className="h-4 w-4" />
            Generate Cover Letter
          </>

        </Button>
      );

    default:
      return null;
  }
};

// ============= Card Components =============
function JobCard({
  job,
  openJobDetails,
  handleKeyDown,
  layoutMode,
  updateJobStatus,
  updateJobDetails,
  setActiveTab  // Add this prop
}: {
  job: Job;
  openJobDetails: (job: Job) => void;
  handleKeyDown: (e: React.KeyboardEvent, job: Job) => void;
  layoutMode: 'list' | 'masonry' | 'table';
  updateJobStatus: (jobId: string, newStatus: Job['status']) => void;
  updateJobDetails: (job: Job) => Promise<void>;
  setActiveTab: (tab: 'details' | 'hunter') => void;  // Add this type
}) {
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  // const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<Set<HunterCategory>>(new Set());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    updateJobStatus(job.id || '', newStatus as Job['status']);
    setIsStatusSelectOpen(false);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const domain = job.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

      // Updated API call with new parameters
      const response = await fetch(`/api/hunter?action=domainSearch&domain=${domain}&departments=${Array.from(selectedCategories).join(',')}&limit=10`);

      if (!response.ok) throw new Error('Failed to fetch Hunter data');

      const hunterResult = await response.json();

      // console.log(hunterResult.data.data.data);

      // Update the job with the hunter data
      const updatedJob = {
        ...job,
        hunterData: {
          ...hunterResult.data.data.data,
          dateUpdated: new Date().toISOString()
        }
      };

      await updateJobDetails(updatedJob);

      toast.success("Hunter Data Updated", {
        description: `Found ${hunterResult.data.data.data.emails?.length || 0} email patterns for ${domain}`
      });

      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error fetching Hunter data:', error);
      toast.error("Failed to fetch Hunter data. Please check the domain and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const searchHunterDomain = () => {
    setIsCategoryModalOpen(true);
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {email.position}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {email.confidence}%
              </Badge>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              openJobDetails(job);
              setIsCategoryModalOpen(true);
            }}
            className="w-full text-right text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            +{remainingCount} more contacts
          </button>
        )}
      </div>
    );
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...job,
          isArchived: true,
          dateUpdated: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to archive job');

      // Call the parent's updateJobDetails to refresh the UI
      const updatedJob = await response.json();
      updateJobDetails(updatedJob);

      toast.success("Job Archived", {
        description: "The job has been successfully archived"
      });
    } catch (error) {
      console.error('Error archiving job:', error);
      toast.error("Failed to archive the job. Please try again.");
    }
  };

  // Add new state for quick notes
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNote, setQuickNote] = useState(job.notes || '');

  const handleQuickNoteSubmit = () => {
    if (quickNote.trim()) {
      const updatedJob = {
        ...job,
        notes: job.notes ? `${job.notes}\n\n${quickNote}` : quickNote,
        dateUpdated: new Date().toISOString()
      };
      updateJobDetails(updatedJob);
      setQuickNote('');
      setShowQuickNote(false);
    }
  };

  // Replace useMediaQuery with useClientMediaQuery
  const isMobile = useClientMediaQuery('(max-width: 640px)');

  const [isConfirmStatusChangeOpen, setIsConfirmStatusChangeOpen] = useState(false);

  // Add useEffect to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during SSR or before mounting
  if (!mounted) return null;

  if (isMobile) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{job.company}</h3>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">{job.position}</p>
                <Badge variant="outline" className="text-xs">
                  {job.aiRating ? `${job.aiRating}% Match` : 'No AI Rating'}
                </Badge>
              </div>
              
            </div>
            
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => openJobDetails(job)}
            >
              <Pencil className="w-4 h-4" />
              Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowQuickNote(!showQuickNote)}
            >
              <FileText className="w-4 h-4" />
              Quick Note
            </Button>
            <Select
              value={job.status}
              onValueChange={(value) => updateJobStatus(job.id || '', value as Job['status'])}
              
            >
              <SelectTrigger className={`w-fill ${getStatusColor(job.status)}`}>
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
          </div>

          {showQuickNote && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Add a quick note..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="text-sm"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickNote(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleQuickNoteSubmit}
                >
                  Save Note
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Last updated: {job.dateUpdated ? format(new Date(job.dateUpdated), 'PP') : 'N/A'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Return existing desktop card layout
  return (
    <Card
      className="w-full hover:shadow-lg transition-shadow duration-300"
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, job)}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-2xl">{job.company}</span>
          <div className="flex items-center gap-2">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Job</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to archive this job application for {job.company}?
                          This will remove it from your active applications list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Archive
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Archive Job</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={layoutMode === 'list' ? 'flex' : ''}>
          <div className={layoutMode === 'list' ? 'w-[70%] pr-4' : 'w-full'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4" id="job-details-section">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{job.position}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-sm ${
                      job.aiRating 
                        ? job.aiRating >= 80
                          ? 'bg-green-100 text-green-800'
                          : job.aiRating >= 60
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        : ''
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {job.aiRating ? `${job.aiRating}% Match` : 'No AI Rating'}
                  </Badge>
                </div>
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
            <div className="flex flex-wrap gap-2">
              {/* <a href={job.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                <ExternalLink className="w-4 h-4 mr-1" />
                {job.website}
              </a> */}
              {/* <a href={job.resumeLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-600 hover:underline">
                <FileText className="w-4 h-4 mr-1" />
                Resume
              </a> */}
              <CoverLetterButton job={job} />

            </div>

            {job.interviewDate && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  Interview: {format(new Date(job.interviewDate), 'PPP')}
                </span>
              </div>
            )}
            <div className="inline-flex flex-wrap gap-2 mt-2 items-center">
              <div className="flex gap-2 mt-2 w-full">
                <Dialog open={isConfirmStatusChangeOpen} onOpenChange={setIsConfirmStatusChangeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex-1">
                      {job.status === 'Yet to Apply' && 'Mark Applied'}
                      {job.status === 'Applied' && 'Got a phone follow up?'}
                      {job.status === 'Phone Screen' && 'Start Interview'}
                      {job.status === 'Interview' && 'Got Offer'}
                      {job.status === 'Offer' && 'Finalize'}
                      {job.status === 'Rejected' && 'Archive'}
                      {job.status === 'Accepted' && 'Archive'}
                      {job.status === 'Archived' && 'Restore'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Status</DialogTitle>
                      <DialogDescription>
                        {job.status === 'Yet to Apply' && 'Mark this application as submitted?'}
                        {job.status === 'Applied' && 'Moving to phone screening phase?'}
                        {job.status === 'Phone Screen' && 'Moving to interview phase?'}
                        {job.status === 'Interview' && 'Received job offer?'}
                        {job.status === 'Offer' && 'Ready to mark as accepted/rejected?'}
                        {job.status === 'Rejected' && 'Archive this application?'}
                        {job.status === 'Accepted' && 'Archive this application?'}
                        {job.status === 'Archived' && 'Restore this application?'}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsConfirmStatusChangeOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          const currentStatusIndex = jobStatuses.indexOf(job.status);
                          const nextStatusIndex = (currentStatusIndex + 1) % jobStatuses.length;
                          updateJobStatus(job.id || '', jobStatuses[nextStatusIndex] as Job['status']);
                          // Close modal logic
                          setIsConfirmStatusChangeOpen(false);
                        }}
                      >
                        Confirm
                      </Button>

                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => openJobDetails(job)}
                >
                  View Details
                </Button>
              </div>
            </div>
            
          </div>
          {layoutMode === 'list' && (
            <div className="w-[30%] pl-4 border-l" id="hunter-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Image src={hunterLogo} alt={job.company} className="w-[100px] h-auto" />
                </div>
                <div className="flex items-center">
                  {!job.hunterData && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCategoryModalOpen(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <FaSync className="w-4 h-4 animate-spin" />
                        ) : (
                          'Find Emails'
                        )}
                      </Button>

                      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Select Department Categories</DialogTitle>
                            <DialogDescription>
                              Choose the departments you want to search for contacts.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${job.id}-all-categories`}
                                checked={selectedCategories.size === hunterCategories.length}
                                onCheckedChange={() => setSelectedCategories(new Set(hunterCategories.map(c => c.value)))}
                              />
                              <Label htmlFor={`${job.id}-all-categories`}>Select All</Label>
                            </div>
                            {hunterCategories.map((category) => (
                              <div key={category.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${job.id}-${category.value}`}
                                  checked={selectedCategories.has(category.value)}
                                  onCheckedChange={(checked) => {
                                    setSelectedCategories(prev => {
                                      const next = new Set(prev);
                                      if (checked) {
                                        next.add(category.value);
                                      } else {
                                        next.delete(category.value);
                                      }
                                      return next;
                                    });
                                  }}
                                />
                                <Label
                                  htmlFor={`${job.id}-${category.value}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {category.label}
                                </Label>
                              </div>
                            ))}
                          </div>

                          <DialogFooter className="sm:justify-between">
                            <Button
                              variant="ghost"
                              onClick={() => setIsCategoryModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSearch}
                              disabled={selectedCategories.size === 0 || isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <FaSync className="w-4 h-4 animate-spin mr-2" />
                                  Searching...
                                </>
                              ) : (
                                'Search Selected Categories'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
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

// ============= Modal Components =============
function SteppedAddJobModal({ isOpen, onClose, onSubmit, resumes }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Job) => void;
  resumes: { resumeId: string; fileUrl: string; fileName: string; }[];
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Job>>({
    dateApplied: new Date().toISOString().split('T')[0],
    status: JobStatus.YET_TO_APPLY,
    company: '',
    position: '',
    website: '',
    jobDescription: '',
    resumeLink: '',
    userId: '',
    dateUpdated: new Date().toISOString()
  });

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNext = () => {
    const currentField = addJobSteps[currentStep].field;

    // Special validation for company step
    if (currentField === 'company' && !formData.company) {
      toast.error("Please select a company from the suggestions");
      return;
    }

    if (!formData[currentField]) {
      toast.error(`Please fill in the ${addJobSteps[currentStep].title.toLowerCase()}`);
      return;
    }

    if (currentStep < addJobSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!formData.company || !formData.position) {
      toast.error("Company name and position are required.");
      return;
    }

    onSubmit(formData as Job);
    setCurrentStep(0);
    setFormData({
      dateApplied: new Date().toISOString().split('T')[0],
      status: JobStatus.YET_TO_APPLY,
      company: '',
      position: '',
      website: '',
      jobDescription: '',
      resumeLink: '',
      userId: '',
      dateUpdated: new Date().toISOString()
    });
    onClose();
  };

  const currentStepConfig = addJobSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        sm:max-w-md 
        w-[95vw] 
        sm:w-[45vw] 
        max-h-[90vh]
        ${currentStepConfig.type === 'clearbit' ? 'h-fit' : 'h-fit'} 
        p-4 
        sm:p-6
      `}>
        {currentStepConfig.type === 'clearbit' ? (
          // Special layout for Clearbit step
          <div className="flex flex-col h-full">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl text-center sm:text-left">
                {currentStepConfig.title}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <ClearbitAutocomplete
                placeholder={currentStepConfig.placeholder}
                onCompanySelect={(company) => {
                  console.log(company);
                  setFormData(prev => ({
                    ...prev,
                    company: company.name,
                    website: `https://${company.domain}`,
                    dateUpdated: new Date().toISOString()
                  }));
                }}
                onCustomInput={(companyName) => {
                  setFormData(prev => ({
                    ...prev,
                    company: companyName,
                    website: '', // Clear website when custom input
                    dateUpdated: new Date().toISOString()
                  }));
                }}
                className="w-full p-2"
              />
            </div>

            <div className="mt-auto pt-4">
              {/* Progress indicators */}
              <div className="flex gap-1 justify-center mb-4">
                {addJobSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-4 sm:w-8 rounded-full ${
                      index === currentStep ? 'bg-blue-600' :
                      index < currentStep ? 'bg-blue-200' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:w-1/2"
                  >
                    Back
                  </Button>
                ) : <div className="hidden sm:block sm:w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-full sm:w-1/2"
                  disabled={!formData[currentStepConfig.field]}
                >
                  {currentStep === addJobSteps.length - 1 ? 'Add Job' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Original layout for other steps
          <>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl text-center sm:text-left">
                {currentStepConfig.title}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              {currentStepConfig.type === 'textarea' ? (
                <Textarea
                  placeholder={currentStepConfig.placeholder}
                  value={formData[currentStepConfig.field] as string || ''}
                  onChange={(e) => setFormData({ ...formData, [currentStepConfig.field]: e.target.value })}
                  className="min-h-[150px] sm:min-h-[200px] w-full"
                />
              ) : currentStepConfig.type === 'resume-date' ? (
                <div className="space-y-4 w-full">
                  <div>
                    <Label htmlFor="dateApplied" className="block mb-2">Date Applied *</Label>
                    <Input
                      id="dateApplied"
                      type="date"
                      value={formData.dateApplied || ''}
                      onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resumeLink" className="block mb-2">Resume *</Label>
                    <Select
                      value={formData.resumeLink}
                      onValueChange={(value) => setFormData({ ...formData, resumeLink: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a resume" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[60vh] sm:max-h-[40vh]">
                        {resumes.map((resume) => (
                          <SelectItem key={resume.resumeId} value={resume.fileUrl}>
                            {resume.fileName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <Input
                  type={currentStepConfig.type}
                  placeholder={currentStepConfig.placeholder}
                  value={formData[currentStepConfig.field] as string || ''}
                  onChange={(e) => setFormData({ ...formData, [currentStepConfig.field]: e.target.value })}
                  className="w-full"
                  autoFocus
                />
              )}
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {/* Progress indicators */}
              <div className="flex gap-1 justify-center">
                {addJobSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-4 sm:w-8 rounded-full ${
                      index === currentStep ? 'bg-blue-600' :
                      index < currentStep ? 'bg-blue-200' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-2 mt-2">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="w-full sm:w-1/2 order-2 sm:order-1"
                  >
                    Back
                  </Button>
                ) : <div className="hidden sm:block sm:w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-full sm:w-1/2 order-1 sm:order-2"
                  disabled={!formData[currentStepConfig.field]}
                >
                  {currentStep === addJobSteps.length - 1 ? 'Add Job' : 'Next'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ViewDetailsModal({ isOpen, onClose, job, setSelectedJob, setIsModalOpen, updateJobDetails, activeTab: initialActiveTab, handleAIRecommendation }: {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateJobDetails: (job: Job) => void;
  activeTab?: 'details' | 'hunter';  // Add this type
  handleAIRecommendation: (job: Job) => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>(initialActiveTab || 'details');
  const [editingField, setEditingField] = useState<keyof Job | null>(null);
  const [isJobDescriptionCollapsed, setIsJobDescriptionCollapsed] = useState<boolean>(true);
  
  // Add this useEffect to update the selected job when the job prop changes
  useEffect(() => {
    if (job) {
      setSelectedJob(job);
    }
  }, [job, setSelectedJob]);

  // Add a wrapper function for handleAIRecommendation
  const handleAIAnalysis = async () => {
    if (!job) return;
    
    await handleAIRecommendation(job);
    // After AI recommendation is complete, fetch the latest job data
    try {
      const response = await fetch(`/api/jobs/${job.id}`);
      if (response.ok) {
        const updatedJob = await response.json();
        setSelectedJob(updatedJob);
      }
    } catch (error) {
      console.error('Error fetching updated job details:', error);
    }
  };

  if (!job) return null;

  const renderField = (label: string, value: string | number | undefined, field: keyof Job) => {
    const isEditing = editingField === field;

    return (
      <div className="relative group">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">{label}</Label>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditingField(isEditing ? null : field)}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        </div>
        {isEditing ? (
          field === 'position' ? (
            <JobTitleAutocomplete
              placeholder="Search for position title..."
              onTitleSelect={(title) => {
                setSelectedJob({ ...job!, position: title });
                setEditingField(null);
              }}
              className="mt-1"
            />
          ) : field === 'interviewDate' || field === 'dateApplied' ? (
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => setSelectedJob({ ...job!, [field]: e.target.value })}
              className="mt-1"
              onBlur={() => setEditingField(null)}
            />
          ) : (
            <Input
              value={value || ''}
              onChange={(e) => setSelectedJob({ ...job!, [field]: e.target.value })}
              className="mt-1"
              onBlur={() => setEditingField(null)}
            />
          )
        ) : (
          <p className="text-sm mt-1">
            {field === 'interviewDate' || field === 'dateApplied'
              ? value
                ? format(new Date(value), 'PP')
                : 'N/A'
              : value || 'N/A'}
          </p>
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
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg">
      <ScrollArea className="flex-grow ">
        <DialogHeader className="p-3 sm:p-6 pb-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 border-bottom-rounded">
          <div className="space-y-3 sm:space-y-4">
            {/* Company and Position Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mt-2 sm:mt-4">
              <div className="space-y-1 sm:space-y-2 w-full sm:w-auto">
                <DialogTitle className="text-xl sm:text-3xl font-bold break-words">
                  {job?.company}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg text-muted-foreground">{job?.position}</h2>
                  <Badge className={`${getStatusColor(job.status)}`}>
                    {job.status}
                  </Badge>
                </div>
              </div>
              <a
                href={job.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <Globe2 className="h-4 w-4" />
                Visit Website
              </a>
            </div>

            {/* AI Button - Make it full width on mobile */}
            <Button 
              onClick={handleAIAnalysis}
              disabled={!job || job.aiRated}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {job?.aiRated ? (
                <>
                  <Bot className="h-4 w-4" />
                  AI Score: {job.aiRating}% Match
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get AI Recommendation
                </>
              )}
            </Button>

            {/* AI Recommendation Card - Adjust padding for mobile */}
            {job.aiRating && (
              <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-900/20 dark:to-blue-900/20 border-none">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-1 hidden sm:block">
                      <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                        AI Recommendation
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </h3>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        <p>Based on your profile and this job's requirements, you have a <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.aiRating}% match</span> for this position.</p>
                        {job.aiNotes && (
                          <div className="mt-2" dangerouslySetInnerHTML={{ __html: job.aiNotes }} />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab Navigation - Make it scroll horizontally on mobile */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mt-2 sm:mt-4 -mx-3 sm:mx-0 px-3 sm:px-0">
              <Button
                variant={activeTab === 'details' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('details')}
                className="whitespace-nowrap flex-shrink-0"
              >
                <FileText className="h-4 w-4 mr-2" />
                Details
              </Button>
              <Button
                variant={activeTab === 'hunter' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('hunter')}
                className="whitespace-nowrap flex-shrink-0"
              >
                <Users className="h-4 w-4 mr-2" />
                Contacts Found
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 sm:p-6">
          <div className="py-3 sm:py-4">
            {activeTab === 'details' ? (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Job Description</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsJobDescriptionCollapsed(!isJobDescriptionCollapsed)}
                      >
                        {isJobDescriptionCollapsed ? 'Show More' : 'Show Less'}
                      </Button>
                      {editingField === 'jobDescription' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingField(null)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingField('jobDescription')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {editingField === 'jobDescription' ? (
                    <Textarea
                      value={job.jobDescription || ''}
                      onChange={(e) => setSelectedJob({ ...job, jobDescription: e.target.value })}
                      className="min-h-[200px]"
                    />
                  ) : (
                    <div className={`relative ${isJobDescriptionCollapsed ? 'max-h-[100px]' : 'max-h-none'} overflow-hidden`}>
                      <p className="text-sm whitespace-pre-wrap">{job.jobDescription}</p>
                      {isJobDescriptionCollapsed && job.jobDescription && job.jobDescription.length > 300 && (
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
                      )}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Notes</h4>
                    {editingField === 'notes' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingField(null)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingField('notes')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {editingField === 'notes' ? (
                    <Textarea
                      value={job.notes || ''}
                      onChange={(e) => setSelectedJob({ ...job, notes: e.target.value })}
                      className="min-h-[100px] sm:min-h-[200px]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderField("Salary", job.salary, "salary")}
                    {renderField("Location", job.location, "location")}
                    {renderField("Remote Type", job.remoteType, "remoteType")}
                    {renderField("Job Type", job.jobType, "jobType")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-6">
                {renderHunterTab()}
              </div>
            )}
          </div>
        </div>
        </ScrollArea>

        {/* Footer Buttons - Stack on mobile */}
        <div className="p-3 sm:p-6 border-t">
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                if (job) updateJobDetails(job);
              }}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

