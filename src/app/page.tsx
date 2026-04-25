"use client";

import { LogIn, Loader2 } from "lucide-react";
import { loginWithEmail } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, initAuth } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!email || !password) {
      setErrorMsg("Preencha todos os campos.");
      return;
    }

    try {
      setIsLoggingIn(true);
      await loginWithEmail(email, password);
      // useAuth pegará a mudança de estado e o push ocorrerá no useEffect
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Credenciais inválidas ou erro ao conectar.");
      setIsLoggingIn(false);
    }
  };

  // Previne renderização completa antes do cliente estar ativo (evita falha de SSR)
  if (!mounted) {
    return (
      <main className="flex-1 flex w-full items-center justify-center p-4 bg-bg">
         <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex w-full items-center justify-center p-4">
      <div className="card max-w-md w-full p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-2">
          {loading ? <Loader2 className="w-10 h-10 animate-spin" /> : <LogIn className="w-10 h-10" />}
        </div>
        
        <div>
          <h1 className="text-2xl font-heading font-black tracking-wider text-text uppercase">Tripla Eventos</h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Painel Administrativo v2.0
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="E-mail corporativo" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            disabled={isLoggingIn || loading}
          />
          <input 
            type="password" 
            placeholder="Senha secreta" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            disabled={isLoggingIn || loading}
          />
          
          {errorMsg && <p className="text-red text-sm font-semibold">{errorMsg}</p>}

          <button 
            type="submit"
            disabled={isLoggingIn || loading}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {(isLoggingIn || loading) && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Conectando..." : isLoggingIn ? "Autenticando..." : "Entrar no Painel"}
          </button>
        </form>

        <p className="text-xs text-muted mt-4">
          Acesso restrito a colaboradores Tripla autorizados.
        </p>
      </div>
    </main>
  );
}
