-- Create user_face_embeddings table
CREATE TABLE IF NOT EXISTS public.user_face_embeddings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    embedding_json jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_face_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_face_embeddings_admin_all" ON public.user_face_embeddings 
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.auth_id = auth.uid() 
        AND users.role IN ('admin', 'super_admin', 'leader')
    )
);

CREATE POLICY "user_face_embeddings_select_own" ON public.user_face_embeddings 
FOR SELECT TO public USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.auth_id = auth.uid() 
        AND users.id = user_face_embeddings.user_id
    )
);

-- Create violation_alerts table
CREATE TABLE IF NOT EXISTS public.violation_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id varchar NOT NULL,
    violation_type varchar NOT NULL,
    severity varchar DEFAULT 'Medium',
    camera_location varchar,
    evidence_url varchar,
    status varchar DEFAULT 'pending_review',
    detected_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.violation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "violation_alerts_admin_all" ON public.violation_alerts 
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.auth_id = auth.uid() 
        AND users.role IN ('admin', 'super_admin', 'leader')
    )
);
