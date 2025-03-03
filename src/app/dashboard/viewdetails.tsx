"use client";

import { useState, useEffect } from "react";
import { PDFViewerInline } from "@/components/pdf-viewer-modal";
import { Job } from '@/app/types/job';
import { JobStatus, RemoteType, JobType } from '@prisma/client';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe2 } from "lucide-react";
import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import { Bot, Sparkles, FileText, Users } from "lucide-react";
import JobTitleAutocomplete from "@/components/ui/job-title-autocomplete";
import { srv_getJob, srv_getResumes, srv_uploadResume } from "../actions/server/job-board/primary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { jobStatusToLabel } from "./appliedtrack";
import { devLog } from '@/lib/devLog';

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

export default function ViewDetailsModal({ isOpen, onClose, job, setSelectedJob, setIsModalOpen, updateJobDetails, activeTab: initialActiveTab, handleAIRecommendation }: {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    updateJobDetails: (job: Job) => void;
    activeTab?: 'details' | 'hunter';  
    handleAIRecommendation: (job: Job) => void;
}) {
    const [activeTab, setActiveTab] = useState<'details' | 'hunter'>(initialActiveTab || 'details');
    const [editingField, setEditingField] = useState<keyof Job | null>(null);
    const [isJobDescriptionCollapsed, setIsJobDescriptionCollapsed] = useState<boolean>(true);
    const [resumes, setResumes] = useState<Array<{ resumeId: string, fileUrl: string, fileName: string }>>([]);
    const isMobile = useClientMediaQuery('(max-width: 640px)');

    useEffect(() => {
        const loadResumes = async () => {
            try {
                const userResumes = await srv_getResumes();
                if (Array.isArray(userResumes)) {
                    setResumes(userResumes.map(resume => ({
                        resumeId: resume.id,
                        fileUrl: resume.fileUrl,
                        fileName: resume.fileName || 'Resume'
                    })));
                }
            } catch (error) {
                devLog.error('Failed to load resumes:', error);
                toast.error('Failed to load resumes');
            }
        };
        loadResumes();
    }, []);

    useEffect(() => {
        if (job) {
            setSelectedJob(job);
        }
    }, [job, setSelectedJob]);

    const handleAIAnalysis = async () => {
        if (!job) return;

        await handleAIRecommendation(job);
        try {
            const updatedJob = await srv_getJob(job.id || '');
            setSelectedJob(updatedJob as Job);
        } catch (error) {
            devLog.error('Error fetching updated job details:', error);
        }
    };

    const handleQuotaAction = async (action: () => Promise<any>) => {
        try {
            await action();
            // Notify quota update after any quota-affecting action
            window.dispatchEvent(new Event('quotaUpdate'));
        } catch (error) {
            devLog.error('Error in quota action:', error);
            throw error;
        }
    };

    const handleGenerateResume = async () => {
        await handleQuotaAction(async () => {
            // ... existing resume generation code ...
        });
    };

    const handleGenerateCoverLetter = async () => {
        await handleQuotaAction(async () => {
            // ... existing cover letter generation code ...
        });
    };

    const handleEmailSearch = async () => {
        await handleQuotaAction(async () => {
            // ... existing email search code ...
        });
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
                                setSelectedJob(prev => prev ? { ...prev, position: title } : null);
                                setEditingField(null);
                            }}
                            className="mt-1"
                        />
                    ) : field === 'interviewDate' || field === 'dateApplied' ? (
                        <Input
                            type="date"
                            value={value || ''}
                            onChange={(e) => setSelectedJob(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                            className="mt-1"
                            onBlur={() => setEditingField(null)}
                        />
                    ) : field === 'resumeUrl' ? (
                        <div className="space-y-2">
                            <Select
                                value={value?.toString() || ''}
                                onValueChange={(value) => {
                                    setSelectedJob(prev => prev ? { ...prev, resumeUrl: value } : null);
                                    setEditingField(null);
                                }}
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
                            <UploadButton
                                endpoint="pdfUploader"
                                onClientUploadComplete={async (data: any) => {
                                    try {
                                        const uploadData = {
                                            fileUrl: data[0].url,
                                            fileId: data[0].key,
                                            resumeId: data[0].key,
                                            fileName: data[0].name
                                        };
                                        await srv_uploadResume(uploadData);
                                        const newResume = { resumeId: data[0].key, fileUrl: data[0].url, fileName: data[0].name };
                                        setResumes([...resumes, newResume]);
                                        setSelectedJob(prev => prev ? { ...prev, resumeUrl: data[0].url } : null);
                                        setEditingField(null);
                                        toast.success('Resume uploaded successfully');
                                    } catch (error) {
                                        devLog.error('Error uploading resume:', error);
                                        toast.error('Failed to upload resume');
                                    }
                                }}
                                onUploadError={(error: any) => {
                                    devLog.error('Upload error:', error);
                                    toast.error(`Error uploading resume: ${error.message}`);
                                }}
                                className="mt-2 ut-button:w-full ut-button:h-9 ut-button:bg-secondary ut-button:hover:bg-secondary/80 ut-button:text-secondary-foreground ut-button:rounded-md ut-button:text-sm ut-button:font-medium ut-allowed-content:hidden"
                                appearance={{
                                    button: "Upload New Resume"
                                }}
                            />
                        </div>
                    ) : (
                        <Input
                            value={value || ''}
                            onChange={(e) => setSelectedJob(prev => prev ? { ...prev, [field]: e.target.value } : null)}
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
        const hunterCompany = job.hunterCompanies?.[0];
        if (!hunterCompany?.emails?.length) {
            return (
                <div className="text-center py-8 text-gray-500">
                    No Hunter.io data available
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Company Information */}
                <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {hunterCompany.name && (
                            <div>
                                <Label>Company Name</Label>
                                <p className="text-sm">{hunterCompany.name}</p>
                            </div>
                        )}
                        {hunterCompany.domain && (
                            <div>
                                <Label>Domain</Label>
                                <p className="text-sm font-mono">{hunterCompany.domain}</p>
                            </div>
                        )}
                        {hunterCompany.industry && (
                            <div>
                                <Label>Industry</Label>
                                <p className="text-sm">{hunterCompany.industry}</p>
                            </div>
                        )}
                        {hunterCompany.type && (
                            <div>
                                <Label>Company Type</Label>
                                <p className="text-sm">{hunterCompany.type}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Email Pattern Section */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Email Pattern</h3>
                    <Badge variant="secondary">{hunterCompany.pattern}</Badge>
                </div>

                {/* Email List Section */}
                <div className="space-y-4">
                    {hunterCompany.emails.map((email, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">
                                        {email.firstName} {email.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600">{email.position}</p>
                                </div>
                                <Badge variant="outline">{email.confidence}% confidence</Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Email</Label>
                                    <p className="text-sm font-mono">{email.email}</p>
                                </div>
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
                                {email.facebook && (
                                    <a href={`https://facebook.com/${email.facebook}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">Facebook</Button>
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
                                            {jobStatusToLabel(job.status)}
                                        </Badge>
                                    </div>
                                </div>
                                <a
                                    href={job.website || '#'}
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
                                                <div className="text-left text-xs sm:text-sm text-muted-foreground">
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
                                    Contacts Found <Badge className="ml-2">{job.hunterCompanies?.[0]?.emails?.length || 0}</Badge>
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
                                                onChange={(e) => setSelectedJob(prev => prev ? { ...prev, jobDescription: e.target.value } : null)}
                                                className="min-h-[200px]"
                                            />
                                        ) : (
                                            <div className={`relative ${isJobDescriptionCollapsed ? 'max-h-[200px]' : 'max-h-none'} overflow-hidden`}>
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
                                                onChange={(e) => setSelectedJob(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                                className="min-h-[100px] sm:min-h-[200px]"
                                            />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap mt-1">{job.notes || 'No notes added yet.'}</p>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Important Dates</h4>
                                        {renderField("Interview Date", job.interviewDate?.toDateString(), "interviewDate")}
                                        {renderField("Date Applied", job.dateApplied?.toDateString(), "dateApplied")}
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Documents</h4>
                                        <div className="space-y-4">
                                            <div>
                                                {renderField("Resume", job.resumeUrl ? "Resume Uploaded" : "Resume Not Uploaded", "resumeUrl")}
                                                {job.resumeUrl && (
                                                    <>
                                                    {!isMobile ? (
                                                        <PDFViewerInline fileUrl={job.resumeUrl} fileName="resume.pdf" />
                                                    ) : (
                                                        <Button 
                                                            variant="outline" 
                                                            className="w-full mt-2"
                                                            onClick={() => window.open(job.resumeUrl || '', '_blank')}
                                                        >
                                                            View Resume
                                                        </Button>
                                                    )}
                                                    </>
                                                )}
                                            </div>
                                            {job.latestGeneratedCoverLetter && (
                                                <div>
                                                    <Label className="font-semibold">Cover Letter</Label>
                                                    {!isMobile ? (
                                                        <embed src={job.latestGeneratedCoverLetter.coverLetterMarkdown} type="application/pdf" width="100%" height="400px" />
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full mt-2"
                                                            onClick={() => window.open(job.latestGeneratedCoverLetter?.coverLetterMarkdown || '', '_blank')}
                                                        >
                                                            View Cover Letter
                                                        </Button>
                                                        
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Separator />
                                    {/* <div className="space-y-4">
                                        <h4 className="font-semibold">Additional Details</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {renderField("Salary", job.salary, "salary")}
                                            {renderField("Location", job.location, "location")}
                                            {renderField("Remote Type", job.remoteType, "remoteType")}
                                            {renderField("Job Type", job.jobType, "jobType")}
                                        </div>
                                    </div> */}
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
