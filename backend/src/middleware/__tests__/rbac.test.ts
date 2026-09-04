import { Request, Response, NextFunction } from 'express';
import { checkRole } from '../rbac';
import { JwtUserPayload } from '../../types/express';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should return 403 ACCESS DENIED if user is not attached to request', () => {
    const middleware = checkRole(['Admin', 'Investigator']);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'ACCESS DENIED' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 ACCESS DENIED if user role is not in allowed roles', () => {
    mockRequest.user = {
      userId: '123',
      email: 'viewer@lexvault.local',
      role: 'Viewer',
    } as JwtUserPayload;

    const middleware = checkRole(['Admin', 'Investigator']);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'ACCESS DENIED' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if user role is in allowed roles', () => {
    mockRequest.user = {
      userId: '456',
      email: 'admin@lexvault.local',
      role: 'Admin',
    } as JwtUserPayload;

    const middleware = checkRole(['Admin', 'Investigator']);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
