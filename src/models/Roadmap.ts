import mongoose from 'mongoose';

// Define the interface
interface Roadmap {
    id: string;
    title: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed';
    dateCreated: Date;
    dateUpdated: Date;
}

// Define the schema
const roadmapSchema = new mongoose.Schema<Roadmap>({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        required: true,
        enum: ['not-started', 'in-progress', 'completed']
    },
    dateCreated: { type: Date, default: Date.now },
    dateUpdated: { type: Date, default: Date.now }
});


const RoadmapModel = mongoose.models.Roadmap || mongoose.model<Roadmap>('Roadmap', roadmapSchema);

