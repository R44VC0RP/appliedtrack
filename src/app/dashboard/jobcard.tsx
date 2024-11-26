'use client'

import React from 'react';
import { Job, GeneratedResumeWithStatus, GeneratedCoverLetterWithStatus } from '../types/job';
import { JobStatus, RemoteType } from '@prisma/client';
import hunterLogo from '@/app/logos/hunter.png'
import Image from 'next/image'
import { User } from '@prisma/client';
import { useState, useEffect } from 'react';
import { toast } from "sonner"
import { jobStatusToLabel, useClientMediaQuery } from './appliedtrack';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, FileText, Archive } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider, Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Dispatch, SetStateAction } from 'react';
import { Loader2, Download, CheckCircle2, AlertCircle, Sparkles, Clock, Calendar } from 'lucide-react';
import { FaSync } from 'react-icons/fa';
import { AlertDialogTrigger, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { srv_archiveJob, srv_hunterDomainSearch, srv_getJob } from '../actions/server/job-board/primary';
import { ImageWithFallback } from '@/components/ui/clearbit';
import { devLog } from '@/lib/devLog';
import { srv_generateGPTResume, srv_markdownToPDF } from '@/lib/genai/useGenAI';

const hunterCategories: { value: string; label: string }[] = [
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

// type HunterCategory = 'executive' | 'it' | 'finance' | 'management' | 'sales' | 'legal' | 'support' | 'hr' | 'marketing' | 'communication' | 'education' | 'design' | 'health' | 'operations';

const getStatusColor = (status: string): string => {
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

const jobStatuses = Object.values(JobStatus);

const generateResume = async (
    job: Job,
    setIsGenerating: Dispatch<SetStateAction<"generating" | "ready" | "failed" | "not_started">>,
    updateJobDetails: (updatedJob: Job) => Promise<void>
) => {
    // try {
    //     // const response = await fetch('/api/genai', {
    //     //     method: 'POST',
    //     //     body: JSON.stringify({ job, action: 'resume' }),
    //     // });

    //     const response = await srv_generateResume(job);

    //     // const data = await response.json();

    //     if (response.success) {
    //         // Update job with generated resume
    //         await updateJobDetails({
    //             ...job,
    //             resumeGenerated: { url: response.pdfUrl || '', status: 'ready', dateGenerated: new Date().toISOString() }
    //         });

    //         toast.success("Resume generated successfully");

    //         setIsGenerating("ready");
    //     }
    // } catch (error) {
    //     console.error('Error generating resume:', error);
    //     setIsGenerating("failed");
    // }
    alert("Feature coming soon")
};

const generateCoverLetter = async (
    job: Job,
    setIsGenerating: Dispatch<SetStateAction<"generating" | "ready" | "failed" | "not_started">>,
    updateJobDetails: (updatedJob: Job) => Promise<void>
) => {
    // try {
    //     const response = await fetch('/api/genai', {
    //         method: 'POST',
    //         body: JSON.stringify({ job, action: 'cover-letter' }),
    //     });

    //     const data = await response.json();

    //     if (data.success) {
    //         // Update the local job with cover letter data
    //         await updateJobDetails({
    //             ...job,
    //             coverLetter: { url: data.data.pdfUrl, status: 'ready', dateGenerated: new Date().toISOString() }
    //         });

    //         toast.success("Cover letter generated successfully");

    //         setIsGenerating("ready");
    //     }
    // } catch (error) {
    //     console.error('Error generating cover letter:', error);
    //     setIsGenerating("failed");
    // }
    alert("Feature coming soon")
};

const ResumeButton = ({ job, updateJobDetails }: { job: Job, updateJobDetails: (updatedJob: Job) => Promise<void> }) => {
    const [isGenerating, setIsGenerating] = useState<"generating" | "ready" | "failed" | "not_started">(
        job.latestGeneratedResume ? "ready" : "not_started"
    );
    const [resumeId, setResumeId] = useState(job.latestGeneratedResume?.id);

    const handleViewResume = async () => {
        const pdfUrl = await srv_markdownToPDF(resumeId || '');
        window.open(pdfUrl, '_blank');
    }

    const handleGenerateResume = async () => {
        setIsGenerating("generating");
        try {
            const result = await srv_generateGPTResume(job);
            if (result?.success) {
                // Fetch the updated job to get the new generated resume
                const updatedJob = await srv_getJob(job.id);
                if (updatedJob) {
                    setResumeId(result.resumeId);
                    await updateJobDetails(updatedJob as Job);
                    setIsGenerating("ready");
                    window.dispatchEvent(new Event('quotaUpdate'));
                }
            } else {
                setIsGenerating("failed");
                toast.error(result.error);
            }
        } catch (error) {
            devLog.error('Error generating resume:', error);
            setIsGenerating("failed");
        }
    };

    switch (isGenerating) {
        case 'generating':
            return (
                <Button variant="outline" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating
                </Button>
            );
        case 'ready':
            return (
                <Button variant="outline" onClick={handleViewResume}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume <code className="text-xs ml-2">{resumeId}</code>
                </Button>
            );
        case 'failed':
            return (
                <Button variant="outline" onClick={handleGenerateResume}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            );
        default:
            return (
                <Button variant="outline" onClick={handleGenerateResume}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Resume
                </Button>
            );
    }
};

const CoverLetterButton = ({ job, updateJobDetails }: { job: Job, updateJobDetails: (updatedJob: Job) => Promise<void> }) => {
    const [isGenerating, setIsGenerating] = useState<"generating" | "ready" | "failed" | "not_started">(
        job.latestGeneratedCoverLetter ? "ready" : "not_started"
    );

    const handleGenerateCoverLetter = async () => {
        setIsGenerating("generating");
        try {
            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobId: job.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate cover letter');
            }

            const updatedJob = await response.json();
            setIsGenerating("ready");
            await updateJobDetails(updatedJob);
            window.dispatchEvent(new Event('quotaUpdate')); // Add this line
        } catch (error) {
            devLog.error('Error generating cover letter:', error);
            setIsGenerating("failed");
        }
    };

    switch (isGenerating) {
        case 'generating':
            return (
                <Button variant="outline" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating
                </Button>
            );
        case 'ready':
            return (
                <Button variant="outline" onClick={() => window.open(job.latestGeneratedCoverLetter?.coverLetterMarkdown, '_blank')}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Cover Letter
                </Button>
            );
        case 'failed':
            return (
                <Button variant="outline" onClick={handleGenerateCoverLetter}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Retry
                </Button>
            );
        default:
            return (
                <Button variant="outline" onClick={handleGenerateCoverLetter}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                </Button>
            );
    }
};

const JobCard = React.forwardRef(({
    job,
    openJobDetails,
    handleKeyDown,
    layoutMode,
    updateJobStatus,
    updateJobDetails,
    setActiveTab,  // Add this prop
    role
}: {
    job: Job;
    openJobDetails: (job: Job) => void;
    handleKeyDown: (e: React.KeyboardEvent, job: Job) => void;
    layoutMode: 'list' | 'masonry' | 'table';
    updateJobStatus: (jobId: string, newStatus: Job['status']) => void;
    updateJobDetails: (job: Job) => Promise<void>;
    setActiveTab: (tab: 'details' | 'hunter') => void;  // Add this type
    role: User['role']
}, ref) => {
    const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [showQuickNote, setShowQuickNote] = useState(false);
    const [quickNote, setQuickNote] = useState(job.notes || '');
    const isMobile = useClientMediaQuery('(max-width: 640px)');
    const [isConfirmStatusChangeOpen, setIsConfirmStatusChangeOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleStatusChange = (newStatus: string) => {
        updateJobStatus(job.id || '', newStatus as Job['status']);
        setIsStatusSelectOpen(false);
    };

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const domain = job.website?.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

            if (!domain) {
                setIsLoading(false);
                toast.error("Please enter a valid domain.");
                return;
            }

            // Updated API call with new parameters
            console.log(Array.from(selectedCategories));
            const { success, data, total_results, quotaExceeded, error } = await srv_hunterDomainSearch(domain, Array.from(selectedCategories), 10, job.id);

            if (quotaExceeded) {
                setIsLoading(false);
                toast.error(error);
                return;
            }

            if (!success) {
                setIsLoading(false);
                toast.error(data);
                return;
            }

            // The hunterCompanies will be updated automatically by the server
            // We just need to refresh the job data
            if (updateJobDetails) {
                const updatedJob: Job = {
                    ...job,
                    hunterCompanies: [{
                        id: data.data.id,
                        jobId: job.id,
                        userId: job.userId,
                        domain: domain,
                        pattern: data.data.pattern || "",
                        name: data.data.organization || null,
                        industry: data.data.industry || null,
                        type: data.data.company_type || null,
                        country: data.data.country || null,
                        locality: data.data.city || null,
                        employees: data.data.headcount ? parseInt(data.data.headcount.split('-')[0]) : null,
                        linkedin: data.data.linkedin || null,
                        twitter: data.data.twitter || null,
                        facebook: data.data.facebook || null,
                        metadata: data.data,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        emails: data.data.emails?.map((email: any) => ({
                            id: `${email.value}_${Date.now()}`,
                            companyId: data.data.id,
                            email: email.value,
                            firstName: email.first_name || null,
                            lastName: email.last_name || null,
                            position: email.position || null,
                            seniority: email.seniority || null,
                            department: email.department || null,
                            linkedin: email.linkedin || null,
                            twitter: email.twitter || null,
                            facebook: null,
                            confidence: email.confidence || null,
                            metadata: email,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        })) || []
                    }]
                };
                await updateJobDetails(updatedJob);
            }

            toast.success("Hunter Data Updated", {
                description: `Found ${data.data.emails?.length || 0} email patterns for ${domain}`
            });

            setIsCategoryModalOpen(false);
            // window.dispatchEvent(new Event('quotaUpdate')); // Add this line
        } catch (error) {
            devLog.error('Error fetching InsightLink&trade; data:', error);
            toast.error("Failed to fetch InsightLink data. Please check the domain and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const searchHunterDomain = () => {
        setIsCategoryModalOpen(true);
    };

    const renderHunterPreview = () => {
        const hunterCompany = job.hunterCompanies?.[0];
        if (!hunterCompany?.emails?.length) return null;

        const previewEmails = hunterCompany.emails.slice(0, 2);
        const remainingCount = Math.max(0, hunterCompany.emails.length - 2);

        return (
            <div className="space-y-2">
                {previewEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between text-sm">
                        <span>{email.email}</span>
                        <div className="flex items-center gap-2">
                            {email.position && (
                                <Badge variant="outline" className="text-xs">
                                    {email.position}
                                </Badge>
                            )}
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
                        className="w-full text-right text-sm text-blue-600 hover:underline"
                    >
                        +{remainingCount} more contacts
                    </button>
                )}
            </div>
        );
    };

    const handleArchive = async () => {
        try {
            const response = await srv_archiveJob(job.id || '');

            if (!response.success) throw new Error('Failed to archive job');

            // Call the parent's updateJobDetails to refresh the UI
            const updatedJob = response.data;
            updateJobDetails(updatedJob as Job);

            toast.success("Job Archived", {
                description: "The job has been successfully archived"
            });
        } catch (error) {
            console.error('Error archiving job:', error);
            toast.error("Failed to archive the job. Please try again.");
        }
    };

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


    if (isMobile) {
        return (
            <Card className="w-full hover:shadow-lg transition-shadow duration-300 ">
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div className="w-full">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-lg">{job.company}</h3>
                                <TooltipProvider>
                                    <TooltipTrigger>
                                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 cursor-default">
                                            {job.aiRating ? `${job.aiRating}% Match` : 'No AI Rating'}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        No AI Rating
                                    </TooltipContent>
                                </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600">{job.position}</p>

                            </div>

                        </div>

                    </div>

                    <div className="mt-4">
                        <div className="flex gap-2 mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 w-full"
                                onClick={() => openJobDetails(job)}
                            >
                                <Pencil className="w-4 h-4" />
                                Details
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 w-full"
                                onClick={() => setShowQuickNote(!showQuickNote)}
                            >
                                <FileText className="w-4 h-4" />
                                Quick Note
                            </Button>
                        </div>
                        <Select
                            value={job.status}
                            onValueChange={(value) => updateJobStatus(job.id || '', value as Job['status'])}
                        >
                            <SelectTrigger className={`w-fill ${getStatusColor(job.status)}`}>
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
                        Last updated: {job.updatedAt ? format(new Date(job.updatedAt), 'PP') : 'N/A'}
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
                {role === 'admin' && (
                    <code className="text-xs">Job ID: {job.id}</code>
                )}
                {layoutMode === 'list' && (
                    <CardTitle className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {job.company && (
                                <ImageWithFallback
                                    src={`https://logo.clearbit.com/${job.website}`}
                                    alt={job.company}
                                    width={32}
                                    height={32}
                                    className="rounded-md"
                                    fallbackSrc={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${job.website}&size=200`}
                                />
                            )}
                            <span className="text-2xl">{job.company}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={`text-sm h-9 ${job.aiRating
                                    ? job.aiRating >= 80
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : job.aiRating >= 60
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : ''
                                    }`}
                            >
                                <Sparkles className="w-4 h-4 mr-1" />
                                {job.aiRating ? `${job.aiRating}% Match` : 'No AI Rating'}
                            </Badge>

                            <Select
                                open={isStatusSelectOpen}
                                onOpenChange={setIsStatusSelectOpen}
                                value={job.status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className={`w-[140px] ${getStatusColor(job.status)}`}>
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
                            <TooltipProvider>
                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-red-100 hover:text-red-600 transition-colors"
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Archive Job</p>
                                        </TooltipContent>
                                    </Tooltip>
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
                                                    window.dispatchEvent(new Event('quotaUpdate')); // Add this line
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Archive
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TooltipProvider>

                        </div>
                    </CardTitle>
                )}
                {layoutMode === 'masonry' && (
                    <CardTitle className="">

                        <div className="flex items-center gap-2 mb-2">

                            {job.aiRating && (
                                <Badge
                                    variant="outline"
                                    className={`text-sm h-9 ${job.aiRating
                                        ? job.aiRating >= 80
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : job.aiRating >= 60
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        : ''
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4 mr-1" />
                                    {job.aiRating ? `${job.aiRating}% Match` : 'No AI Rating'}
                                </Badge>
                            )}
                            <Select
                                open={isStatusSelectOpen}
                                onOpenChange={setIsStatusSelectOpen}
                                value={job.status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger className={`w-[140px] ${getStatusColor(job.status)}`}>
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
                            <TooltipProvider>
                                <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-red-100 hover:text-red-600 transition-colors"
                                                >
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Archive Job</p>
                                        </TooltipContent>
                                    </Tooltip>
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
                                                    window.dispatchEvent(new Event('quotaUpdate')); // Add this line
                                                }}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Archive
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TooltipProvider>

                        </div>

                        <div className="flex items-center gap-2">
                            {job.company && (
                                <Image
                                    src={`https://logo.clearbit.com/${job.website}`}
                                    alt={job.company}
                                    width={32}
                                    height={32}
                                    className="rounded-md"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <span className="text-2xl">{job.company}</span>
                        </div>
                    </CardTitle>
                )}

            </CardHeader>
            <CardContent>
                <div className={layoutMode === 'list' ? 'flex' : ''}>
                    <div className={layoutMode === 'list' ? 'w-[70%] pr-4' : 'w-full'}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4" id="job-details-section">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-semibold">{job.position}</h3>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Last updated: {job.updatedAt ? format(new Date(job.updatedAt), 'PPP') : 'Not available'}
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
                            <CoverLetterButton job={job} updateJobDetails={updateJobDetails} />
                            <ResumeButton job={job} updateJobDetails={updateJobDetails} />

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
                                            {job.status === JobStatus.YET_TO_APPLY && 'Mark Applied'}
                                            {job.status === JobStatus.APPLIED && 'Got a phone follow up?'}
                                            {job.status === JobStatus.PHONE_SCREEN && 'Start Interview'}
                                            {job.status === JobStatus.INTERVIEW && 'Got Offer'}
                                            {job.status === JobStatus.OFFER && 'Finalize'}
                                            {job.status === JobStatus.REJECTED && 'Archive'}
                                            {job.status === JobStatus.ACCEPTED && 'Archive'}
                                            {job.status === JobStatus.ARCHIVED && 'Restore'}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Update Status</DialogTitle>
                                            <DialogDescription>
                                                {job.status === JobStatus.YET_TO_APPLY && 'Mark this application as submitted?'}
                                                {job.status === JobStatus.APPLIED && 'Moving to phone screening phase?'}
                                                {job.status === JobStatus.PHONE_SCREEN && 'Moving to interview phase?'}
                                                {job.status === JobStatus.INTERVIEW && 'Received job offer?'}
                                                {job.status === JobStatus.OFFER && 'Ready to mark as accepted/rejected?'}
                                                {job.status === JobStatus.REJECTED && 'Archive this application?'}
                                                {job.status === JobStatus.ACCEPTED && 'Archive this application?'}
                                                {job.status === JobStatus.ARCHIVED && 'Restore this application?'}
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
                                                    window.dispatchEvent(new Event('quotaUpdate')); // Add this line
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
                                    <span className="text-lg font-bold bg-clip-text bg-gradient-to-r from-[#ff7a00] to-[#ff3399] text-transparent">InsightLink&trade;</span>
                                </div>
                                <div className="flex items-center">
                                    {!job.hunterCompanies?.[0]?.emails?.length && (
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

                            {job.hunterCompanies?.[0]?.emails?.length ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">Email Pattern</h4>
                                        <Badge variant="secondary" className="text-xs">
                                            {job.hunterCompanies?.[0]?.pattern}
                                        </Badge>
                                    </div>
                                    {renderHunterPreview()}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-4">
                                    <p className="text-sm">No InsightLink&trade; data available</p>
                                    <p className="text-xs mt-1">Click search to find email patterns</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
})

JobCard.displayName = 'JobCard';

export default JobCard;