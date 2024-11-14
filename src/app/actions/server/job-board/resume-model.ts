import { z } from 'zod';

export const ResumeModel = z.object({
    basics: z.object({
        name: z.string(),
        label: z.string(),
        image: z.string().nullable(),
        email: z.string().email(),
        phone: z.string().nullable(),
        url: z.string().url().nullable(),
        summary: z.string().nullable(),
        location: z.string().nullable(),
        profiles: z.array(z.object({
            network: z.string(),
            username: z.string(),
            url: z.string().url()
        })).nullable()
    }),
    work: z.array(z.object({
        name: z.string().nullable(),
        position: z.string().nullable(),
        url: z.string().url().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        summary: z.string().nullable(),
        highlights: z.array(z.string()).nullable()
    })).nullable(),
    volunteer: z.array(z.object({
        organization: z.string().nullable(),
        position: z.string().nullable(),
        url: z.string().url().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        summary: z.string().nullable(),
        highlights: z.array(z.string()).nullable()
    })).nullable(),
    education: z.array(z.object({
        institution: z.string().nullable(),
        url: z.string().url().nullable(),
        area: z.string().nullable(),
        studyType: z.string().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        score: z.string().nullable(),
        courses: z.array(z.string()).nullable()
    })).nullable(),
    awards: z.array(z.object({
        title: z.string().nullable(),
        date: z.string().nullable(),
        awarder: z.string().nullable(),
        summary: z.string().nullable()
    })).nullable(),
    certificates: z.array(z.object({
        name: z.string().nullable(),
        date: z.string().nullable(),
        issuer: z.string().nullable(),
        url: z.string().url().nullable()
    })).nullable(),
    publications: z.array(z.object({
        name: z.string().nullable(),
        publisher: z.string().nullable(),
        releaseDate: z.string().nullable(),
        url: z.string().url().nullable(),
        summary: z.string().nullable()
    })).nullable(),
    skills: z.array(z.object({
        name: z.string().nullable(),
        level: z.string().nullable(),
        keywords: z.array(z.string()).nullable()
    })).nullable(),
    languages: z.array(z.object({
        language: z.string().nullable(),
        fluency: z.string().nullable()
    })).nullable(),
    interests: z.array(z.object({
        name: z.string().nullable(),
        keywords: z.array(z.string()).nullable()
    })).nullable(),
    references: z.array(z.object({
        name: z.string().nullable(),
        reference: z.string().nullable()
    })).nullable(),
    projects: z.array(z.object({
        name: z.string().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        description: z.string().nullable(),
        highlights: z.array(z.string()).nullable(),
        url: z.string().url().nullable()
    })).nullable()
});