
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('*');
        
        if (error) {
          console.error('Erro ao buscar feature flags:', error);
          return;
        }
        
        setFlags(data || []);
      } catch (error) {
        console.error('Erro ao carregar feature flags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, []);

  const isEnabled = (flagName: string): boolean => {
    const flag = flags.find(f => f.name === flagName);
    return flag?.enabled || false;
  };

  return {
    flags,
    loading,
    isEnabled
  };
};
