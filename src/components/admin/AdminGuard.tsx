import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function useIsSystemAdmin() {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        if (active) setStatus("denied");
        return;
      }
      const { data } = await supabase
        .from("system_admins")
        .select("user_id")
        .eq("user_id", userRes.user.id)
        .maybeSingle();
      if (active) setStatus(data ? "ok" : "denied");
    })();
    return () => {
      active = false;
    };
  }, []);

  return status;
}

export default function AdminGuard({ children }: { children: ReactNode }) {
  const status = useIsSystemAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "denied") navigate("/admin/login", { replace: true });
  }, [status, navigate]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
