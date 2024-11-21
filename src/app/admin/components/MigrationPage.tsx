'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { srv_migrateMongoUsers, MongoUser, srv_migrateMongoJobs, MongoJob } from '@/app/actions/server/admin/migrations/primary'

export default function MigrationPage() {
    const handleUserMigration = async () => {
        try {
            const mongoData = [{
                "_id": {
                  "$oid": "6715b884c1fdd97f0afff481"
                },
                "userId": "user_2nX8i0mSsxrRTfp7Zo6Heq0jdHV",
                "tier": "power",
                "dateCreated": {
                  "$date": "2024-10-21T02:12:20.239Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-19T04:14:47.810Z"
                },
                "__v": 0,
                "about": "My name is Ryan Vogel, an IT student at the University of North Florida, and I am very passionate about technology. I love coding and creating applications that help other people and me. I have created 2 businesses Mandarin 3D Prints, a custom 3D printing business and Appliedtrack a job application tracking software that helps users get a better grasp on their job application journies.",
                "role": "admin",
                "stripeCustomerId": "cus_RFDGf2FrAxGWQn",
                "subscriptionId": "sub_1QMiHtG7IkEiG3E1ETJddBGv",
                "onBoardingComplete": true,
                "cancelAtPeriodEnd": false,
                "currentPeriodEnd": {
                  "$date": "2024-12-19T04:14:23.000Z"
                }
              },
              {
                "_id": {
                  "$oid": "671695b9fd35cb671e1830ea"
                },
                "userId": "user_2nl2VK9B2uI9UMXGjdlD02W4CUA",
                "tier": "power",
                "about": "i need to be an admin",
                "dateCreated": {
                  "$date": "2024-10-21T17:56:09.181Z"
                },
                "dateUpdated": {
                  "$date": "2024-10-31T20:40:32.532Z"
                },
                "__v": 0,
                "role": "admin"
              },
              {
                "_id": {
                  "$oid": "67193b89f3acc65910107396"
                },
                "userId": "user_2nqiBhVIJxpCDDXfy9Qf0EKokBQ",
                "tier": "free",
                "about": "My name is Ryan Vogel. I am an IT student at the University of North Florida, and I am very passionate about technology. I love coding and creating applications that help other people and me. I have created two businesses: Mandarin 3D Prints, a custom 3D printing business, and Appliedtrack, job application tracking software that helps users get a better grasp on their job application journeys.",
                "dateCreated": {
                  "$date": "2024-10-23T18:08:09.590Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-05T16:16:42.047Z"
                },
                "__v": 0,
                "role": "admin",
                "onBoardingComplete": true
              },
              {
                "_id": {
                  "$oid": "671a3e564dc57c7d762ab14b"
                },
                "userId": "user_2nXDuWxz36eiNlLiFLc4xNjsauu",
                "tier": "free",
                "about": "Hello There how are you!",
                "dateCreated": {
                  "$date": "2024-10-24T12:32:22.021Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-14T04:21:36.987Z"
                },
                "__v": 0,
                "role": "user"
              },
              {
                "_id": {
                  "$oid": "6727ee8736ba5abd5a4b7ccb"
                },
                "userId": "user_2oMCmFGNu6lPUfc7OKh4EusmadN",
                "tier": "free",
                "role": "user",
                "about": "I’m Jessica Hornung, a passionate graphic design and digital media student at the University of North Florida, blending creativity with a solid background in hospitality and customer service. My journey has been diverse, from crafting the perfect cup of coffee at Starbucks to designing captivating social media content as the Social Media Manager & Graphic Design Director for Mandarin 3D Prints. In this role, I’ve successfully increased follower engagement and managed advertisement revenue, using my Adobe InDesign, Photoshop, and Illustrator skills to create eye-catching flyers, posters, and digital campaigns.",
                "dateCreated": {
                  "$date": "2024-11-03T21:43:35.845Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-12T18:10:06.721Z"
                },
                "__v": 0,
                "onBoardingComplete": true
              },
              {
                "_id": {
                  "$oid": "6727f13b55b8f65a6e13c269"
                },
                "userId": "user_2oMEAs75agUCR71w801ws558tLB",
                "tier": "power",
                "role": "user",
                "about": "My name is Ryan Vogel, an IT student at the University of North Florida, and I am very passionate about technology. I love coding and creating applications that help other people and me. I have created 2 businesses Mandarin 3D Prints, a custom 3D printing business and AppliedTrack a job application tracking software that helps users get a better grasp on their job application journeys.",
                "dateCreated": {
                  "$date": "2024-11-03T21:55:07.299Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-19T00:06:56.239Z"
                },
                "__v": 0,
                "onBoardingComplete": true,
                "stripeCustomerId": "cus_RF9DepqhauHsjH",
                "subscriptionId": "sub_1QMevAG7IkEiG3E1ZrgYSmNc",
                "cancelAtPeriodEnd": true,
                "currentPeriodEnd": {
                  "$date": "2024-12-19T00:03:56.000Z"
                },
                "subscriptionStatus": "active"
              },
              {
                "_id": {
                  "$oid": "672feecc0c5eea4504ce302e"
                },
                "userId": "user_2odLanLRoFTVaNu1R3gnyqQET1N",
                "tier": "free",
                "role": "user",
                "onBoardingComplete": true,
                "about": "As a software developer with a strong background in designing and implementing innovative solutions, I have honed skills in full-stack development, agile methodologies, and scalable architecture. My expertise includes programming languages like JavaScript, Python, and C++, with a passion for developing efficient and user-friendly applications. I aim to continually grow as a problem-solver and aspire to create impactful technology that drives user engagement and business success. I'm also driven by a commitment to lifelong learning and collaboration, striving to make meaningful contributions to forward-thinking teams.",
                "dateCreated": {
                  "$date": "2024-11-09T23:22:52.824Z"
                },
                "dateUpdated": {
                  "$date": "2024-11-09T23:25:22.011Z"
                },
                "__v": 0
              }] as MongoUser[];

            await srv_migrateMongoUsers(mongoData)
            toast.success("User migration completed successfully")
        } catch (error) {
            console.error('Migration error:', error)
            toast.error("User migration failed")
        }
    }

    const handleJobMigration = async () => {
        try {
            // Replace this with your actual MongoDB job export data
            

            await srv_migrateMongoJobs()
            toast.success("Job migration completed successfully")
        } catch (error) {
            console.error('Migration error:', error)
            toast.error("Job migration failed")
        }
    }

    return (
        <div className="p-4 space-y-8">
            <h1 className="text-2xl font-bold">Database Migrations</h1>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <h2 className="text-xl">User Migration</h2>
                    <p className="text-sm text-muted-foreground">
                        Migrate user data from MongoDB to Prisma/MySQL
                    </p>
                    <Button 
                        onClick={handleUserMigration}
                        variant="outline"
                    >
                        Migrate Users
                    </Button>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl">Job Migration</h2>
                    <p className="text-sm text-muted-foreground">
                        Migrate job data from MongoDB to Prisma/MySQL
                    </p>
                    <Button 
                        onClick={handleJobMigration}
                        variant="outline"
                    >
                        Migrate Jobs
                    </Button>
                </div>
            </div>
        </div>
    )
}
