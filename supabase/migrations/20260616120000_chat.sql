CREATE TABLE IF NOT EXISTS tbl_chat_usuarios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  alias         text NOT NULL,
  password_hash text NOT NULL,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  ultimo_login  timestamptz
);

CREATE TABLE IF NOT EXISTS tbl_chat_mensajes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  uuid NOT NULL REFERENCES tbl_chat_usuarios(id),
  alias       text NOT NULL,
  contenido   text NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 1000),
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_creado ON tbl_chat_mensajes(creado_en);

ALTER TABLE tbl_chat_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_chat_mensajes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tbl_chat_mensajes'
      AND policyname = 'chat_messages_read_authenticated'
  ) THEN
    CREATE POLICY chat_messages_read_authenticated
      ON tbl_chat_mensajes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tbl_chat_mensajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tbl_chat_mensajes;
  END IF;
END $$;
