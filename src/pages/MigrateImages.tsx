import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MainLayout from '@/components/Layout/MainLayout';
import { getCurrentSalonId } from '@/lib/salon';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type MigResult = {
  id: string;
  name: string;
  status: 'pending' | 'migrating' | 'done' | 'skipped' | 'error';
  message?: string;
};

// Converte base64 para Blob
function base64ToBlob(base64: string): { blob: Blob; ext: string } | null {
  try {
    const match = base64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const byteString = atob(match[2]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return { blob: new Blob([ab], { type: `image/${match[1]}` }), ext };
  } catch {
    return null;
  }
}

export default function MigrateImages() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<MigResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ total: 0, migrated: 0, skipped: 0, errors: 0 });

  // Só gerentes podem acessar
  if (!currentUser?.isManager) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-muted-foreground">
          Acesso restrito ao gerente.
        </div>
      </MainLayout>
    );
  }

  const handleScan = async () => {
    setRunning(false);
    setDone(false);
    const salonId = await getCurrentSalonId();
    const { data, error } = await supabase
      .from('services')
      .select('id, name, image')
      .eq('salon_id', salonId);

    if (error) { alert('Erro ao buscar serviços: ' + error.message); return; }

    const list: MigResult[] = (data ?? []).map(s => ({
      id: s.id,
      name: s.name,
      status: s.image?.startsWith('data:image') ? 'pending' : 'skipped',
      message: s.image?.startsWith('data:image')
        ? `base64 (${Math.round((s.image.length * 3) / 4 / 1024)}kb)`
        : s.image?.startsWith('https://') ? 'Já no Storage' : 'Sem imagem',
    }));

    const pending = list.filter(r => r.status === 'pending').length;
    setResults(list);
    setStats({ total: list.length, migrated: 0, skipped: list.length - pending, errors: 0 });
  };

  const handleMigrate = async () => {
    setRunning(true);
    const salonId = await getCurrentSalonId();
    let migrated = 0, errors = 0;

    for (const item of results) {
      if (item.status !== 'pending') continue;

      // Atualiza status para migrating
      setResults(prev => prev.map(r => r.id === item.id ? { ...r, status: 'migrating' } : r));

      try {
        // Busca o base64 completo do banco
        const { data: svc } = await supabase
          .from('services')
          .select('image')
          .eq('id', item.id)
          .single();

        if (!svc?.image?.startsWith('data:image')) {
          setResults(prev => prev.map(r => r.id === item.id
            ? { ...r, status: 'skipped', message: 'Não é base64' } : r));
          continue;
        }

        const converted = base64ToBlob(svc.image);
        if (!converted) throw new Error('Falha ao converter base64');

        const fileName = `${salonId}/${item.id}.${converted.ext}`;

        // Upload para o Storage
        const { error: uploadErr } = await supabase.storage
          .from('service-images')
          .upload(fileName, converted.blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: converted.blob.type,
          });
        if (uploadErr) throw uploadErr;

        // Gerar URL pública
        const { data: urlData } = supabase.storage
          .from('service-images')
          .getPublicUrl(fileName);

        // Atualizar o banco com a URL
        const { error: updateErr } = await supabase
          .from('services')
          .update({ image: urlData.publicUrl })
          .eq('id', item.id);
        if (updateErr) throw updateErr;

        migrated++;
        setResults(prev => prev.map(r => r.id === item.id
          ? { ...r, status: 'done', message: 'Migrado com sucesso' } : r));
      } catch (e: any) {
        errors++;
        setResults(prev => prev.map(r => r.id === item.id
          ? { ...r, status: 'error', message: e.message } : r));
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(res => setTimeout(res, 300));
    }

    setStats(prev => ({ ...prev, migrated, errors }));
    setRunning(false);
    setDone(true);
  };

  const pending = results.filter(r => r.status === 'pending').length;

  const statusColor = (s: MigResult['status']) => ({
    pending:   'text-orange-600 bg-orange-50',
    migrating: 'text-blue-600 bg-blue-50 animate-pulse',
    done:      'text-green-600 bg-green-50',
    skipped:   'text-gray-500 bg-gray-50',
    error:     'text-red-600 bg-red-50',
  }[s]);

  const statusLabel = (s: MigResult['status']) => ({
    pending:   'Pendente',
    migrating: 'Migrando...',
    done:      'Concluído',
    skipped:   'Ignorado',
    error:     'Erro',
  }[s]);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Migração de imagens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Converte imagens base64 do banco para o Storage do Supabase.
            As imagens continuam aparecendo normalmente após a migração.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
            <CardDescription>
              1. Clique em "Verificar serviços" para ver quais têm imagem em base64<br />
              2. Clique em "Iniciar migração" para converter todas de uma vez<br />
              3. Cada imagem é salva no Storage e o banco é atualizado com a URL
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={handleScan} disabled={running}>
              Verificar serviços
            </Button>
            {pending > 0 && !running && !done && (
              <Button onClick={handleMigrate} className="bg-salon-purple hover:bg-salon-dark-purple">
                Iniciar migração ({pending} imagens)
              </Button>
            )}
            {done && (
              <Button variant="outline" onClick={() => navigate('/services')}>
                Concluído — ir para Serviços
              </Button>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                Total: {stats.total} · Migrados: {stats.migrated} · Ignorados: {stats.skipped} · Erros: {stats.errors}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {results.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 gap-3">
                    <span className="text-sm font-medium truncate flex-1">{r.name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">{r.message}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
