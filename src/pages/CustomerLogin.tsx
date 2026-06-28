import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

type Stage =
  | { kind: 'form' }
  | { kind: 'welcome'; name: string }
  | { kind: 'error'; message: string };

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: 'form' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error('Falha ao autenticar.');

      const { data: customer } = await supabase
        .from('customers' as any)
        .select('name')
        .eq('id', userId)
        .maybeSingle();

      if (customer && (customer as any).name) {
        setStage({ kind: 'welcome', name: (customer as any).name });
        return;
      }

      // Não é customer — verificar se é profissional/gerente
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      await supabase.auth.signOut();
      if (internalUser) {
        setStage({
          kind: 'error',
          message: 'Esta conta é de profissional/gerente. Use a tela de login interna.',
        });
      } else {
        setStage({
          kind: 'error',
          message: 'Conta não encontrada como cliente. Cadastre-se usando o link enviado pelo salão.',
        });
      }
    } catch (e: any) {
      toast({ title: 'Erro no login', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (stage.kind === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Bem-vindo(a), {stage.name}!</CardTitle>
            <CardDescription>Sua agenda estará disponível em breve.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Login do Cliente</CardTitle>
          <CardDescription>Acesse sua conta de cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {stage.kind === 'error' && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {stage.message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
