-- ============================================================
-- Recruitment RLS Policies
-- auth.uid() maps to users.auth_id
-- Role helper: (SELECT role FROM users WHERE auth_id = auth.uid())
-- ============================================================

-- Enable RLS on all 7 tables
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- job_descriptions
-- SELECT: hr, interviewer, admin, super_admin (recruiter excluded)
-- INSERT/UPDATE: interviewer, admin, super_admin
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS jd_select ON job_descriptions;
CREATE POLICY jd_select ON job_descriptions
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS jd_insert ON job_descriptions;
CREATE POLICY jd_insert ON job_descriptions
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS jd_update ON job_descriptions;
CREATE POLICY jd_update ON job_descriptions
  FOR UPDATE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('interviewer', 'admin', 'super_admin')
  ) WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS jd_delete ON job_descriptions;
CREATE POLICY jd_delete ON job_descriptions
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- candidate_cvs
-- SELECT: recruiter, interviewer, admin, super_admin OR hr with own uploads
-- INSERT: hr, interviewer, admin, super_admin
-- UPDATE/DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS candidate_cvs_select ON candidate_cvs;
CREATE POLICY candidate_cvs_select ON candidate_cvs
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'interviewer', 'admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'hr'
      AND uploaded_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS candidate_cvs_insert ON candidate_cvs;
CREATE POLICY candidate_cvs_insert ON candidate_cvs
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_cvs_update ON candidate_cvs;
CREATE POLICY candidate_cvs_update ON candidate_cvs
  FOR UPDATE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  ) WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_cvs_delete ON candidate_cvs;
CREATE POLICY candidate_cvs_delete ON candidate_cvs
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- job_applications
-- SELECT: recruiter, interviewer, admin, super_admin OR hr with own created
-- INSERT: hr, interviewer, admin, super_admin
-- UPDATE: recruiter, interviewer, admin, super_admin
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS job_applications_select ON job_applications;
CREATE POLICY job_applications_select ON job_applications
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'interviewer', 'admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'hr'
      AND created_by = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS job_applications_insert ON job_applications;
CREATE POLICY job_applications_insert ON job_applications
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS job_applications_update ON job_applications;
CREATE POLICY job_applications_update ON job_applications
  FOR UPDATE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'interviewer', 'admin', 'super_admin')
  ) WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS job_applications_delete ON job_applications;
CREATE POLICY job_applications_delete ON job_applications
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- candidate_screenings
-- SELECT: hr, recruiter, interviewer, admin, super_admin
-- INSERT: admin, super_admin (service role used by Edge Functions)
-- UPDATE: recruiter, admin, super_admin
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS candidate_screenings_select ON candidate_screenings;
CREATE POLICY candidate_screenings_select ON candidate_screenings
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'recruiter', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_screenings_insert ON candidate_screenings;
CREATE POLICY candidate_screenings_insert ON candidate_screenings
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_screenings_update ON candidate_screenings;
CREATE POLICY candidate_screenings_update ON candidate_screenings
  FOR UPDATE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  ) WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_screenings_delete ON candidate_screenings;
CREATE POLICY candidate_screenings_delete ON candidate_screenings
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- candidate_status_history
-- SELECT: hr, recruiter, interviewer, admin, super_admin
-- INSERT: recruiter, admin, super_admin (API uses service role for hr/interviewer)
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS candidate_status_history_select ON candidate_status_history;
CREATE POLICY candidate_status_history_select ON candidate_status_history
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('hr', 'recruiter', 'interviewer', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_status_history_insert ON candidate_status_history;
CREATE POLICY candidate_status_history_insert ON candidate_status_history
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS candidate_status_history_delete ON candidate_status_history;
CREATE POLICY candidate_status_history_delete ON candidate_status_history
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- interview_schedules
-- SELECT: recruiter, admin, super_admin OR interviewer for their own schedules
-- INSERT/UPDATE: recruiter, admin, super_admin
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS interview_schedules_select ON interview_schedules;
CREATE POLICY interview_schedules_select ON interview_schedules
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'interviewer'
      AND interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS interview_schedules_insert ON interview_schedules;
CREATE POLICY interview_schedules_insert ON interview_schedules
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS interview_schedules_update ON interview_schedules;
CREATE POLICY interview_schedules_update ON interview_schedules
  FOR UPDATE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  ) WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
  );

DROP POLICY IF EXISTS interview_schedules_delete ON interview_schedules;
CREATE POLICY interview_schedules_delete ON interview_schedules
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );

-- ============================================================
-- interview_results
-- SELECT: recruiter, admin, super_admin OR interviewer for their own schedules
-- INSERT: admin, super_admin OR interviewer for their own schedules
-- DELETE: admin, super_admin
-- ============================================================

DROP POLICY IF EXISTS interview_results_select ON interview_results;
CREATE POLICY interview_results_select ON interview_results
  FOR SELECT USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('recruiter', 'admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'interviewer'
      AND interview_schedule_id IN (
        SELECT id FROM interview_schedules
        WHERE interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS interview_results_insert ON interview_results;
CREATE POLICY interview_results_insert ON interview_results
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
    OR (
      (SELECT role FROM users WHERE auth_id = auth.uid()) = 'interviewer'
      AND interview_schedule_id IN (
        SELECT id FROM interview_schedules
        WHERE interviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS interview_results_delete ON interview_results;
CREATE POLICY interview_results_delete ON interview_results
  FOR DELETE USING (
    (SELECT role FROM users WHERE auth_id = auth.uid())
    IN ('admin', 'super_admin')
  );
