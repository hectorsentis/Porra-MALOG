"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { LogOut, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChatMessage = {
  id: number;
  alias: string;
  contenido: string;
  creadoEn: string;
};

type ChatUser = {
  alias: string;
};

type AuthMode = "login" | "register";

export function ChatPanel() {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const response = await fetch("/api/chat/session", { cache: "no-store" });
      const data = await response.json();
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    loadSession().catch(() => {
      if (active) {
        setStatus("No se pudo comprobar la sesion.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let channel: RealtimeChannel | null = null;

    async function loadMessages() {
      const response = await fetch("/api/chat/messages", { cache: "no-store" });
      if (response.status === 401) {
        setUser(null);
        return;
      }
      const data = await response.json();
      if (!active || !Array.isArray(data.messages)) return;
      setMessages((current) => mergeMessages(current, data.messages));
    }

    async function subscribeToMessages() {
      const response = await fetch("/api/chat/realtime-token", { cache: "no-store" });
      if (!response.ok) return;
      const config = await response.json();
      if (!config.supabaseUrl || !config.supabaseAnonKey || !config.realtimeToken || !active) return;

      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      supabase.realtime.setAuth(config.realtimeToken);
      channel = supabase
        .channel("porra-chat-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "tbl_chat_mensajes" },
          (payload) => {
            const row = payload.new as { id: number; alias: string; contenido: string; creado_en: string };
            setMessages((current) => mergeMessages(current, [{ id: row.id, alias: row.alias, contenido: row.contenido, creadoEn: row.creado_en }]));
          }
        )
        .subscribe();
    }

    loadMessages().catch(() => setStatus("No se pudieron cargar los mensajes."));
    subscribeToMessages().catch(() => setStatus("No se pudo activar el directo del chat."));

    return () => {
      active = false;
      channel?.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const endpoint = mode === "login" ? "/api/chat/login" : "/api/chat/register";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error ?? "No se pudo completar la operacion.");
      return;
    }

    setUser(data.user);
    setEmail("");
    setPassword("");
    setMessages([]);
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contenido = draft.trim();
    if (!contenido || contenido.length > 1000) {
      setStatus("El mensaje debe tener entre 1 y 1000 caracteres.");
      return;
    }

    setSending(true);
    setStatus("");
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido })
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setStatus(data.error ?? "No se pudo enviar el mensaje.");
      return;
    }

    setDraft("");
    setMessages((current) => mergeMessages(current, [data.message]));
  }

  async function logout() {
    await fetch("/api/chat/logout", { method: "POST" });
    setUser(null);
    setMessages([]);
    setDraft("");
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-slate-600">Cargando chat...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{mode === "login" ? "Login" : "Registro"}</CardTitle>
          <div className="flex gap-2">
            <button type="button" className={tabClass(mode === "login")} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={tabClass(mode === "register")} onClick={() => setMode("register")}>Registro</button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-xl gap-4" onSubmit={submitAuth}>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Email
              <input className="h-11 rounded-md border border-slate-200 px-3 text-slate-950" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Password
              <input className="h-11 rounded-md border border-slate-200 px-3 text-slate-950" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 8 : 1} required />
            </label>
            {status ? <p className="text-sm font-semibold text-air-down">{status}</p> : null}
            <Button className="w-fit">{mode === "login" ? "Entrar" : "Registrarme"}</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Conectado como <span className="font-bold text-primary">{user.alias}</span></p>
          <Button type="button" variant="secondary" onClick={logout}><LogOut className="mr-2 h-4 w-4" aria-hidden />Salir</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[58vh] min-h-[360px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
            {messages.length === 0 ? <p className="text-sm text-slate-600">Todavia no hay mensajes.</p> : null}
            <div className="grid gap-3">
              {messages.map((message) => (
                <article key={message.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold uppercase text-primary">{message.alias}</span>
                    <time className="text-xs text-slate-500" dateTime={message.creadoEn}>{formatTime(message.creadoEn)}</time>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{message.contenido}</p>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <form className="mt-4 grid gap-2" onSubmit={submitMessage}>
            <textarea
              className="min-h-24 resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-950"
              maxLength={1000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`text-xs font-semibold ${draft.trim().length > 1000 ? "text-air-down" : "text-slate-500"}`}>{draft.trim().length}/1000</span>
              {status ? <p className="text-sm font-semibold text-air-down">{status}</p> : null}
              <Button className="ml-auto" disabled={sending || draft.trim().length === 0 || draft.trim().length > 1000}>
                <Send className="mr-2 h-4 w-4" aria-hidden />
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function tabClass(active: boolean) {
  return `rounded-md border px-3 py-2 text-sm font-semibold ${
    active ? "border-primary bg-primary text-[#FFFFFF]" : "border-slate-200 bg-white text-slate-700"
  }`;
}
