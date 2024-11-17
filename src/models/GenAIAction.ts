import mongoose, { Model, Schema, model } from 'mongoose';

interface GenAIAction {
  id: string;
  action: string;
  promptTokens: number;
  completionTokens: number;
  costInCents: number;
  dateCreated: Date;
}

const GenAIActionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  action: { type: String, required: true },
  promptTokens: { type: Number, required: true },
  completionTokens: { type: Number, required: true },
  costInCents: { type: Number, required: true },
  dateCreated: { type: Date, required: true },
});

const GenAIActionModel = (mongoose.models?.GenAIAction || mongoose.model('GenAIAction', GenAIActionSchema)) as mongoose.Model<GenAIAction>;

export { GenAIActionModel };
