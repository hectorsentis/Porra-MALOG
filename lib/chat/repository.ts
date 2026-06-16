import { createClient } from "@supabase/supabase-js";

export type ChatMessageDto = {
  id: number;
  alias: string;
  contenido: string;
  creadoEn: string;
};

type ChatUserRow = {
  id: string;
  email: string;
  alias: string;
  password_hash: string;
  creado_en: string;
  ultimo_login: string | null;
};

type ChatMessageRow = {
  id: number;
  usuario_id: string;
  alias: string;
  contenido: string;
  creado_en: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function supabaseServiceRole() {
  return process.env.SUPABASE_SERVICE_ROLE ?? process.env.NEXT_SUPABASE_SECRET_KEY ?? "";
}

export function hasSupabaseChatConfig() {
  return Boolean(supabaseUrl() && supabaseServiceRole());
}

function supabaseAdmin() {
  if (!hasSupabaseChatConfig()) throw new Error("Supabase chat config is missing");
  return createClient(supabaseUrl(), supabaseServiceRole(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function findChatUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin()
    .from("tbl_chat_usuarios")
    .select("id,email,alias,password_hash,creado_en,ultimo_login")
    .eq("email", normalizeEmail(email))
    .maybeSingle<ChatUserRow>();

  if (error) throw error;
  return data;
}

export async function createChatUser(email: string, alias: string, passwordHash: string) {
  const { data, error } = await supabaseAdmin()
    .from("tbl_chat_usuarios")
    .insert({ email: normalizeEmail(email), alias, password_hash: passwordHash })
    .select("id,email,alias,password_hash,creado_en,ultimo_login")
    .single<ChatUserRow>();

  if (error) throw error;
  return data;
}

export async function markChatUserLogin(userId: string) {
  const { error } = await supabaseAdmin()
    .from("tbl_chat_usuarios")
    .update({ ultimo_login: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

export async function getChatUserById(userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("tbl_chat_usuarios")
    .select("id,alias")
    .eq("id", userId)
    .maybeSingle<{ id: string; alias: string }>();

  if (error) throw error;
  return data;
}

export async function listMessages() {
  const { data, error } = await supabaseAdmin()
    .from("tbl_chat_mensajes")
    .select("id,usuario_id,alias,contenido,creado_en")
    .order("id", { ascending: false })
    .limit(100)
    .returns<ChatMessageRow[]>();

  if (error) throw error;
  return [...(data ?? [])].reverse().map(toMessageDto);
}

export async function countRecentMessages(userId: string) {
  const since = new Date(Date.now() - 10_000).toISOString();
  const { count, error } = await supabaseAdmin()
    .from("tbl_chat_mensajes")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", userId)
    .gte("creado_en", since);

  if (error) throw error;
  return count ?? 0;
}

export async function createMessage(userId: string, alias: string, contenido: string) {
  const { data, error } = await supabaseAdmin()
    .from("tbl_chat_mensajes")
    .insert({ usuario_id: userId, alias, contenido })
    .select("id,usuario_id,alias,contenido,creado_en")
    .single<ChatMessageRow>();

  if (error) throw error;
  return toMessageDto(data);
}

function toMessageDto(row: ChatMessageRow): ChatMessageDto {
  return {
    id: row.id,
    alias: row.alias,
    contenido: row.contenido,
    creadoEn: row.creado_en
  };
}
