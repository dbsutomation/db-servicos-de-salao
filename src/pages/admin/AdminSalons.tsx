import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, Loader2, Building2 } from "lucide-react";

type SalonRow = {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  professionals_count: number;
};

export default function AdminSalons() {
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("admin_list_salons");
      setSalons((data as SalonRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = salons.filter((s) =>
    `${s.name} ${s.owner_name ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Salões</h1>
            <p className="text-sm text-muted-foreground">Administração da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/saloes/novo")}>
              <Plus className="mr-2 h-4 w-4" /> Novo salão
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Input
          placeholder="Buscar por salão ou responsável"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-background"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Nenhum salão encontrado.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Link key={s.id} to={`/admin/saloes/${s.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {s.owner_name ?? "Sem responsável"} · {s.professionals_count} profissional(is)
                      </p>
                    </div>
                    <Badge variant={s.status === "ativo" ? "default" : "destructive"}>
                      {s.status === "ativo" ? "Ativo" : "Suspenso"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
