import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, BarChart3, Eye, EyeOff, HelpCircle, Lock, Mail, Percent, Scissors, ShoppingCart, User, Users } from 'lucide-react';
import DashboardTeaser from '@/components/Login/DashboardTeaser';
import salonBg from '@/assets/salon-moderno-espelhos.png.asset.json';

const features = [
  { icon: Users, title: 'Clientes', text: 'Cadastre e gerencie seus clientes' },
  { icon: Scissors, title: 'Serviços e Produtos', text: 'Organize seu catálogo' },
  { icon: User, title: 'Profissionais', text: 'Gerencie sua equipe' },
  { icon: ShoppingCart, title: 'Carrinho', text: 'Registre atendimentos rápido' },
  { icon: Percent, title: 'Comissões', text: 'Acompanhe as comissões' },
  { icon: BarChart3, title: 'Financeiro', text: 'Acompanhe o faturamento' },
];

const formSchema = z.object({
  email:    z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
});
type LoginFormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [isLoading, setIsLoading]   = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [resetSent, setResetSent]   = useState(false);
  const { login, isLoading: resolvingAccess } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
    } catch (error: any) {
      toast({ title: 'Erro ao fazer login', description: error.message || 'Ocorreu um erro inesperado', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    const email = form.getValues('email');
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Foto do salão enviada pelo usuário: cor original, cover, centrada */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${salonBg.url})` }}
      />
      {/* Camada branca bem suave só onde o texto institucional fica */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-background/70 via-background/25 to-transparent" />
      <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-background/75 via-background/30 to-transparent" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center p-4 sm:p-8"><div className="grid w-full items-center gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-stretch lg:gap-12">
        {/* Marca + prévia ilustrativa */}
        <section className="space-y-6 lg:flex lg:flex-col lg:justify-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight"><span className="text-primary">DB</span>-Automation</p>
            <p className="text-sm text-foreground/70">Gestão para salões de beleza</p>
            <span className="mt-3 block h-1 w-10 rounded-full bg-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
              Gestão completa<br />para o <span className="text-primary">seu salão.</span>
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-foreground/80">
              Organize clientes, serviços, profissionais, carrinho, comissões e indicadores financeiros em um só sistema.
            </p>
          </div>
          <div className="hidden md:block"><DashboardTeaser /></div>
          <div className="hidden md:grid grid-cols-3 gap-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-2 rounded-xl border bg-card p-2.5 shadow-sm">
                <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Login */}
        <section className="w-full max-w-md justify-self-center lg:justify-self-end lg:self-stretch lg:flex lg:flex-col lg:justify-center rounded-2xl border bg-card p-6 sm:p-10 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary"><Lock size={28} /></span>
            <h2 className="text-2xl sm:text-3xl font-bold">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-muted-foreground">Entre com suas credenciais para acessar o sistema de gestão.</p>
          </div>
          {resetSent && (
            <div className="mb-4 rounded-md border border-primary/20 bg-accent p-3 text-sm text-accent-foreground">
              Email de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="seu@email.com" autoComplete="email" className="h-12 pl-10 bg-muted/50" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input type={showPass ? 'text' : 'password'}
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          className="h-12 pl-10 pr-11 bg-muted/50"
                          {...field} />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                          aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="h-12 w-full text-base" disabled={isLoading || resolvingAccess}>
                {isLoading || resolvingAccess ? 'Entrando...' : <>Entrar <ArrowRight size={18} /></>}
              </Button>
            </form>
          </Form>
          <div className="mt-5 text-center">
            <button type="button" onClick={handleReset} disabled={resetting}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
              {resetting ? 'Enviando…' : 'Esqueci minha senha'}
            </button>
          </div>
          <div className="mt-6 flex gap-3 rounded-xl border-t bg-muted/50 p-4">
            <HelpCircle size={22} className="shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Precisa de acesso?</p>
              <p className="text-sm text-muted-foreground">Caso não possua acesso, entre em contato com o responsável pelo estabelecimento.</p>
            </div>
          </div>
        </section>
      </div></div>
    </div>
  );
};

export default Login;
