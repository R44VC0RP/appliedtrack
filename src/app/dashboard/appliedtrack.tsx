'use client'

import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react'
import ReactConfetti from 'react-confetti';
import { SubscriptionStatus } from '../components/subscription-status';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Search, Pencil, Settings2, Check, Command } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from "@/components/ui/switch"
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from '@/components/header'
import { SignedOut } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ClearbitAutocomplete from '@/components/ui/clearbit';
import JobTitleAutocomplete from '@/components/ui/job-title-autocomplete';
import { LayoutGrid, LayoutList, Table2 } from 'lucide-react'
import { OnboardingModal } from '@/components/onboarding-modal';
import ViewDetailsModal from './viewdetails';
import KeyboardShortcut from '@/components/ui/keyboard-shortcut';
// Model Imports
import { Job, GeneratedResumeWithStatus, GeneratedCoverLetterWithStatus } from '../types/job';
import { JobStatus, RemoteType, JobType } from '@prisma/client';
import { toast } from "sonner"
import JobCard from './jobcard';
import { User } from '@prisma/client';

// Server Actions
import { srv_addJob, srv_createAIRating, srv_getJobs, srv_getResumes, srv_updateJob } from '@/app/actions/server/job-board/primary';
import { CompleteUserProfile } from '@/lib/useUser';
import { UploadButton } from "@/utils/uploadthing";
import { ConfettiWrapper } from '@/components/confetti/confetti-wrapper';

// IMPORTANT:
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

const SignedOutCallback = () => {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return null;
};




const jobStatuses = Object.values(JobStatus);

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


// ============= Constants =============
const columnDefs: ColumnDef[] = [
  { id: 'company', label: 'Company', required: true, sortable: true },
  { id: 'position', label: 'Position', sortable: true },
  { id: 'status', label: 'Status', required: true, sortable: true },
  { id: 'dateApplied', label: 'Date Applied', sortable: true },
  { id: 'updatedAt', label: 'Last Updated', sortable: true },
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
    field: "resumeUrl",
    type: "resume-date"
  }
];



