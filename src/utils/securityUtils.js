/**
 * Security validation utilities for VindexValor
 */

export const validateUserAuth = (userId, authUserId) => {
  if (!userId || !authUserId) return false;
  return String(userId) === String(authUserId);
};

export const enforceUserOwnership = (record, userId) => {
  if (!record || !userId) return false;
  return String(record.user_id) === String(userId);
};

export const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return input;
  // Basic sanitization: strip out potential script tags or null bytes
  return input.replace(/<script[^>]*?>.*?<\/script>/gi, '')
              .replace(/<[\/\!]*?[^<>]*?>/gi, '')
              .replace(/[\u0000]/g, '')
              .trim();
};

export const logSecurityEvent = (eventType, userId, details) => {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY EVENT - ${eventType}] - User: ${userId || 'UNAUTHENTICATED'} - Time: ${timestamp}`, details);
  
  // In a real production environment, you might want to send this to a dedicated logging service or Supabase table
  // supabase.from('security_logs').insert([{ event_type: eventType, user_id: userId, details, created_at: timestamp }]);
};