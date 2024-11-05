'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FaRobot, FaUser } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@clerk/nextjs';

interface Job {
  id: string;
  company: string;
  position: string;
}

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const { userId } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, []);

  const handleGenerateCoverLetter = async () => {
    if (!selectedJob || !userId) return;

    try {
      const response = await fetch('/api/genai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: selectedJob,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await response.json();
      console.log('Generated cover letter:', data);
    } catch (error) {
      console.error('Error generating cover letter:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">Generate Cover Letter</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={setSelectedJob} value={selectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.company} - {job.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerateCoverLetter}
              disabled={!selectedJob}
              className="w-full"
            >
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="flex flex-col w-[80vw] mx-auto h-[80vh] relative">
        <ScrollArea className="flex-1 p-4 h-[calc(100%-80px)]">
          {messages.map(m => (
            <div
              key={m.id}
              className={`mb-4 flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${
                m.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {m.role === 'user' ? (
                    <FaUser className="h-4 w-4" />
                  ) : (
                    <FaRobot className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {m.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
                {m.toolInvocations ? (
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(m.toolInvocations, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>

        <form 
          onSubmit={handleSubmit}
          className="p-4 border-t bg-card"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              placeholder="Ask about the weather..."
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}