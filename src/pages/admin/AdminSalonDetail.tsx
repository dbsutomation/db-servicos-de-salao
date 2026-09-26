import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

type SalonDetail = {
  id: string;
  name: string;
  owner_name: string | null;
  owner_email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  professionals_count: number;
};

export default function AdminSalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [features, setFeatures] = useState({ feature_expenses: false, feature_agenda: false, feature_work_hours: false });
  const [savingFeatures, setSavingFeatures] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.rpc("admin_get_salon", { p_salon_id: id });
    const row = (data as SalonDetail[])?.[0] ?? null;
    setSalon(row);
    if (row) {
      setName(row.name ?? "");
      setPhone(row.phone ?? "");
      setAddress(row.address ?? "");
      const { data: settings } = await supabase.from("salons").select("feature_expenses, feature_agenda, feature_work_hours").eq("id", id).single();
      if (settings) setFeatures({ feature_expenses: settings.feature_expenses, feature_agenda: settings.feature_agenda, feature_work_hours: settings.feature_work_hours });
      else toast({ title: "Não foi possível carregar as funções", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from("salons")
      .update({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dados atualizados" });
    load();
  };

  const toggleStatus = async () => {
    if (!id || !salon) return;
    const next = salon.status === "ativo" ? "suspenso" : "ativo";
    setConfirmOpen(false);
    const { error } = await supabase.from("salons").update({ status: next }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next === "ativo" ? "Salão reativado" : "Salão suspenso" });
    load();
  };

  const updateFeature = async (key: keyof typeof features, enabled: boolean) => {
    if (!id || savingFeatures) return;
    const next = { ...features, [key]: enabled };
    if (key === "feature_agenda" && !enabled) next.feature_work_hours = false;
    setSavingFeatures(true);
    const { data, error } = await supabase.from("salons").update(next).eq("id", id)
      .select("feature_expenses, feature_agenda, feature_work_hours").single();
    setSavingFeatures(false);
    if (error || !data) {
      toast({ title: "Não foi possível alterar as funções", description: error?.message, variant: "destructive" });
      return;
    }
    setFeatures({ feature_expenses: data.feature_expenses, feature_agenda: data.feature_agenda, feature_work_hours: data.feature_work_hours });
    toast({ title: "Funções atualizadas" });
  };

  const resendInvite = async () => {
    if (!salon?.owner_email) return;
    const { data, error } = await supabase.functions.invoke("create-salon", {
      body: {
        action: "resend",
        email: salon.owner_email,
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    });
    const err = (error as any)?.message || (data as any)?.error;
    if (err) {
      toast({ title: "Não foi possível reenviar", description: String(err), variant: "destructive" });
      return;
    }
    toast({ title: "Convite reenviado", description: `E-mail enviado para ${salon.owner_email}` });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Salão não encontrado.</p>
        <Button onClick={() => navigate("/admin/saloes")}>Voltar</Button>
      </div>
    );
  }

  const isActive = salon.status === "ativo";

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/saloes")} className="px-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="truncate">{salon.name}</CardTitle>
            <Badge variant={isActive ? "default" : "destructive"}>{isActive ? "Ativo" : "Suspenso"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p><span className="text-muted-foreground">Responsável:</span> {salon.owner_name ?? "—"}</p>
              <p><span className="text-muted-foreground">E-mail:</span> {salon.owner_email ?? "—"}</p>
              <p><span className="text-muted-foreground">Profissionais:</span> {salon.professionals_count}</p>
              <p>
                <span className="text-muted-foreground">Criado em:</span>{" "}
                {new Date(salon.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do salão</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={resendInvite} disabled={!salon.owner_email}>
                  <Mail className="mr-2 h-4 w-4" /> Reenviar convite
                </Button>
                <Button
                  variant={isActive ? "destructive" : "default"}
                  className="flex-1"
                  onClick={() => setConfirmOpen(true)}
                >
                  {isActive ? "Suspender" : "Reativar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Funções do salão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Início, Serviços e Produtos, Clientes, Profissionais e Carrinho estão sempre disponíveis.</p>
            {([
              ["feature_expenses", "Despesas", "Controle de despesas do salão"],
              ["feature_agenda", "Agenda", "Inclui agendamentos no portal do cliente"],
              ["feature_work_hours", "Horários de trabalho", "Disponível apenas com Agenda ligada"],
            ] as const).map(([key, label, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 border-t pt-4">
                <div><label htmlFor={key} className="font-medium">{label}</label><p className="text-sm text-muted-foreground">{description}</p></div>
                <Switch id={key} checked={features[key]} disabled={savingFeatures || (key === "feature_work_hours" && !features.feature_agenda)} onCheckedChange={(checked) => updateFeature(key, checked)} aria-label={label} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isActive ? "Suspender salão?" : "Reativar salão?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `Ao suspender, a equipe e os clientes de "${salon.name}" perdem o acesso ao sistema. Nenhum dado é apagado.`
                : `O acesso da equipe e dos clientes de "${salon.name}" será restabelecido.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={toggleStatus}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
