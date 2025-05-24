
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { User, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import WeeklyCalendar from '@/components/Scheduling/WeeklyCalendar';

const Scheduling = () => {
  const { currentUser } = useAuth();
  const { isEnabled, loading: flagsLoading } = useFeatureFlags();
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flagsLoading && !isEnabled('scheduling_system')) {
      toast({
        title: "Sistema indisponível",
        description: "O sistema de agendamento está temporariamente desabilitado.",
        variant: "destructive",
      });
      return;
    }

    const fetchProfessionals = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_type', 'professional')
          .eq('has_access', true);

        if (error) {
          console.error('Erro ao buscar profissionais:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os profissionais.",
            variant: "destructive",
          });
          return;
        }

        const professionalsData = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          profession: user.profession || '',
          phone: user.phone || '',
          password: '',
          hasAccess: user.has_access,
          isManager: user.is_manager,
          avatar: user.avatar || '',
          userType: user.user_type as 'professional' | 'client'
        }));

        setProfessionals(professionalsData);
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!flagsLoading) {
      fetchProfessionals();
    }
  }, [flagsLoading, isEnabled]);

  if (flagsLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salon-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sistema de agendamento...</p>
        </div>
      </div>
    );
  }

  if (!isEnabled('scheduling_system')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sistema Indisponível</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              O sistema de agendamento está temporariamente desabilitado.
            </p>
            <p className="text-sm text-gray-500">
              Entre em contato com o salão para agendar seus serviços.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedProfessional) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedProfessional(null)}
            >
              ← Voltar aos Profissionais
            </Button>
            <h1 className="text-2xl font-bold text-salon-purple">
              Agenda - {selectedProfessional.name}
            </h1>
          </div>
          
          <WeeklyCalendar professional={selectedProfessional} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-salon-purple mb-2">
            Sistema de Agendamento
          </h1>
          <p className="text-gray-600">
            Olá, {currentUser?.name}! Selecione um profissional para agendar seus serviços.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((professional) => (
            <Card 
              key={professional.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-salon-purple"
              onClick={() => setSelectedProfessional(professional)}
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 rounded-full bg-salon-purple/10 flex items-center justify-center mx-auto mb-4">
                  {professional.avatar ? (
                    <img 
                      src={professional.avatar} 
                      alt={professional.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-salon-purple" />
                  )}
                </div>
                <CardTitle className="text-lg">{professional.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">{professional.profession}</p>
                <Button className="w-full bg-salon-purple hover:bg-salon-dark-purple">
                  Ver Agenda
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {professionals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <User size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Profissional Disponível</h3>
              <p className="text-gray-600">
                Não há profissionais disponíveis para agendamento no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Scheduling;
