import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
}

export function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const [bio, setBio] = useState('');
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const minCharacters = 200;

  const handleResumeUpload = async (res: any) => {
    const uploadedFile = res[0];
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

      if (!response.ok) throw new Error('Failed to save resume');
      
      setResumeUploaded(true);
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (bio.length < minCharacters || !resumeUploaded) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          about: bio,
          onBoardingComplete: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to update user');

      toast({
        title: "Profile Complete!",
        description: "Thanks for completing your profile. You can now start tracking your job applications.",
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      console.log("closing modal");
      // close the modal
      isOpen = false;
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
                  onClientUploadComplete={handleResumeUpload}
                  onUploadError={(error: Error) => {
                    console.error(error);
                    toast({
                      title: "Error",
                      description: "Failed to upload resume. Please try again.",
                      variant: "destructive",
                    });
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