import { Schema, model, Document } from 'mongoose';

export type CustodyAction = 'COLLECTED' | 'UPLOADED' | 'TRANSFERRED' | 'ANALYZED' | 'VERIFIED';

export interface ICustodyEvent extends Document {
  evidenceId: string;
  actorId: string;
  action: CustodyAction;
  timestamp: Date;
  previousHash: string;
  currentHash: string;
  digitalSignature: string;
}

const custodyEventSchema = new Schema<ICustodyEvent>(
  {
    evidenceId: {
      type: String,
      required: [true, 'Evidence ID is required'],
      trim: true,
      index: true,
    },
    actorId: {
      type: String,
      required: [true, 'Actor ID is required'],
      trim: true,
    },
    action: {
      type: String,
      enum: ['COLLECTED', 'UPLOADED', 'TRANSFERRED', 'ANALYZED', 'VERIFIED'],
      required: [true, 'Custody action is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    previousHash: {
      type: String,
      required: [true, 'Previous hash is required'],
      trim: true,
    },
    currentHash: {
      type: String,
      required: [true, 'Current hash is required'],
      trim: true,
    },
    digitalSignature: {
      type: String,
      required: [true, 'Digital signature is required'],
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

export const CustodyEvent = model<ICustodyEvent>('CustodyEvent', custodyEventSchema);
export default CustodyEvent;
