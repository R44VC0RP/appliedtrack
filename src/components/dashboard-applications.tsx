'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
// import logo from '@/app/logos/logo.png'
import hunterLogo from '@/app/logos/hunter.png'
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
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Mail, Calendar, Phone, Search, User, Clipboard, Pencil, Settings, Archive, Settings2, Download, Loader2, Sparkles } from 'lucide-react'
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

// Define types for Hunter.io email data
interface HunterEmail {
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
}

// Job status options
const jobStatuses = ['Yet to Apply', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Archived']

// Define types for job data
interface Job {
  id?: string;
  userId: string;
  company: string;
  position: string;
  status: 'Yet to Apply' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted' | 'Archived';
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
  dateCreated?: string;
  dateUpdated?: string;
  flag?: 'no_response' | 'update' | string;
  hunterData?: {
    domain: string;
    pattern?: string;
    organization?: string;
    emails?: HunterEmail[];
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
}

// Define types for Hunter.io search results
interface HunterIoResult {
  name: string;
  email: string;
  position: string;
}

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

const generateCoverLetter = async (job: Job, setIsGenerating: (isGenerating: string) => void) => {
  try {
    const response = await fetch('/api/genai', {
      method: 'POST',
      body: JSON.stringify({ job }),
    });

    const data = await response.json();
    console.log('data', data);
    
    if (data.success) {
      setIsGenerating("ready");
      const response_update = await fetch(`/api/jobs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: job.id,
          coverLetter: {
            ...data.coverLetterData,
            status: 'ready',
            dateGenerated: new Date().toISOString()
          }
        }),
      });
      // update the local job with the cover letter data  
      
      

      if (!response_update.ok) {
        throw new Error('Failed to update job with cover letter');
      }
    }
  } catch (error) {
    console.error('Error generating cover letter:', error);
    setIsGenerating("failed");
  }
};

// ============= Custom Hooks =============
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);
  const { toast } = useToast()
  const searchParams = useSearchParams();
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof Job>>(
    new Set(columnDefs.map(col => col.id))
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>('details');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Move the useEffect to the top level of the component
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !userId) return;

      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setShowOnboarding(!data.onBoardingComplete);
        }
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
      // console.log("There are ", jobs.length, " jobs");
      setJobs(jobs.map(job => job.id === updatedJob.id ? result : job));
      setIsModalOpen(false);
      // toast({
      //   title: "Job Updated",
      //   description: "The job has been successfully updated.",
      // })
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update the job. Please try again.",
        variant: "destructive",
      })
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

  return (
    <>
      {showOnboarding && <OnboardingModal isOpen={showOnboarding} />}
      <Header
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

// ============= Small Components =============
const SignedOutCallback = () => {
  useEffect(() => {
    window.location.href = "/";
  }, []);
  return null;
};

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

const CoverLetterButton = ({ job }: { job: Job }) => {
  const [isGenerating, setIsGenerating] = useState("not_started");
  const [resumeUrl, setResumeUrl] = useState(job.resumeLink);

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
        <a
          href={job.coverLetter.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-blue-600 hover:underline"
        >
          <Download className="w-4 h-4 mr-1" />
          Download Cover Letter
          <CheckCircle2 className="w-4 h-4 ml-1 text-green-500" />
        </a>
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
  const { toast } = useToast();
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

      toast({
        title: "Hunter Data Updated",
        description: `Found ${hunterResult.data.data.data.emails?.length || 0} email patterns for ${domain}`,
      });

      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error fetching Hunter data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Hunter data. Please check the domain and try again.",
        variant: "destructive",
      });
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

      toast({
        title: "Job Archived",
        description: "The job has been successfully archived.",
      });
    } catch (error) {
      console.error('Error archiving job:', error);
      toast({
        title: "Error",
        description: "Failed to archive the job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add new state for quick notes
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNote, setQuickNote] = useState('');

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
              <p className="text-sm text-gray-600">{job.position}</p>
            </div>
            <Select
              value={job.status}
              onValueChange={(value) => updateJobStatus(job.id || '', value as Job['status'])}
            >
              <SelectTrigger className={`w-[130px] ${getStatusColor(job.status)}`}>
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

          <div className="mt-4 flex flex-wrap gap-2">
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
                      <span className="inline-block"> {/* Use span instead of div for inline elements */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-100 hover:text-red-600 transition-colors"

                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </span>
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
              <CoverLetterButton job={job} />
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
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Job>>({
    dateApplied: new Date().toISOString().split('T')[0],
    status: 'Yet to Apply',
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
      toast({
        title: "Required Field",
        description: "Please select a company from the suggestions",
        variant: "destructive",
      });
      return;
    }

    if (!formData[currentField]) {
      toast({
        title: "Required Field",
        description: `Please fill in the ${addJobSteps[currentStep].title.toLowerCase()}`,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Company name and position are required.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData as Job);
    setCurrentStep(0);
    setFormData({
      dateApplied: new Date().toISOString().split('T')[0],
      status: 'Yet to Apply',
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
      <DialogContent className={`sm:max-w-md w-[45vw] ${currentStepConfig.type === 'clearbit' ? 'h-fit  ' : 'h-fit'} p-4 sm:p-6`} >
        {currentStepConfig.type === 'clearbit' ? (
          // Special layout for Clearbit step
          <div className="flex flex-col h-full">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl">
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
                    className={`h-1 w-8 rounded-full ${index === currentStep ? 'bg-blue-600' :
                      index < currentStep ? 'bg-blue-200' : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between gap-2">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="w-1/2"
                  >
                    Back
                  </Button>
                ) : <div className="w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-1/2"
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
              <DialogTitle className="text-xl sm:text-2xl">
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
                      <SelectContent className="max-h-[40vh]">
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
                    className={`h-1 w-8 rounded-full ${index === currentStep ? 'bg-blue-600' :
                      index < currentStep ? 'bg-blue-200' : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between gap-2 mt-2">
                {currentStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="w-1/2"
                  >
                    Back
                  </Button>
                ) : <div className="w-1/2" />}

                <Button
                  onClick={handleNext}
                  className="w-1/2"
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

function ViewDetailsModal({ isOpen, onClose, job, setSelectedJob, setIsModalOpen, updateJobDetails, activeTab: initialActiveTab }: {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  updateJobDetails: (job: Job) => void;
  activeTab?: 'details' | 'hunter';  // Add this type
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'hunter'>(initialActiveTab || 'details');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isJobDescriptionCollapsed, setIsJobDescriptionCollapsed] = useState<boolean>(true);

  if (!job) return null;

  const renderField = (label: string, value: string | number | undefined, field: keyof Job) => {
    return (
      <div className="relative group">
        <Label className="font-semibold">{label}</Label>
        {editMode ? (
          field === 'position' ? (
            <JobTitleAutocomplete
              placeholder="Search for position title..."
              onTitleSelect={(title) => setSelectedJob({ ...job!, position: title })}
              className="mt-1"
            />
          ) : field === 'interviewDate' || field === 'dateApplied' ? (
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => setSelectedJob({ ...job!, [field]: e.target.value })}
              className="mt-1"
            />
          ) : (
            <Input
              value={value || ''}
              onChange={(e) => setSelectedJob({ ...job!, [field]: e.target.value })}
              className="mt-1"
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
      <DialogContent className="w-[95vw] sm:max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold">{job?.company}</DialogTitle>
          <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
            <Button
              variant={activeTab === 'details' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('details')}
              className="whitespace-nowrap"
            >
              Details
            </Button>
            <Button
              variant={activeTab === 'hunter' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('hunter')}
              className="whitespace-nowrap"
            >
              Contacts Found
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow px-4 sm:px-6">
          <div className="py-4">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                        className="min-h-[100px] sm:min-h-[200px]"
                      />
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{job.jobDescription}</p>
                      </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    {renderField("Salary", job.salary, "salary")}
                    {renderField("Location", job.location, "location")}
                    {renderField("Remote Type", job.remoteType, "remoteType")}
                    {renderField("Job Type", job.jobType, "jobType")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6">
                {renderHunterTab()}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-mode">Edit Mode</Label>
              <Switch
                id="edit-mode"
                checked={editMode}
                onCheckedChange={(checked) => setEditMode(checked)}
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  if (job) updateJobDetails(job);
                }}
                className="flex-1 sm:flex-none"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

