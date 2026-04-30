"use client";

import { LogIn, Loader2, UserPlus, ArrowLeft, CheckCircle } from "lucide-react";
import { loginWithEmail, registerWithEmail } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading, initAuth } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerSuccess, setRegisterSuccess] = useState(false);

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
      if (err?.message === 'PENDING_APPROVAL') {
        setErrorMsg("Sua conta está aguardando aprovação de um administrador.");
      } else {
        setErrorMsg("Credenciais inválidas ou erro ao conectar.");
      }
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nome.trim() || !email || !password) {
      setErrorMsg("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setIsLoggingIn(true);
      await registerWithEmail(email, password, nome.trim());
      setRegisterSuccess(true);
      setIsLoggingIn(false);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg("Este e-mail já está cadastrado.");
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg("E-mail inválido.");
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg("Senha muito fraca. Use pelo menos 6 caracteres.");
      } else {
        setErrorMsg("Erro ao criar conta. Tente novamente.");
      }
      setIsLoggingIn(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setErrorMsg("");
    setRegisterSuccess(false);
    setNome("");
    setEmail("");
    setPassword("");
  };

  const switchToRegister = () => {
    setMode('register');
    setErrorMsg("");
    setRegisterSuccess(false);
    setNome("");
    setEmail("");
    setPassword("");
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
    <main className="flex-1 flex w-full items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(var(--accent-rgb,59,130,246),0.08)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.08)_0%,transparent_60%)]" />

      <div className="card max-w-md w-full p-8 flex flex-col items-center text-center space-y-6 animate-premium-slide">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-2 transition-all duration-300">
          {loading ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : registerSuccess ? (
            <CheckCircle className="w-10 h-10 text-green" />
          ) : mode === 'login' ? (
            <LogIn className="w-10 h-10" />
          ) : (
            <UserPlus className="w-10 h-10" />
          )}
        </div>
        
        <div>
          <h1 className="text-2xl font-heading font-black tracking-wider text-text uppercase">Tripla Eventos</h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            {registerSuccess 
              ? "Conta criada com sucesso!" 
              : mode === 'login' 
                ? "Painel Administrativo v2.0" 
                : "Criar nova conta"
            }
          </p>
        </div>

        {/* Registration Success State */}
        {registerSuccess ? (
          <div className="w-full flex flex-col gap-4 animate-premium-fade">
            <div className="bg-green/10 border border-green/20 rounded-xl p-4 text-left">
              <p className="text-green text-sm font-semibold mb-1">Conta criada com sucesso!</p>
              <p className="text-muted text-sm leading-relaxed">
                Sua conta foi registrada e está aguardando aprovação de um administrador. 
                Você receberá acesso assim que for aprovado.
              </p>
            </div>
            <button 
              onClick={switchToLogin}
              className="btn-primary w-full flex items-center justify-center gap-3 mt-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Login
            </button>
          </div>
        ) : mode === 'login' ? (
          <>
            {/* Login Form */}
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

            <div className="w-full border-t border-border pt-4">
              <button 
                onClick={switchToRegister}
                className="text-sm text-accent hover:text-accent-hover font-semibold transition-colors flex items-center justify-center gap-2 w-full py-2 rounded-lg hover:bg-accent/5"
              >
                <UserPlus className="w-4 h-4" />
                Criar uma conta
              </button>
            </div>

            <p className="text-xs text-muted mt-2">
              Acesso restrito a colaboradores Tripla autorizados.
            </p>
          </>
        ) : (
          <>
            {/* Register Form */}
            <form onSubmit={handleRegister} className="w-full flex flex-col gap-4 animate-premium-fade">
              <input 
                type="text" 
                placeholder="Seu nome completo" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-base"
                disabled={isLoggingIn}
              />
              <input 
                type="email" 
                placeholder="E-mail corporativo" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                disabled={isLoggingIn}
              />
              <input 
                type="password" 
                placeholder="Criar senha (mínimo 6 caracteres)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-base"
                disabled={isLoggingIn}
              />
              
              {errorMsg && <p className="text-red text-sm font-semibold">{errorMsg}</p>}

              <div className="bg-amber/10 border border-amber/20 rounded-xl p-3 text-left">
                <p className="text-amber text-xs font-semibold leading-relaxed">
                  ⚠️ Após o cadastro, um administrador precisará aprovar sua conta antes que você possa acessar o sistema.
                </p>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoggingIn ? "Criando conta..." : "Criar Conta"}
              </button>
            </form>

            <div className="w-full border-t border-border pt-4">
              <button 
                onClick={switchToLogin}
                className="text-sm text-muted hover:text-text font-semibold transition-colors flex items-center justify-center gap-2 w-full py-2 rounded-lg hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4" />
                Já tenho uma conta
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
