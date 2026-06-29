import { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { TeamMember } from '@/types';

interface DaySchedule {
  day_of_week: number;
  label: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  error?: string;
}

const DAYS: { day_of_week: number; label: string }[] = [
  { day_of_week: 1, label: 'Segunda-feira' },
  { day_of_week: 2, label: 'Terça-feira' },
  { day_of_week: 3, label: 'Quarta-feira' },
  { day_of_week: 4, label: 'Quinta-feira' },
  { day_of_week: 5, label: 'Sexta-feira' },
  { day_of_week: 6, label: 'Sábado' },
];

const emptySchedules = (): DaySchedule[] =>
  DAYS.map((d) => ({ ...d, is_active: false, start_time: '', end_time: '' }));

const ProfessionalSchedules = () => {
  const { currentUser } = useAuth();
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [schedules, setSchedules] = useState<DaySchedule[]>(emptySchedules());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isManager = currentUser?.isManager;

  // Load professionals (manager) or set self
  useEffect(() => {
    if (!currentUser) return;
    if (isManager) {
      (async () => {
        try {
          const salonId = await getCurrentSalonId();
          const { data, error } = await supabase
            .from('users')
            .select('id, name, profession, has_access, is_manager, phone, email, avatar, categories')
            .eq('salon_id', salonId)
            .order('name');
          if (error) throw error;
          const list: TeamMember[] = (data || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            profession: u.profession || '',
            phone: u.phone || '',
            password: '',
            hasAccess: u.has_access,
            isManager: u.is_manager,
            avatar: u.avatar || '',
            categories: u.categories || [],
          }));
          setProfessionals(list);
          setSelectedProfessionalId((prev) => prev || currentUser.id);
        } catch (e: any) {
          toast({ title: 'Erro', description: e.message, variant: 'destructive' });
        }
      })();
    } else {
      setSelectedProfessionalId(currentUser.id);
    }
  }, [currentUser, isManager]);

  // Load schedules when professional changes
  useEffect(() => {
    if (!selectedProfessionalId) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('professional_schedules')
          .select('day_of_week, start_time, end_time, is_active')
          .eq('professional_id', selectedProfessionalId);
        if (error) throw error;
        const base = emptySchedules();
        (data || []).forEach((row: any) => {
          const idx = base.findIndex((d) => d.day_of_week === row.day_of_week);
          if (idx >= 0) {
            base[idx] = {
              ...base[idx],
              is_active: row.is_active,
              start_time: (row.start_time || '').slice(0, 5),
              end_time: (row.end_time || '').slice(0, 5),
            };
          }
        });
        setSchedules(base);
      } catch (e: any) {
        toast({ title: 'Erro ao carregar horários', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedProfessionalId]);

  const updateDay = (day_of_week: number, patch: Partial<DaySchedule>) => {
    setSchedules((prev) =>
      prev.map((d) => (d.day_of_week === day_of_week ? { ...d, ...patch, error: undefined } : d))
    );
  };

  const validate = (): boolean => {
    let valid = true;
    setSchedules((prev) =>
      prev.map((d) => {
        if (!d.is_active) return { ...d, error: undefined };
        if (!d.start_time || !d.end_time) {
          valid = false;
          return { ...d, error: 'Preencha hora de início e fim.' };
        }
        if (d.end_time <= d.start_time) {
          valid = false;
          return { ...d, error: 'Hora fim deve ser maior que a hora início.' };
        }
        return { ...d, error: undefined };
      })
    );
    return valid;
  };

  const handleSave = async () => {
    if (!selectedProfessionalId) return;
    if (!validate()) {
      toast({ title: 'Corrija os erros antes de salvar', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const salonId = await getCurrentSalonId();
      const { data: existing, error: fetchErr } = await supabase
        .from('professional_schedules')
        .select('id, day_of_week')
        .eq('professional_id', selectedProfessionalId)
        .eq('salon_id', salonId);
      if (fetchErr) throw fetchErr;
      const existingMap = new Map<number, string>();
      (existing || []).forEach((r: any) => existingMap.set(r.day_of_week, r.id));

      for (const d of schedules) {
        const existingId = existingMap.get(d.day_of_week);

        if (!d.is_active) {
          if (existingId) {
            const { error } = await supabase
              .from('professional_schedules')
              .delete()
              .eq('id', existingId);
            if (error) throw error;
          }
          continue;
        }

        const payload: any = {
          professional_id: selectedProfessionalId,
          salon_id: salonId,
          day_of_week: d.day_of_week,
          is_active: true,
          start_time: d.start_time,
          end_time: d.end_time,
        };
        if (existingId) {
          const { error } = await supabase
            .from('professional_schedules')
            .update(payload)
            .eq('id', existingId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('professional_schedules')
            .insert(payload);
          if (error) throw error;
        }
      }

      toast({ title: 'Horários salvos com sucesso' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === selectedProfessionalId),
    [professionals, selectedProfessionalId]
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-salon-purple">Configurar horários de trabalho</h1>
          <p className="text-gray-600 mt-1">
            Defina os dias e horários em que {isManager ? 'o profissional' : 'você'} atende.
          </p>
        </div>

        {isManager && (
          <div className="max-w-md">
            <Label className="mb-2 block">Profissional</Label>
            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.profession ? `— ${p.profession}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProfessional && (
              <p className="text-sm text-gray-500 mt-2">
                Editando horários de <strong>{selectedProfessional.name}</strong>
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {schedules.map((d) => (
            <div
              key={d.day_of_week}
              className="border-2 border-gray-100 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex items-center gap-3 md:w-56">
                <Switch
                  checked={d.is_active}
                  onCheckedChange={(checked) => updateDay(d.day_of_week, { is_active: checked })}
                  disabled={loading}
                />
                <span className="font-medium">{d.label}</span>
              </div>

              <div className="flex flex-1 gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Início</Label>
                  <Input
                    type="time"
                    value={d.start_time}
                    disabled={!d.is_active || loading}
                    onChange={(e) => updateDay(d.day_of_week, { start_time: e.target.value })}
                    className={!d.is_active ? 'bg-gray-100 text-gray-400' : ''}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-600">Fim</Label>
                  <Input
                    type="time"
                    value={d.end_time}
                    disabled={!d.is_active || loading}
                    onChange={(e) => updateDay(d.day_of_week, { end_time: e.target.value })}
                    className={!d.is_active ? 'bg-gray-100 text-gray-400' : ''}
                  />
                </div>
              </div>

              {d.error && (
                <p className="text-sm text-destructive md:w-full md:basis-full md:pl-56">
                  {d.error}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading || !selectedProfessionalId}>
            {saving ? 'Salvando...' : 'Salvar horários'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfessionalSchedules;
