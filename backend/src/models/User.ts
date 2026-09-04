import { Schema, model, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Investigator' | 'Verifier' | 'Viewer';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['Admin', 'Investigator', 'Verifier', 'Viewer'],
      default: 'Viewer',
      required: true,
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

export const User = model<IUser>('User', userSchema);
export default User;
