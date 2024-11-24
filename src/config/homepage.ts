export const homepageConfig = {
  isWaitlist: false, // Set to false to enable normal signup mode
  waitlistConfig: {
    title: "Join the Waitlist",
    description: "Be the first to know when AppliedTrack launches. Get early access and exclusive features.",
    buttonText: "Join Waitlist",
    successMessage: "You've been added to our waitlist! We'll notify you when we launch.",
  },
  signupConfig: {
    title: "Start Your Job Search Journey",
    description: "Track your job applications, generate custom resumes, and land your dream job.",
    buttonText: "Get Started",
    successMessage: "Account created successfully! Welcome to AppliedTrack.",
  },
  loginConfig: {
    title: "What are you doing here?",
    description: "Jump to your dashboard and start tracking those jobs!.",
    buttonText: "Jump to Dashboard",
  },
} as const;
