import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseClient } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [isCustomer, setIsCustomer]   = useState(false);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) setIsCustomer(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const client = isCustomer ? supabaseClient : supabase;
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;

      // Zerar must_change_password se for profissional
      if (!isCustomer) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ must_change_password: false } as any)
            .eq('id', user.id);
        }
      }

      toast({ title: 'Senha redefinida com sucesso!' });
      navigate(isCustomer ? '/login-cliente' : '/');
    } catch (e: any) {
      toast({ title: 'Erro ao redefinir senha', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-salon-purple/10 flex items-center justify-center mb-2">
            <KeyRound className="text-salon-purple" size={22} />
          </div>
          <CardTitle>
            Redefinir senha
          </CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} className="pr-10"
                  placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <div className="relative">
                <Input id="confirm" type={showConfirm ? 'text' : 'password'}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  required minLength={6} className="pr-10"
                  placeholder="Repita a nova senha" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
