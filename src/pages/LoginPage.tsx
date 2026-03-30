import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success('Conta criada! Verifique o seu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success('Login efetuado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AgroSense</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Monitoramento Agrícola IoT</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">{isSignUp ? 'Criar Conta' : 'Acesso ao Sistema'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Preencha os dados para criar uma conta' : 'Entre com as suas credenciais'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="admin@agrosense.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Palavra-passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Criar agora'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Comunicação via MQTT sobre HTTPS/TLS • Arquitetura IoT Desacoplada
        </p>
      </div>
    </div>
  );
}
