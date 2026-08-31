import { JobVacancy, Candidate, JobStatusType, JobStatusHistoryEvent } from '../types';

export interface JobMetrics {
  required: number;
  applied: number;
  selected: number;
  assigned: number;
  remaining: number;
  status: JobStatusType;
  appliedCandidates: Candidate[];
  selectedCandidates: Candidate[];
  assignedCandidates: Candidate[];
}

/**
 * Computes live metrics for a job vacancy given the list of all candidates.
 * 
 * Rules:
 * 1. Required Candidates: vacancy quota configured for the job.
 * 2. Applied Candidates: candidates explicitly linked via jobId or whose applied trade matches the job title.
 * 3. Selected Candidates: candidates who passed interview or are in medical/processing stages.
 * 4. Assigned Candidates: candidates actively assigned to this job or visa, excluding rejected, cancelled, or withdrawn.
 * 5. Remaining Vacancy: Math.max(0, required - assigned)
 * 
 * Best Automatic Status Priority:
 * - IF isCancelled / CANCELLED -> CANCELLED
 * - ELSE IF isManuallyClosed / CLOSED -> CLOSED
 * - ELSE IF assigned >= required (and required > 0) -> FULL
 * - ELSE IF applied > 0 OR selected > 0 OR assigned > 0 -> IN_PROGRESS
 * - ELSE -> OPEN
 */
export function computeJobCandidateMetrics(job: JobVacancy, allCandidates: Candidate[]): JobMetrics {
  const required = Number(job.openingsCount || job.requiredCandidates || 1);

  // 1. Find all candidates associated with this job
  const appliedCandidates = (allCandidates || []).filter((c) => {
    if (!c) return false;
    // Explicit jobId match
    if (c.jobId && String(c.jobId) === String(job.id)) return true;
    
    // Normalized trade match if jobId is empty
    if (!c.jobId && c.trade && job.title) {
      const cTrade = c.trade.trim().toLowerCase();
      const jTitle = job.title.trim().toLowerCase();
      return cTrade === jTitle || jTitle.includes(cTrade) || cTrade.includes(jTitle);
    }
    return false;
  });

  const applied = appliedCandidates.length;

  // 2. Selected candidates: passed initial interview or are further in the pipeline (excluding rejected)
  const selectedCandidates = appliedCandidates.filter((c) => {
    if (c.status === 'rejected') return false;
    return [
      'interview_selected',
      'medical_in_progress',
      'medical_fit',
      'wakala_issued',
      'visa_stamped',
      'emigration_cleared',
      'ticket_booked',
      'deployed',
    ].includes(c.status);
  });

  const selected = selectedCandidates.length;

  // 3. Assigned candidates: actively assigned candidates progressing in visa/deployment pipeline
  // Rule: Do NOT count rejected, cancelled or withdrawn candidates as assigned candidates
  const assignedCandidates = appliedCandidates.filter((c) => {
    if (c.status === 'rejected') return false;
    
    // Check if candidate is actively selected / assigned visa / in advanced stages
    const hasActiveProgress = [
      'interview_selected',
      'medical_in_progress',
      'medical_fit',
      'wakala_issued',
      'visa_stamped',
      'emigration_cleared',
      'ticket_booked',
      'deployed',
    ].includes(c.status);

    const hasVisaAssigned = Boolean(c.visaId || c.visaBatchId);

    // If applied candidate has active progress or has visa assigned or is in processing
    return hasActiveProgress || hasVisaAssigned;
  });

  const assigned = assignedCandidates.length;

  // 4. Remaining Vacancies
  const remaining = Math.max(0, required - assigned);

  // 5. Compute Status according to specified Priority Rule
  let status: JobStatusType = 'OPEN';

  if (job.isCancelled || job.status === 'CANCELLED' || job.status === 'cancelled') {
    status = 'CANCELLED';
  } else if (job.isManuallyClosed || job.status === 'CLOSED' || job.status === 'closed') {
    status = 'CLOSED';
  } else if (assigned >= required && required > 0) {
    status = 'FULL';
  } else if (applied > 0 || selected > 0 || assigned > 0) {
    status = 'IN_PROGRESS';
  } else {
    status = 'OPEN';
  }

  return {
    required,
    applied,
    selected,
    assigned,
    remaining,
    status,
    appliedCandidates,
    selectedCandidates,
    assignedCandidates,
  };
}

/**
 * Enriches a single job with computed counters and real-time status.
 */
export function enrichJobWithMetrics(job: JobVacancy, allCandidates: Candidate[]): JobVacancy {
  const metrics = computeJobCandidateMetrics(job, allCandidates);

  return {
    ...job,
    openingsCount: metrics.required,
    requiredCandidates: metrics.required,
    appliedCount: metrics.applied,
    selectedCount: metrics.selected,
    assignedCount: metrics.assigned,
    remainingCount: metrics.remaining,
    computedStatus: metrics.status,
  };
}

/**
 * Enriches a list of jobs with metrics and computed statuses.
 */
export function enrichAllJobsWithMetrics(jobs: JobVacancy[], allCandidates: Candidate[]): JobVacancy[] {
  return (jobs || []).map((job) => enrichJobWithMetrics(job, allCandidates));
}

/**
 * Automatically generates a standardized Job ID (e.g. AHT-SAUD-00125).
 */
export function generateJobId(existingJobs: JobVacancy[] = [], countryCode = 'SAUD'): string {
  const prefix = `AHT-${countryCode.toUpperCase()}-`;
  
  // Find highest existing number or random 5-digit number
  const existingNumbers = existingJobs
    .map((j) => {
      const match = (j.jobCode || '').match(/AHT-SAUD-(\d+)/i) || (j.jobCode || '').match(/(\d{4,5})$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  let nextNum = 125;
  if (existingNumbers.length > 0) {
    nextNum = Math.max(...existingNumbers) + 1;
  } else {
    nextNum = Math.floor(100 + Math.random() * 900);
  }

  const padded = String(nextNum).padStart(5, '0');
  return `${prefix}${padded}`;
}

/**
 * Creates a new Status History Event
 */
export function createJobStatusHistoryEvent(
  status: JobStatusType | 'REOPENED' | 'CREATED',
  changedBy: string,
  notes?: string,
  metrics?: Partial<{ required: number; applied: number; selected: number; assigned: number; remaining: number }>
): JobStatusHistoryEvent {
  return {
    id: 'jsh-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    status,
    timestamp: new Date().toISOString(),
    changedBy: changedBy || 'Admin',
    notes: notes || `Job status transitioned to ${status}`,
    countsSnapshot: metrics
      ? {
          required: metrics.required || 0,
          applied: metrics.applied || 0,
          selected: metrics.selected || 0,
          assigned: metrics.assigned || 0,
          remaining: metrics.remaining || 0,
        }
      : undefined,
  };
}
