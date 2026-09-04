import { Schema, model, Document } from 'mongoose';

export interface ICase extends Document {
  caseId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
}

const caseSchema = new Schema<ICase>(
  {
    caseId: {
      type: String,
      required: [true, 'Case ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const Case = model<ICase>('Case', caseSchema);
export default Case;