// ============= Utils =============
const getStatusColor = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.YET_TO_APPLY: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case JobStatus.APPLIED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case JobStatus.PHONE_SCREEN: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case JobStatus.INTERVIEW: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case JobStatus.OFFER: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case JobStatus.REJECTED: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case JobStatus.ACCEPTED: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function jobStatusToLabel(status: JobStatus) {
  switch (status) {
    case JobStatus.YET_TO_APPLY: return 'Yet to Apply'
    case JobStatus.APPLIED: return 'Applied'
    case JobStatus.PHONE_SCREEN: return 'Phone Screen'
    case JobStatus.INTERVIEW: return 'Interview'
    case JobStatus.OFFER: return 'Offer'
    case JobStatus.REJECTED: return 'Rejected'
    case JobStatus.ACCEPTED: return 'Accepted'
    default: return 'Unknown'
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

const createEmptyJob = (userId: string, resumes: { resumeId: string; fileUrl: string; fileName: string; }[]): Job => {
  const mostRecentResume = resumes[resumes.length - 1];
  return {
    id: uuidv4(),
    userId,
    company: '',
    position: '',
    status: JobStatus.YET_TO_APPLY,
    website: null,
    jobDescription: null,
    dateApplied: new Date(),
    notes: null,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    interviewDate: null,
    salary: null,
    location: null,
    remoteType: null,
    jobType: null,
    flag: null,
    resumeUrl: mostRecentResume?.fileUrl || '',
    aiRated: false,
    aiNotes: null,
    aiRating: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    latestGeneratedResume: null,
    latestGeneratedCoverLetter: null,
    hunterCompanies: null
  };
};

export function useClientMediaQuery(query: string): boolean {
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

export function AppliedTrack({ initJobs, initResumes, onboardingComplete, role, tier, user }: { initJobs: Job[], initResumes: { resumeId: string; fileUrl: string, fileName: string }[], onboardingComplete: boolean, role: User['role'], tier: User['tier'], user: CompleteUserProfile | null }) {
  const [jobs, setJobs] = useState<Job[]>(initJobs)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [layoutMode, setLayoutMode] = useState<'list' | 'masonry' | 'table'>('list')

  useEffect(() => {
    const savedLayout = localStorage.getItem('layoutMode')
    if (savedLayout && ['list', 'masonry', 'table'].includes(savedLayout)) {
      setLayoutMode(savedLayout as 'list' | 'masonry' | 'table')
    }
  }, [])

  function saveLayoutMode(mode: 'list' | 'masonry' | 'table') {
    setLayoutMode(mode)
    localStorage.setItem('layoutMode', mode)
  }


  const [columns, setColumns] = useState(3)
  const isTablet = useClientMediaQuery('(max-width: 1024px)')
  const isMobile = useClientMediaQuery('(max-width: 640px)')
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState<boolean>(false)
  const { isLoaded, userId } = useAuth();
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>(initResumes);
  const searchParams = useSearchParams();
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columnDefs.map(col => col.id))
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>('details');
  const [showOnboarding, setShowOnboarding] = useState(!onboardingComplete);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // Move the useEffect to the top level of the component
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !userId) return;
      try {
        setShowOnboarding(!user?.onboardingComplete);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();

    const refreshedResumes = async () => {
      if (!isLoaded || !userId) return;
      try {
        const resumes = await srv_getResumes();
        setResumes(resumes);
      } catch (error) {
        console.error('Error getting resumes:', error);
      }
    };
    refreshedResumes();
    
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
        saveLayoutMode('list');
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

  function refreshResumes() {
    const refreshedResumes = async () => {
      if (!isLoaded || !userId) return;
      try {
        const resumes = await srv_getResumes();
        setResumes(resumes);
      } catch (error) {
        console.error('Error getting resumes:', error);
      }
    };
    refreshedResumes();
  }



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
        e.preventDefault();
        setSelectedJob(createEmptyJob(user?.id || '', resumes));
        setIsModalOpen(true);
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // This focuses the search box
        e.preventDefault()
        document.getElementById('searchBox')?.focus()
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, []);

  const updateJobStatus = (jobId: string, newStatus: Job['status']) => {
    const updatedJob = {
      ...jobs.find(job => job.id === jobId)!,
      status: newStatus,
      updatedAt: new Date(),
      flag: 'update' as const
    };

    setJobs(jobs.map(job => job.id === jobId ? updatedJob : job));
    updateJobDetails(updatedJob);
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
      const addNewJobToast = toast.loading("Adding new job...", {
        duration: 5000
      });
      const response = await srv_addJob(newJob);
      addNewJobToast && toast.dismiss(addNewJobToast);
      if (!response) {
        throw new Error('Failed to add new job');
      }
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      // Add type guard to check if response.data is an array
      if (Array.isArray(response.data)) {
        setJobs([...jobs, ...response.data]);
      } else if (response.data) {
        // If it's a single job, add it as a single item
        setJobs([...jobs, response.data as Job]);
      }
      setIsModalOpen(false);
      toast.success("Job Added")
    } catch (error) {
      console.error('Error adding new job:', error);
      toast.error("Failed to add the new job. Please try again.")
    }
  };



  const updateJobDetails = async (updatedJob: Job) => {
    // Store the current state of jobs for potential rollback
    const previousJobs = [...jobs];
    
    try {
      // Optimistically update the UI
      setJobs(jobs.map(job => job.id === updatedJob.id ? updatedJob : job));
      
      // Make the API call
      const response = await srv_updateJob(updatedJob);
      
      if (response) {
        // Update succeeded - show success toast
        toast.success("Job updated successfully");
        
        // Update with the server response data
        const updatedJobWithGeneratedContent: Job = {
          ...response,
          latestGeneratedResume: null,
          latestGeneratedCoverLetter: null,
          hunterCompanies: updatedJob.hunterCompanies  // Preserve Hunter data from the updated job
        };
        setJobs(jobs.map(job => job.id === updatedJob.id ? updatedJobWithGeneratedContent : job));
      } else {
        // Update failed - revert to previous state
        setJobs(previousJobs);
        toast.error("Failed to update the job. Changes have been reverted.");
      }
    } catch (error) {
      // Error occurred - revert to previous state
      setJobs(previousJobs);
      console.error('Error updating job:', error);
      toast.error("Failed to update the job. Changes have been reverted.");
    }
  };

  const handleAIRecommendation = async (job: Job) => {
    // Create a loading toast that we can update later
    const loadingToast = toast.loading("Analyzing job application...", {
      duration: 5000
    });

    try {
      const response = await srv_createAIRating(job);

      if (!response.success) {
        throw new Error('Failed to generate AI rating');
      }

      if (response.success) {
        // Update the job with AI rating data
        const updatedJob = {
          ...job,
          aiRated: true,
          aiRating: response.aiRating,
          aiNotes: response.aiNotes,
          updatedAt: new Date()
        };

        await updateJobDetails(updatedJob as Job);

        // Update the loading toast with success message
        toast.success(`Your application received a ${response.aiRating}/100 match score.`, {
          id: loadingToast, // Update the existing toast
          duration: 5000, // Keep the toast for 5 seconds
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
    const searchTermLower = searchTerm.toLowerCase();
    let filtered = jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.company?.toLowerCase().includes(searchTermLower) ||
        job.position?.toLowerCase().includes(searchTermLower) ||
        job.jobDescription?.toLowerCase().includes(searchTermLower) ||
        job.notes?.toLowerCase().includes(searchTermLower);

      let matchesStatus = true;
      if (statusFilter !== 'All') {
        matchesStatus = job.status === statusFilter;
      } else {
        matchesStatus = job.status !== JobStatus.ARCHIVED;
      }

      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating_asc':
          return (a.aiRating ?? 0) - (b.aiRating ?? 0);
        case 'rating_desc':
          return (b.aiRating ?? 0) - (a.aiRating ?? 0);
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [jobs, searchTerm, statusFilter, sortBy]);

  

  const sortedJobs = useMemo(() => {
    // console.log(filteredJobs);
    if (!sortState.column || !sortState.direction) return filteredJobs;

    return [...filteredJobs].sort((a, b) => {
      const aVal = a[sortState.column as keyof Job];
      const bVal = b[sortState.column as keyof Job];

      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredJobs, sortState]);

  // Add this helper function to check for active jobs
  const hasActiveJobs = useMemo(() => {
    // return filteredJobs.some(job => job.status !== 'Archived');
    return filteredJobs.length > 0;
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
    refreshResumes();
    // Remove confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  };

  // Check if the param celebrate is true

  return (
    <div className="dark:bg-gray-950">
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      <ConfettiWrapper />
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

      <Header />
      <SignedOut>
        <SignedOutCallback />
      </SignedOut>
      <div className="container mx-auto p-4 dark:bg-gray-950">
      {/* <SubscriptionStatus user={user as CompleteUserProfile} /> */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 mt-4">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              id="searchBox"
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="text-muted-foreground">
            You have {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </div>
          {/* Hide layout controls on mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedJob(createEmptyJob(user?.id || '', resumes));
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                Add New Job
                <KeyboardShortcut text="N" />
              </Button>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {jobStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === JobStatus.ARCHIVED
                        ? `${status} (${jobs.filter(job => job.status === JobStatus.ARCHIVED).length})`
                        : `${status} (${jobs.filter(job => job.status === status).length})`
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
                        onClick={() => saveLayoutMode('list')}
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
                        onClick={() => saveLayoutMode('masonry')}
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
                        onClick={() => saveLayoutMode('table')}
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
              <Button onClick={() => {
                setSelectedJob(createEmptyJob(user?.id || '', resumes));
                setIsModalOpen(true);
              }}><span className='flex items-center gap-2 mr-2' >Add Your First Job Application </span><KeyboardShortcut text="N" /></Button>

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
                    <TableRow >
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
                      <TableRow
                        key={job.id || `job-${job.company}-${job.position}-${job.dateApplied}`}
                      >
                        {columnDefs
                          .filter(col => visibleColumns.has(col.id))
                          .map((col) => (
                            <TableCell key={col.id}>
                              {col.id === 'status' ? (
                                <Badge className={`${getStatusColor(job.status)}`}>
                                  {job.status}
                                </Badge>
                              ) : col.id === 'dateApplied' ? (
                                job.dateApplied ? format(new Date(job.dateApplied)!, 'PP') : 'N/A'
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
                                String(job[col.id as keyof Job] || 'N/A')
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
                              <SelectTrigger className={"w-[130px] " + getStatusColor(job.status)}>
                                <SelectValue>{jobStatusToLabel(job.status)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {jobStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {jobStatusToLabel(status)}
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
                    key={job.id || `job-${job.company}-${job.position}-${job.dateApplied}-${Date.now()}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <JobCard
                      job={job as Job}
                      openJobDetails={openJobDetails}
                      handleKeyDown={handleKeyDown}
                      layoutMode={layoutMode}
                      updateJobStatus={updateJobStatus}
                      updateJobDetails={updateJobDetails}
                      setActiveTab={setActiveTab}
                      role={role}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]"
                style={{
                  columnCount: columns,
                }}
              >
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id || `job-${job.company}-${job.position}-${job.dateApplied}-${Date.now()}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="break-inside-avoid-column"
                  >
                    <JobCard
                      job={job}
                      openJobDetails={openJobDetails}
                      handleKeyDown={handleKeyDown}
                      layoutMode={layoutMode}
                      updateJobStatus={updateJobStatus}
                      updateJobDetails={updateJobDetails}
                      setActiveTab={setActiveTab}
                      role={role}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <AddJobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={addNewJob}
          resumes={resumes}
          setResumes={setResumes}
          user={user}
        />

        {/* <Button
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 text-2xl shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => {
            setSelectedJob(createEmptyJob(user?.id || '', resumes));
            setIsModalOpen(true);
          }}
        >
          +
        </Button> */}

        <ViewDetailsModal
          isOpen={isViewDetailsModalOpen}
          onClose={closeJobDetails}
          job={selectedJob as Job | null}
          setSelectedJob={setSelectedJob}
          setIsModalOpen={setIsModalOpen}
          updateJobDetails={updateJobDetails}
          activeTab={activeTab}
          handleAIRecommendation={handleAIRecommendation}
        />


      </div>
    </div>
  )
}

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Job) => void;
  resumes: { resumeId: string; fileUrl: string; fileName: string; }[];
  setResumes: (resumes: { resumeId: string; fileUrl: string; fileName: string; }[]) => void;
  user: CompleteUserProfile | null;
}

function AddJobModal({ isOpen, onClose, onSubmit, resumes, setResumes, user }: AddJobModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Job>(() => createEmptyJob(user?.id || '', resumes));


  const handleSubmit = () => {
    if (!formData.company || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
    setCurrentStep(0);
    setFormData(createEmptyJob(user?.id || '', resumes));
    onClose();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < addJobSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is not open
      if (!isOpen) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        handleBack();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, handleNext, handleBack, onClose]);

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
                    updatedAt: new Date()
                  }));
                }}
                onCustomInput={(companyName) => {
                  setFormData(prev => ({
                    ...prev,
                    company: companyName,
                    website: '', // Clear website when custom input
                    updatedAt: new Date()
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
                    className={`h-1 w-4 sm:w-8 rounded-full ${index === currentStep ? 'bg-blue-600' :
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
                    <span className="flex items-center gap-2">
                      Back <KeyboardShortcut text="left" />
                    </span>
                  </Button>
                ) : <div className="hidden sm:block sm:w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-full sm:w-1/2"
                  disabled={!formData[currentStepConfig.field]}
                >
                  <span className="flex items-center gap-2">
                    {currentStep === addJobSteps.length - 1 ? 'Add Job' : 'Next'}
                    <KeyboardShortcut text="cmd + enter" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        ) : currentStepConfig.type === 'job-title' ? (
          // Special layout for job title step
          <div className="flex flex-col h-full">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl text-center sm:text-left">
                {currentStepConfig.title}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <JobTitleAutocomplete
                placeholder={currentStepConfig.placeholder}
                value={formData.position}
                onTitleSelect={(title) => {
                  // console.log(title);
                  setFormData(prev => ({
                    ...prev,
                    position: title,
                    updatedAt: new Date()
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
                    className={`h-1 w-4 sm:w-8 rounded-full ${index === currentStep ? 'bg-blue-600' :
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
                    <span className="flex items-center gap-2">
                      Back <KeyboardShortcut text="left" />
                    </span>
                  </Button>
                ) : <div className="hidden sm:block sm:w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-full sm:w-1/2"
                  disabled={!formData[currentStepConfig.field]}
                >
                  <span className="flex items-center gap-2">
                    {currentStep === addJobSteps.length - 1 ? 'Add Job' : 'Next'}
                    <KeyboardShortcut text="cmd + enter" />
                  </span>
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
                // Click to paste button
                <>
                  <Button variant="outline" className="mb-2" onClick={() => {
                    navigator.clipboard.readText().then(text => {
                      setFormData({ ...formData, [currentStepConfig.field]: text });
                    });
                  }}>
                    Click to paste from clipboard
                  </Button>
                  <Textarea
                    placeholder={currentStepConfig.placeholder}
                    value={formData[currentStepConfig.field] as string || ''}
                    onChange={(e) => setFormData({ ...formData, [currentStepConfig.field]: e.target.value })}
                    className="min-h-[150px] sm:min-h-[200px] w-full"
                    autoFocus
                  />
                </>
              ) : currentStepConfig.type === 'resume-date' ? (
                <div className="space-y-4 w-full">
                  <div>
                    <Label htmlFor="dateApplied" className="block mb-2">Date Applied *</Label>
                    <Input
                      id="dateApplied"
                      type="date"
                      value={formData.dateApplied?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, dateApplied: new Date(e.target.value), updatedAt: new Date(e.target.value) })}
                      required
                      className="w-full"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resumeUrl" className="block mb-2">Resume *</Label>
                    <Select
                      value={formData.resumeUrl || (resumes.length > 0 ? resumes[resumes.length - 1].fileUrl : 'No Resumes Uploaded')}
                      onValueChange={(value) => setFormData({ ...formData, resumeUrl: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a resume" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[60vh] sm:max-h-[40vh]">
                        {resumes.length > 0 ? (
                          resumes.map((resume) => (
                            <SelectItem key={resume.resumeId} value={resume.fileUrl}>
                              {resume.fileName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="No Resumes Uploaded" disabled>
                            No Resumes Uploaded
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <UploadButton
                      endpoint="pdfUploader"
                      onClientUploadComplete={(data: any) => {
                        setResumes([...resumes, { resumeId: data[0].key, fileUrl: data[0].url, fileName: data[0].name }]);
                        formData.resumeUrl = data[0].url;
                      }}
                      onUploadError={(error: any) => {
                        toast.error(`Error uploading resume: ${error.message}`);
                      }}
                      className="mt-2 ut-button:w-full ut-button:h-9 ut-button:bg-secondary ut-button:hover:bg-secondary/80 ut-button:text-secondary-foreground ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-allowed-content:hidden"
                      appearance={{
                        button: "Upload New Resume"
                      }}
                    />
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
                    className={`h-1 w-4 sm:w-8 rounded-full ${index === currentStep ? 'bg-blue-600' :
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
                    <span className="flex items-center gap-2">
                      Back <KeyboardShortcut text="left" />
                    </span>
                  </Button>
                ) : <div className="hidden sm:block sm:w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-full sm:w-1/2 order-1 sm:order-2"
                  disabled={!formData[currentStepConfig.field]}
                >
                  <span className="flex items-center gap-2">
                    {currentStep === addJobSteps.length - 1 ? 'Add Job' : 'Next'}
                    <KeyboardShortcut text="cmd + enter" />
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
