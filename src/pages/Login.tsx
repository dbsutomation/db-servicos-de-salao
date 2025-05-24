
import React, { useState, useEffect } from 'react';
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

const formSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
  name: z.string().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar a conexão com o Supabase
    const checkConnection = async () => {
      try {
        console.log('Verificando conexão com Supabase...');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
          console.error('Erro na conexão com Supabase:', error);
          toast({
            title: "Erro de conexão",
            description: "Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.",
            variant: "destructive",
          });
        } else {
          console.log('Conexão com Supabase estabelecida com sucesso.');
        }
      } catch (err) {
        console.error('Erro ao verificar conexão:', err);
      }
    };

    checkConnection();

    // Redirecionar para a página inicial se já estiver autenticado
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    console.log('Tentando fazer login com:', values.email);
    try {
      const success = await login(values.email, values.password);
      console.log('Resultado do login:', success);
      if (success) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro completo durante login:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    const email = form.getValues('email');
    const password = form.getValues('password');
    const name = form.getValues('name');
    
    if (!email || !password) {
      toast({
        title: "Campos incompletos",
        description: "Preencha email e senha para se registrar",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && !name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha seu nome para se cadastrar",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Tentando cadastrar usuário:', email);
      // Primeiro, crie o usuário na autenticação do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          }
        }
      });
      
      if (authError) {
        console.error('Erro na autenticação:', authError);
        toast({
          title: "Erro no cadastro",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }
      
      // Se a autenticação for bem-sucedida, o trigger no Supabase deve criar o usuário na tabela users
      // ou podemos inserir manualmente aqui para garantir
      if (authData.user) {
        console.log('Usuário autenticado criado, ID:', authData.user.id);
        const { error: usersError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: name || email.split('@')[0],
            email: email,
            has_access: true,
            is_manager: false
          });
          
        if (usersError) {
          console.error("Erro ao inserir na tabela users:", usersError);
          // Podemos continuar mesmo com esse erro, já que o usuário foi criado na autenticação
        } else {
          console.log('Usuário inserido na tabela users com sucesso');
        }
      }
      
      toast({
        title: "Cadastro realizado",
        description: "Sua conta foi criada com sucesso. Entre em contato com o gerente para obter acesso ao sistema.",
      });
      
      setIsSignUp(false);
    } catch (error: any) {
      console.error('Erro completo durante cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center font-bold">Acesso ao sistema</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? 'Crie sua conta para acessar o sistema' : 'Entre com suas credenciais para acessar o sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isSignUp && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
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
                      <Input type="password" placeholder="Digite sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isSignUp && (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isSignUp ? (
            <>
              <Button 
                className="w-full bg-salon-purple hover:bg-salon-dark-purple" 
                onClick={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => setIsSignUp(false)}
                disabled={isLoading}
              >
                Já tem acesso, faça login
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="link" 
                className="w-full" 
                onClick={() => setIsSignUp(true)}
                disabled={isLoading}
              >
                Não tem acesso, cadastre-se
              </Button>
              <p className="text-center text-sm text-gray-500">
                Caso não possua acesso, entre em contato com o gerente.
              </p>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
