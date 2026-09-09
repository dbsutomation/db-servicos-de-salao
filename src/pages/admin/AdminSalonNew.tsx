import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function AdminSalonNew() {
  const [salonName, setSalonName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-salon", {
        body: {
          action: "create",
          salonName,
          managerName,
          managerEmail,
          phone,
          address,
          redirectTo: `${window.location.origin}/redefinir-senha`,
        },
      });

      const err = (error as any)?.message || (data as any)?.error;
      if (err) {
        toast({ title: "Não foi possível criar", description: String(err), variant: "destructive" });
        return;
      }

      toast({
        title: "Salão criado",
        description: "Enviamos um convite por e-mail para o responsável definir a senha.",
      });
      navigate(`/admin/saloes/${(data as any).salonId}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-lg space-y-4">
        <Button variant="ghost" onClick={() => navigate("/admin/saloes")} className="px-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Novo salão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salon">Nome do salão</Label>
                <Input id="salon" value={salonName} onChange={(e) => setSalonName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Responsável</Label>
                <Input id="owner" value={managerName} onChange={(e) => setManagerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail do responsável</Label>
                <Input
                  id="email"
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar salão e enviar convite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
