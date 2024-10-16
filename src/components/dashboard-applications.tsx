'use client'

import { useState, useEffect, useRef } from 'react'
import logo from '@/app/logos/logo.png'
import hunterLogo from '@/app/logos/hunter.png'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Mail, Briefcase, Calendar, Phone, ChevronLeft, ChevronRight, Search, User, Linkedin, Bell, UserCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from "@/components/ui/switch"
import Masonry from 'react-masonry-css'
import { FaThLarge, FaList } from 'react-icons/fa'
import { useMediaQuery } from 'react-responsive'
import Image from 'next/image'
import { List, Grid } from 'lucide-react'
import { LinkedInLogoIcon } from '@radix-ui/react-icons'
import { Separator } from "@/components/ui/separator"
import { format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from '@/components/header'

// Job status options
const jobStatuses = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Accepted']

// Define types for job data
interface Job {
  id: number;
  company: string;
  position: string;
  status: string;
  website: string;
  resumeLink: string;
  coverLetterLink: string;
  jobDescription: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  interviewDate: string;
  lastUpdated: string;
  flag: string;
}

// Define types for Hunter.io search results
interface HunterIoResult {
  name: string;
  email: string;
  position: string;
}

// Sample job data (expanded)
const initialJobs: Job[] = [
  {
    id: 1,
    company: 'TechNova Solutions',
    position: 'Senior Frontend Developer',
    status: 'Applied',
    website: 'https://technovasolutions.com',
    resumeLink: '/resumes/frontend_dev_resume.pdf',
    coverLetterLink: '/cover_letters/technova_cover_letter.pdf',
    jobDescription: 'TechNova is seeking an experienced frontend developer to lead our UI/UX team in creating innovative web applications...',
    notes: 'Applied through their careers portal. Emphasized experience with React and TypeScript.',
    contactName: 'Sarah Johnson',
    contactEmail: 'sjohnson@technovasolutions.com',
    contactPhone: '(555) 123-4567',
    interviewDate: '2023-07-15',
    lastUpdated: '2023-07-01',
    flag: 'no_response'
  },
  {
    id: 2,
    company: 'DataSphere Analytics',
    position: 'Data Engineer',
    status: 'Phone Screen',
    website: 'https://datasphereanaly.com',
    resumeLink: '/resumes/data_engineer_resume.pdf',
    coverLetterLink: '/cover_letters/datasphere_cover_letter.pdf',
    jobDescription: 'Join our data engineering team to build scalable data pipelines and optimize our big data infrastructure...',
    notes: 'Phone screen scheduled with the hiring manager. Prepare to discuss experience with Apache Spark and AWS.',
    contactName: 'Michael Chen',
    contactEmail: 'mchen@datasphereanaly.com',
    contactPhone: '(555) 987-6543',
    interviewDate: '2023-07-10',
    lastUpdated: '2023-07-05',
    flag: 'update'
  },
  {
    id: 3,
    company: 'GreenTech Innovations',
    position: 'Full Stack Developer',
    status: 'Interview',
    website: 'https://greentechinno.com',
    resumeLink: '/resumes/fullstack_dev_resume.pdf',
    coverLetterLink: '/cover_letters/greentech_cover_letter.pdf',
    jobDescription: 'GreenTech is looking for a versatile full stack developer to help build our next-generation sustainable energy management platform...',
    notes: 'Second round interview scheduled. Will involve a technical assessment and meeting with the team.',
    contactName: 'Emily Rodriguez',
    contactEmail: 'erodriguez@greentechinno.com',
    contactPhone: '(555) 246-8135',
    interviewDate: '2023-07-20',
    lastUpdated: '2023-07-12',
    flag: 'update'
  },
  {
    id: 4,
    company: 'CloudSecure Systems',
    position: 'DevOps Engineer',
    status: 'Applied',
    website: 'https://cloudsecuresys.com',
    resumeLink: '/resumes/devops_engineer_resume.pdf',
    coverLetterLink: '/cover_letters/cloudsecure_cover_letter.pdf',
    jobDescription: 'We are seeking a skilled DevOps engineer to enhance our cloud infrastructure and implement robust security measures...',
    notes: 'Submitted application online. Highlighted experience with Kubernetes and CI/CD pipelines.',
    contactName: 'Alex Thompson',
    contactEmail: 'athompson@cloudsecuresys.com',
    contactPhone: '(555) 369-2580',
    interviewDate: '',
    lastUpdated: '2023-07-08',
    flag: 'no_response'
  },
  {
    id: 5,
    company: 'QuantumAI Research',
    position: 'Machine Learning Engineer',
    status: 'Offer',
    website: 'https://quantu',
    resumeLink: '/path/to/resume5.pdf',
    coverLetterLink: '/path/to/coverletter5.pdf',
    jobDescription: 'Join our cutting-edge AI team...',
    notes: 'Received offer, negotiating salary',
    contactName: 'Eva Brown',
    contactEmail: 'eva@aiinnovations.com',
    contactPhone: '(333) 444-5555',
    interviewDate: '2023-06-05',
    lastUpdated: '2023-06-18',
    flag: 'update'
  },
]

// Placeholder function for hunter.io API call
const searchHunterIo = async (company: string, position: string): Promise<HunterIoResult[]> => {
  // This would be replaced with an actual API call to hunter.io
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  return [
    { name: 'John Smith', email: 'john.smith@' + company.toLowerCase() + '.com', position: 'HR Manager' },
    { name: 'Jane Doe', email: 'jane.doe@' + company.toLowerCase() + '.com', position: 'Talent Acquisition Specialist' },
    { name: 'Mike Johnson', email: 'mike.johnson@' + company.toLowerCase() + '.com', position: 'Department Head' },
  ];
};

// Move getStatusColor function outside of the main component
const getStatusColor = (status: string): string => {
  switch (status) {
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

export function JobTrack() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [hunterIoResults, setHunterIoResults] = useState<HunterIoResult[]>([])
  const [isSearchingHunterIo, setIsSearchingHunterIo] = useState<boolean>(false)
  const [layoutMode, setLayoutMode] = useState<'list' | 'masonry'>('list')
  const [columns, setColumns] = useState(3)
  const containerRef = useRef<HTMLDivElement>(null)
  const isTablet = useMediaQuery({ maxWidth: 1024 })
  const isMobile = useMediaQuery({ maxWidth: 640 })
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState<boolean>(false)

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

  const handleKeyDown = (e: React.KeyboardEvent, job: Job) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const currentStatusIndex = jobStatuses.indexOf(job.status)
      const newStatusIndex = e.key === 'ArrowLeft' 
        ? (currentStatusIndex - 1 + jobStatuses.length) % jobStatuses.length
        : (currentStatusIndex + 1) % jobStatuses.length
      updateJobStatus(job.id, jobStatuses[newStatusIndex])
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'n') {
        e.preventDefault()
        // Open modal to add new job
        setSelectedJob({
          id: Date.now(),
          company: '',
          position: '',
          status: 'Applied',
          website: '',
          resumeLink: '',
          coverLetterLink: '',
          jobDescription: '',
          notes: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          interviewDate: '',
          lastUpdated: new Date().toISOString().split('T')[0],
          flag: ''
        })
        setIsModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const updateJobStatus = (jobId: number, newStatus: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : job
    ))
  }

  const openJobDetails = (job: Job) => {
    setSelectedJob(job)
    setIsViewDetailsModalOpen(true)
  }

  const closeJobDetails = () => {
    setIsViewDetailsModalOpen(false)
    setSelectedJob(null)
  }

  const updateJobDetails = (updatedJob: Job) => {
    if (updatedJob.id) {
      setJobs(jobs.map(job => job.id === updatedJob.id ? updatedJob : job))
    } else {
      setJobs([...jobs, { ...updatedJob, id: Date.now() }])
    }
    closeJobDetails()
  }

  const searchHunterIoContacts = async () => {
    if (selectedJob) {
      setIsSearchingHunterIo(true)
      try {
        const results = await searchHunterIo(selectedJob.company, selectedJob.position)
        setHunterIoResults(results)
      } catch (error) {
        console.error('Error searching Hunter.io:', error)
        setHunterIoResults([])
      }
      setIsSearchingHunterIo(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openNewJobModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedJob({
      id: Date.now(),
      company: '',
      position: '',
      status: 'Applied',
      website: '',
      resumeLink: '',
      coverLetterLink: '',
      jobDescription: '',
      notes: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      interviewDate: '',
      lastUpdated: today,
      flag: ''
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

  return (
    <>
    <Header
        user={{ name: 'John Doe' }}
        onNotificationClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
      />
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
                key={job.id}
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
                key={job.id}
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
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedJob && selectedJob.id ? 'Edit Job Details' : 'Add New Job'}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4">
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
                  <Label htmlFor="website">Company Website *</Label>
                  <Input 
                    id="website" 
                    value={selectedJob.website || ''} 
                    onChange={(e) => setSelectedJob({...selectedJob, website: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jobDescription">Job Description *</Label>
                  <Textarea 
                    id="jobDescription" 
                    value={selectedJob.jobDescription || ''} 
                    onChange={(e) => setSelectedJob({...selectedJob, jobDescription: e.target.value})}
                    className="min-h-[200px]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="resumeLink">Resume Used *</Label>
                  <Input 
                    id="resumeLink" 
                    value={selectedJob.resumeLink || ''} 
                    onChange={(e) => setSelectedJob({...selectedJob, resumeLink: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateApplied">Date Applied *</Label>
                  <Input 
                    id="dateApplied" 
                    type="date" 
                    value={selectedJob.lastUpdated || ''} 
                    onChange={(e) => setSelectedJob({...selectedJob, lastUpdated: e.target.value})}
                    required
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <div className="p-4">
            <Button onClick={() => updateJobDetails(selectedJob as Job)} className="w-full">
              {selectedJob && selectedJob.id ? 'Save Changes' : 'Add Job'}
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
        updateJobDetails={updateJobDetails}
        setSelectedJob={setSelectedJob}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
    </>
  )
}

// Update JobCard component
function JobCard({ job, openJobDetails, handleKeyDown, layoutMode, updateJobStatus }: { 
  job: Job, 
  openJobDetails: (job: Job) => void, 
  handleKeyDown: (e: React.KeyboardEvent, job: Job) => void, 
  layoutMode: 'list' | 'masonry', 
  updateJobStatus: (jobId: number, newStatus: string) => void 
}) {
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    updateJobStatus(job.id, newStatus);
    setIsStatusSelectOpen(false);
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
                <p className="text-sm text-gray-500">Last updated: {job.lastUpdated}</p>
              </div>
              <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {getFlagIcon(job.flag)}
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
            
          </div>
          {layoutMode === 'list' && (
            <div className="w-[30%] pl-4 border-l" id="hunter-section">
              <Image src={hunterLogo} alt={job.company} className="w-[100px] h-auto" />
              <h4 className="font-semibold mb-2">Contacts Found</h4>
              {job.contactName && (
                <p className="text-sm">
                  <LinkedInLogoIcon className="inline w-4 h-4 mr-1" />
                  {job.contactName}
                </p>
              )}
              {job.contactEmail && (
                <p className="text-sm">
                  <Mail className="inline w-4 h-4 mr-1" />
                  {job.contactEmail}
                </p>
              )}
              
              
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// New ViewDetailsModal component
function ViewDetailsModal({ isOpen, onClose, job, updateJobDetails, setSelectedJob, setIsModalOpen }: {
  isOpen: boolean,
  onClose: () => void,
  job: Job | null,
  updateJobDetails: (updatedJob: Job) => void,
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  if (!job) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job.company}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{job.position}</h3>
                <Badge className={`${getStatusColor(job.status)} text-sm`}>{job.status}</Badge>
                <p className="text-sm text-gray-500">Last updated: {format(new Date(job.lastUpdated), 'PPP')}</p>
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4" />
                  <a href={job.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Company Website
                  </a>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Contact Information</h4>
                {job.contactName && (
                  <p className="text-sm flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {job.contactName}
                  </p>
                )}
                {job.contactEmail && (
                  <p className="text-sm flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {job.contactEmail}
                  </p>
                )}
                {job.contactPhone && (
                  <p className="text-sm flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {job.contactPhone}
                  </p>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Job Description</h4>
              <p className="text-sm whitespace-pre-wrap">{job.jobDescription}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Important Dates</h4>
              {job.interviewDate && (
                <p className="text-sm flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Interview: {format(new Date(job.interviewDate), 'PPP')}
                </p>
              )}
              <p className="text-sm flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Applied: {format(new Date(job.lastUpdated), 'PPP')}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Documents</h4>
              <div className="flex space-x-4">
                <a href={job.resumeLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Resume
                </a>
                <a href={job.coverLetterLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Cover Letter
                </a>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => {
            onClose()
            setSelectedJob(job)
            setIsModalOpen(true)
          }}>
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}