import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/utils/uploadthing";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { srv_updateUserOnboarding, srv_uploadBaselineResume } from '@/app/actions/server/job-board/primary';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [bio, setBio] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const minCharacters = 200;

  const handleUploadComplete = async (data: any) => {
    if (data && data.length > 0) {
      const success = await srv_uploadBaselineResume({
        fileUrl: data[0].url,
        fileName: data[0].name,
        fileId: data[0].id
      });

      if (success) {
        toast.success('Resume uploaded successfully!');
        // Move to the next step after successful upload
        setStep(step + 1);
        setResumeUploaded(true);
      } else {
        toast.error('Failed to upload resume. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    if (bio.length < minCharacters || !resumeUploaded) return;
    
    setIsSubmitting(true);
    try {
      await srv_updateUserOnboarding(bio);
      
      toast.success("Profile Complete! Thanks for completing your profile. You can now start tracking your job applications.");
      
      // Call the onComplete callback to close the modal
      onComplete();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = bio.length;
  const progress = Math.min((characterCount / minCharacters) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Before you start tracking your job applications, we need some information to help personalize your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Upload Your Most Recent Resume</h3>
            <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-4">
              {resumeUploaded ? (
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <FileText className="h-5 w-5" />
                  <span>Resume uploaded successfully!</span>
                </div>
              ) : (
                <UploadButton
                  endpoint="pdfUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    console.error(error);
                    toast.error("Failed to upload resume. Please try again.");
                  }}
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Tell us about yourself</h3>
              <span className="text-sm text-muted-foreground">
                {characterCount}/{minCharacters} characters
              </span>
            </div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your professional background, skills, and career goals... (200 characters minimum) this will help us create truely personalized cover letters for you."
              className="min-h-[200px]"
            />
            <Progress value={progress} className="h-2" />
            {characterCount < minCharacters && (
              <p className="text-sm text-muted-foreground">
                Please write at least {minCharacters} characters about yourself.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={characterCount < minCharacters || !resumeUploaded || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Complete Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 