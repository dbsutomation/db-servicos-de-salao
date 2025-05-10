
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: 'Digite um email válido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoading } = useAuth();
  const { toast } = useToast();

  console.log("Login component rendered, isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Login: User is authenticated, redirecting to /");
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        console.log("Attempting login for:", values.email);
        const success = await login(values.email, values.password);
        
        if (success) {
          console.log("Login successful, waiting for auth state to update");
          // Auth state update will trigger the useEffect above for redirection
        }
      } else {
        // Registro
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.email.split('@')[0],
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Registro realizado com sucesso",
          description: "Sua conta foi criada. Por favor, faça login para continuar.",
        });
        
        // Mude para o formulário de login após o registro bem-sucedido
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: isLogin ? "Erro no login" : "Erro no registro",
        description: error.message || "Ocorreu um erro. Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar indicador de carregamento enquanto verifica a sessão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-salon-purple border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-salon-purple">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Entre com seus dados para acessar o sistema' : 'Preencha os dados abaixo para se cadastrar'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="seu@email.com" 
                      type="email" 
                      {...field} 
                      autoComplete={isLogin ? "username" : "email"} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Sua senha" 
                      type="password" 
                      {...field} 
                      autoComplete={isLogin ? "current-password" : "new-password"} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-salon-purple hover:bg-salon-dark-purple"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-salon-purple hover:underline text-sm"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
