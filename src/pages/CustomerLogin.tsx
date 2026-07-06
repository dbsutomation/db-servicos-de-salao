import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient as supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (signInErr) throw signInErr;

      const userId = data.user?.id;
      if (!userId) throw new Error('Falha ao autenticar.');

      const { data: customer } = await supabase
        .from('customers' as any).select('name, salon_id').eq('id', userId).maybeSingle();

      if (customer && (customer as any).name) {
        navigate('/minha-agenda');
        return;
      }

      // Verificar se é profissional/gerente
      const { data: internalUser } = await supabase
        .from('users').select('id').eq('id', userId).maybeSingle();

      await supabase.auth.signOut();
      setError(internalUser
        ? 'Esta conta é de profissional. Use o login interno do salão.'
        : 'Conta não encontrada. Verifique seu email ou cadastre-se.');
    } catch (e: any) {
      setError(e.message || 'Erro ao entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast({ title: 'Digite seu email primeiro', variant: 'destructive' });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
    } catch (e: any) {
      toast({ title: 'Erro ao enviar email', description: e.message, variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-salon-purple/10 flex items-center justify-center mb-2">
            <span className="text-salon-purple font-bold text-lg">✂</span>
          </div>
          <CardTitle className="text-salon-purple">Portal do Cliente</CardTitle>
          <CardDescription>Entre com sua conta para agendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Email de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" className="pr-10" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="flex flex-col gap-2 pt-2 text-center text-sm">
            <button type="button" onClick={handleReset} disabled={resetting}
              className="text-salon-purple hover:underline disabled:opacity-50">
              {resetting ? 'Enviando…' : 'Esqueci minha senha'}
            </button>
            <p className="text-muted-foreground">
              Primeiro acesso?{' '}
              <span className="text-salon-purple font-medium">
                Use o link enviado pelo salão para se cadastrar.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
