import React, { useEffect, useRef, useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { processLogoFile } from '@/lib/imageUtils';

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [salonName, setSalonName] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [savingSalon, setSavingSalon] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setUserName(currentUser.name || '');
      setUserPhone(currentUser.phone || '');
      if (currentUser.isManager && currentUser.salonId) {
        const { data, error } = await supabase
          .from('salons')
          .select('name, phone, address, logo_url')
          .eq('id', currentUser.salonId)
          .single();
        if (!error && data) {
          setSalonName(data.name || '');
          setSalonPhone(data.phone || '');
          setSalonAddress(data.address || '');
          setLogoUrl((data as any).logo_url || '');
        }
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const saveSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.salonId) return;
    if (!salonName.trim()) {
      toast({ title: 'Informe o nome do salão', variant: 'destructive' });
      return;
    }
    setSavingSalon(true);
    const { error } = await supabase
      .from('salons')
      .update({ name: salonName.trim(), phone: salonPhone.trim() || null, address: salonAddress.trim() || null })
      .eq('id', currentUser.salonId);
    setSavingSalon(false);
    if (error) {
      toast({ title: 'Erro ao salvar dados do salão', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dados do salão atualizados' });
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser?.salonId) return;

    setUploadingLogo(true);
    try {
      const blob = await processLogoFile(file);
      const previewUrl = URL.createObjectURL(blob);
      setLogoPreview(previewUrl);

      const path = `${currentUser.salonId}/logo.webp`;
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(path, blob, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('service-images').getPublicUrl(path);
      const url = `${publicData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('salons')
        .update({ logo_url: url } as any)
        .eq('id', currentUser.salonId);
      if (updateError) throw updateError;

      setLogoUrl(url);
      toast({ title: 'Logo atualizado', description: 'Recarregue a página para ver o logo no menu.' });
    } catch (error: any) {
      setLogoPreview('');
      toast({ title: 'Erro ao enviar o logo', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!userName.trim()) {
      toast({ title: 'Informe seu nome', variant: 'destructive' });
      return;
    }
    setSavingUser(true);
    const { error } = await supabase
      .from('users')
      .update({ name: userName.trim(), phone: userPhone.trim() || null })
      .eq('id', currentUser.id);
    setSavingUser(false);
    if (error) {
      toast({ title: 'Erro ao salvar seus dados', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Seus dados foram atualizados' });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-muted-foreground">Carregando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Configurações</h1>

        {currentUser?.isManager && (
          <Card className="p-4 md:p-6">
            <form onSubmit={saveSalon} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={20} className="text-primary" />
                <h2 className="text-lg font-semibold">Dados do salão</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonName">Nome do salão</Label>
                <Input id="salonName" value={salonName} onChange={(e) => setSalonName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonPhone">Telefone</Label>
                <Input id="salonPhone" value={salonPhone} onChange={(e) => setSalonPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonAddress">Endereço</Label>
                <Input id="salonAddress" value={salonAddress} onChange={(e) => setSalonAddress(e.target.value)} />
              </div>
              <Button type="submit" className="w-full md:w-auto" disabled={savingSalon}>
                {savingSalon ? 'Salvando...' : 'Salvar dados do salão'}
              </Button>
            </form>
          </Card>
        )}

        <Card className="p-4 md:p-6">
          <form onSubmit={saveUser} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Meus dados</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Nome</Label>
              <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userPhone">Telefone</Label>
              <Input id="userPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={currentUser?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado.</p>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={savingUser}>
              {savingUser ? 'Salvando...' : 'Salvar meus dados'}
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
