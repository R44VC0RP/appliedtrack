'use server';

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';

mongoose.connect(process.env.MONGODB_URI as string);

export async function POST(request: NextRequest) {
  try {
    const { ref, type } = await request.json();

    if (!ref) {
      return new NextResponse("Ref is required", { status: 400 });
    }

    if (!type) {
      return new NextResponse("Type is required", { status: 400 });
    }

    let campaign;

    if (type === 'access') {
      campaign = await CampaignModel.findOneAndUpdate(
        { ref: ref },
        {
          $inc: { visits: 1 },
          dateUpdated: new Date()
        },
        { new: true }
      ); 
    } else if (type === 'signup') {
      console.log('signup', ref)
      campaign = await CampaignModel.findOneAndUpdate(
        { ref: ref },
        { $inc: { signups: 1 }, dateUpdated: new Date() },
        { new: true }
      );
    }

    if (!campaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    return NextResponse.json({
      message: 'Campaign visit tracked',
      visits: campaign.visits
    });
  } catch (error) {
    console.error('Error tracking campaign visit:', error);
    return new NextResponse("Error tracking campaign visit", { status: 500 });
  }
}

