import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

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
  const { login, isAuthenticated }  = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const success = await login(values.email, values.password);
      // O AuthContext já faz o navigate correto (/ ou /redefinir-senha?obrigatorio=true)
      // Não navegamos aqui para não sobrescrever o redirecionamento de 1º acesso
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">Acesso ao sistema</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSent && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Email de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPass ? 'text' : 'password'}
                          placeholder="Digite sua senha"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field} />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <button type="button" onClick={handleReset} disabled={resetting}
            className="text-sm text-salon-purple hover:underline disabled:opacity-50">
            {resetting ? 'Enviando…' : 'Esqueci minha senha'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Caso não possua acesso, entre em contato com o gerente do salão.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
