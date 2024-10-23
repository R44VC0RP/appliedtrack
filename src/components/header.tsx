import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Bell, Grid, Settings, FileText } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

import logo from '@/app/logos/logo.png'
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import Link from 'next/link'
import { FaCircle } from 'react-icons/fa'
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UploadButton } from "@/utils/uploadthing"

interface HeaderProps {
  user?: {
    name: string;
    avatar?: string;
  };
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export function Header({ user, onNotificationClick }: HeaderProps) {
  const { toast } = useToast();
  const [userDetails, setUserDetails] = useState({
    about: '',
  });
  const [resumes, setResumes] = useState<{ resumeId: string; fileUrl: string, fileName: string }[]>([]);

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
        if (response.ok) {
          toast({
            title: "Resume uploaded",
            description: "Your resume has been uploaded successfully",
          });
        }

        if (!response.ok) {
          throw new Error('Failed to save resume');
        }

        const data = await response.json();
        console.log('Resume saved:', data);

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

      if (!response.ok) {
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

  const CustomPage = () => (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Personal Info</h1>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">About Me</h3>
          <p className="text-sm text-gray-500 mb-2">This is used to help generate more accurate cover letters and other documents.</p>
          <Textarea
            className="min-h-[100px] w-full"
            name="about"
            placeholder="About Me"
            value={userDetails.about}
            onChange={handleUserDetailsChange}
          />
          <Button onClick={handleSaveChanges} className="mt-2">Save Changes</Button>
        </div>
        <Separator />
        <div>
          <h3 className="text-lg font-semibold mb-2">Example Bio's</h3>
          <div className="space-y-2">
            <p className="text-sm font-semibold">John Doe</p>
            <p className="text-sm text-gray-500 mb-2 p-2 bg-gray-100 rounded-md">
              John Doe is a seasoned software engineer with over 10 years of experience in the tech industry. 
            He has a proven track record of developing high-quality software solutions and leading successful projects. 
            John is proficient in multiple programming languages and frameworks, and he is passionate about continuous learning and improvement. 
            His accomplishments include leading a team to develop a highly scalable web application that serves millions of users, 
              and contributing to open-source projects that have been widely adopted by the developer community.
            </p>
            <p className="text-sm font-semibold">Jane Smith</p>
            <p className="text-sm text-gray-500 mb-2 p-2 bg-gray-100 rounded-md">
              Jane Smith is a creative and innovative marketing professional with a passion for creating engaging and effective campaigns. 
              She has a proven track record of developing high-quality marketing strategies and leading successful projects. 
              Jane is proficient in multiple marketing platforms and frameworks, and she is passionate about continuous learning and improvement. 
              Her accomplishments include leading a team to develop a highly scalable marketing campaign that served millions of users, 
              and contributing to open-source projects that have been widely adopted by the marketing community.
            </p>
            
          </div>

          
        </div>
        {/* <div>
          <h3 className="text-lg font-semibold mb-2">Resumes</h3>
          <ScrollArea className="h-[200px] w-full border rounded-md p-4">
            <div className="space-y-2">
              {resumes.map((resume) => (
                <div key={resume.resumeId} className="flex items-center justify-between">
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
            </div>
          </ScrollArea>
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Upload New Resume</h4>
            <UploadButton
              endpoint="pdfUploader"
              onClientUploadComplete={handleResumeUpload}
              onUploadError={(error: Error) => {
                console.error(error);
                alert("Upload failed");
              }}
            />
          </div>
        </div> */}
      </div>
    </div>
  )

  return (
    <header className="container mx-auto p-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Image src={logo} alt="Job Tracker Logo" width={40} height={40} className="rounded-md" />
          </Link>
          <h1 className="text-3xl font-bold">JobTrack</h1>
        </div>
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onNotificationClick} className="focus:outline-none">
                  <Bell className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Notifications
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard" className="focus:outline-none">
                  <Grid className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Dashboard
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <SignedOut>
                    <SignInButton>
                      <Button>Get Started</Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton>
                      <UserButton.UserProfilePage label="Personal Info" url="personal-info" labelIcon={<Settings className="w-4 h-4" />}>
                        <CustomPage />
                      </UserButton.UserProfilePage>
                      <UserButton.UserProfilePage label="Resumes" url="resumes" labelIcon={<FileText className="w-4 h-4" />}>
                        <div className="p-4">
                          <h1 className="text-2xl font-bold mb-4">Resumes</h1>
                          <ScrollArea className="h-[300px] w-full border rounded-md p-4">
                            <div className="space-y-2">
                              {resumes.map((resume) => (
                                <div key={resume.resumeId} className="flex items-center justify-between">
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
                            </div>
                          </ScrollArea>
                          <div className="mt-4">
                            <h4 className="text-md font-semibold mb-2">Upload New Resume</h4>
                            <UploadButton
                              endpoint="pdfUploader"
                              onClientUploadComplete={handleResumeUpload}
                              onUploadError={(error: Error) => {
                                console.error(error);
                                alert("Upload failed");
                              }}
                              className="[&_[data-ut-element='allowed-content']]:uppercase"
                            />
                          </div>
                        </div>
                      </UserButton.UserProfilePage>
                    </UserButton>
                  </SignedIn>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {user ? user.name : 'Get Started'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
