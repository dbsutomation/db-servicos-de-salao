
import { useState, useEffect } from 'react';
import { Service, TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { fetchTeamMembers } from '@/services/teamService';

export const useFilteredServices = (selectedProfessionalId?: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
        
        if (servicesError) throw servicesError;
        
        const typedServices = servicesData?.map(service => ({
          ...service,
          type: service.type === 'produto' ? 'produto' as const : 'servico' as const,
          price: Number(service.price),
          commission: Number(service.commission),
          duration: service.duration || 60
        })) || [];

        // Fetch team members
        const members = await fetchTeamMembers();
        setTeamMembers(members);

        // Filter services based on selected professional
        if (selectedProfessionalId) {
          const professional = members.find(member => member.id === selectedProfessionalId);
          if (professional && professional.categories) {
            const filteredServices = typedServices.filter(service => 
              service.category && professional.categories!.includes(service.category)
            );
            setServices(filteredServices);
          } else {
            setServices([]);
          }
        } else {
          setServices(typedServices);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProfessionalId]);

  return {
    services,
    teamMembers,
    loading
  };
};

export default useFilteredServices;
