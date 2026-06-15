import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RecordRow {
  id: string;
  date: string;
  professional: string;
  service: string;
  category: string;
  paymentMethod: string;
  serviceValue: number;
}

interface ClientInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, name, phone, email')
          .eq('id', id)
          .single();
        if (clientError) throw clientError;
        setClient(clientData as ClientInfo);

        let query = supabase
          .from('service_records')
          .select(`
            id, date, payment_method, service_value,
            service:services(name, category),
            professional:users!service_records_professional_id_fkey(id, name)
          `)
          .eq('client_id', id)
          .order('date', { ascending: false });

        if (currentUser && !currentUser.isManager) {
          query = query.eq('professional_id', currentUser.id);
        }

        const { data: recordsData, error: recordsError } = await query;
        if (recordsError) throw recordsError;

        const mapped: RecordRow[] = (recordsData || []).map((r: any) => ({
          id: r.id,
          date: r.date,
          professional: r.professional?.name || '-',
          service: r.service?.name || '-',
          category: r.service?.category || '-',
          paymentMethod: r.payment_method || '-',
          serviceValue: Number(r.service_value || 0),
        }));
        setRecords(mapped);
      } catch (e: any) {
        toast({
          title: 'Erro ao carregar perfil',
          description: e.message || 'Falha ao buscar dados do cliente',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser]);

  const stats = useMemo(() => {
    const total = records.reduce((s, r) => s + r.serviceValue, 0);
    const count = records.length;
    const dates = records.map(r => r.date).sort();
    const first = dates[0];
    const last = dates[dates.length - 1];
    return { total, count, first, last };
  }, [records]);

  const topServices = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => map.set(r.service, (map.get(r.service) || 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [records]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="mr-2" size={16} /> Voltar para Clientes
        </Button>

        {loading ? (
          <p>Carregando...</p>
        ) : !client ? (
          <p>Cliente não encontrado.</p>
        ) : (
          <>
            <Card className="p-6 shadow-md border-2 border-gray-100">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                {client.phone && <p>Telefone: {client.phone}</p>}
                {client.email && <p>Email: {client.email}</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total gasto</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total de visitas</p>
                  <p className="text-xl font-bold">{stats.count}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Primeira visita</p>
                  <p className="text-xl font-bold">
                    {stats.first ? format(parseISO(stats.first), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Última visita</p>
                  <p className="text-xl font-bold">
                    {stats.last ? format(parseISO(stats.last), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="shadow-md border-2 border-gray-100">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Histórico de atendimentos</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(parseISO(r.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{r.professional}</TableCell>
                      <TableCell>{r.service}</TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.paymentMethod}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.serviceValue)}</TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhum atendimento encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-6 shadow-md border-2 border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Serviços mais realizados</h2>
              {topServices.length === 0 ? (
                <p className="text-muted-foreground">Nenhum serviço registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {topServices.map(([name, count]) => (
                    <li key={name} className="flex justify-between border-b pb-2">
                      <span>{name}</span>
                      <span className="font-bold">{count}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientProfile;
