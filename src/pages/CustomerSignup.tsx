import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { formatPhoneMask, normalizePhone, toTitleCase } from '@/lib/formatters';

export default function CustomerSignup() {
  const { salonId } = useParams<{ salonId: string }>();
  const [salonName, setSalonName] = useState<string>('');
  const [salonChecked, setSalonChecked] = useState(false);
  const [salonValid, setSalonValid] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (!salonId) {
        setSalonChecked(true);
        return;
      }
      const { data } = await supabase
        .from('salons' as any)
        .select('name')
        .eq('id', salonId)
        .maybeSingle();
      if (data && (data as any).name) {
        setSalonName((data as any).name);
        setSalonValid(true);
      }
      setSalonChecked(true);
    })();
  }, [salonId]);

  const validate = (): string | null => {
    if (!name.trim()) return 'Informe seu nome.';
    const digits = normalizePhone(phone);
    if (digits.length < 10) return 'Telefone inválido. Use (DD) NNNNN-NNNN.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Email inválido.';
    if (password.length < 6) return 'Senha precisa ter ao menos 6 caracteres.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: 'Dados inválidos', description: err, variant: 'destructive' });
      return;
    }
    if (!salonId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login-cliente`,
          data: {
            name: toTitleCase(name),
            phone: normalizePhone(phone),
            is_customer: true,
            salon_id: salonId,
          },
        },
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      toast({ title: 'Erro no cadastro', description: e.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!salonChecked) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!salonValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>O salão informado não existe ou o link está incorreto.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Cadastro realizado!</CardTitle>
            <CardDescription>
              Em breve você poderá agendar seus horários por aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login-cliente">
              <Button variant="outline">Ir para o login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Cadastro de Cliente</CardTitle>
          <CardDescription>{salonName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                value={phone}
                onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                required
              />
            </div>
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
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Cadastrando…' : 'Criar conta'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem cadastro? <Link to="/login-cliente" className="underline">Entrar</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
