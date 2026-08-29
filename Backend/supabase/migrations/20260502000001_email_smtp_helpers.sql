-- Helper RPCs for encrypting/decrypting SMTP password via pgcrypto
-- SECURITY DEFINER so they bypass RLS; app-layer enforces admin-only

CREATE OR REPLACE FUNCTION public.encrypt_smtp_password(plaintext text, master_key text)
RETURNS bytea LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_encrypt(plaintext, master_key);
$$;

CREATE OR REPLACE FUNCTION public.decrypt_smtp_password(master_key text)
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT pgp_sym_decrypt(smtp_password_encrypted, master_key)::text
  FROM public.email_provider_config
  WHERE smtp_password_encrypted IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.encrypt_smtp_password(text, text) FROM public;
REVOKE ALL ON FUNCTION public.decrypt_smtp_password(text) FROM public;
GRANT EXECUTE ON FUNCTION public.encrypt_smtp_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_smtp_password(text) TO authenticated;
