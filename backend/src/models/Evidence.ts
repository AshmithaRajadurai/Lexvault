import { Schema, model, Document } from 'mongoose';

export type EvidenceStatus = 'VERIFIED' | 'TAMPERED';

export interface IEvidence extends Document {
  evidenceId: string;
  caseId: string;
  filename: string;
  sha256: string;
  commitment: string;
  storagePath: string;
  mimeType: string;
  uploadedBy: string;
  timestamp: Date;
  status: EvidenceStatus;
}

const evidenceSchema = new Schema<IEvidence>(
  {
    evidenceId: {
      type: String,
      required: [true, 'Evidence ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    caseId: {
      type: String,
      required: [true, 'Case ID is required'],
      trim: true,
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    sha256: {
      type: String,
      required: [true, 'SHA256 hash is required'],
      trim: true,
    },
    commitment: {
      type: String,
      required: [true, 'Cryptographic commitment is required'],
      trim: true,
    },
    storagePath: {
      type: String,
      required: [true, 'Storage path is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    uploadedBy: {
      type: String,
      required: [true, 'Uploaded by user identifier is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'TAMPERED'],
      default: 'VERIFIED',
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

export const Evidence = model<IEvidence>('Evidence', evidenceSchema);
export default Evidence;
