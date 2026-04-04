import { Request } from 'express';

export function getClientIp(req: Request): string | undefined {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0]?.trim();
  if (Array.isArray(xff) && xff[0]) return xff[0];
  return req.socket?.remoteAddress;
}
