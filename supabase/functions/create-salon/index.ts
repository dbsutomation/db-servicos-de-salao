// Edge function: create-salon
// Provisiona um novo salão + gerente. Somente administradores da plataforma.
// Não altera a sessão do chamador (usa Admin API com service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toTitleCase(str: string) {
  return (str || "").toLowerCase().replace(/(^|\s|['-])\S/g, (c) => c.toUpperCase());
}

function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Sem autorização" }, 401);

    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseCaller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sessão inválida" }, 401);
    const callerId = userData.user.id;

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Só administradores da plataforma
    const { data: adminRow } = await supabaseAdmin
      .from("system_admins")
      .select("user_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (!adminRow) return json({ error: "Acesso restrito ao administrador da plataforma" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "create";
    const redirectTo: string = body?.redirectTo || `${SUPABASE_URL}/`;

    // ---- Reenviar convite / definição de senha ----
    if (action === "resend") {
      const email = (body?.email ?? "").trim();
      if (!email) return json({ error: "E-mail não informado" }, 400);
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ---- Criar salão ----
    const salonName = (body?.salonName ?? "").trim();
    const managerName = toTitleCase((body?.managerName ?? "").trim());
    const managerEmail = (body?.managerEmail ?? "").trim().toLowerCase();
    const phone = body?.phone ? normalizePhone(body.phone) : null;
    const address = body?.address ? String(body.address).trim() : null;

    if (!salonName || !managerName || !managerEmail) {
      return json({ error: "Informe nome do salão, responsável e e-mail do gerente" }, 400);
    }

    // Usuário já existe? -> só retomar se a correlação for inequívoca
    const { data: existingList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = existingList?.users?.find(
      (u: { email?: string }) => (u.email ?? "").toLowerCase() === managerEmail,
    );

    let managerId: string | null = null;
    let createdNow = false;

    if (existing) {
      // Só é retomável se houver um salão criado por esta rotina cujo dono é exatamente este usuário
      const { data: pendingSalon } = await supabaseAdmin
        .from("salons")
        .select("id, provision_ref, owner_id")
        .eq("owner_id", existing.id)
        .not("provision_ref", "is", null)
        .maybeSingle();

      if (!pendingSalon) {
        return json({
          error:
            "Este e-mail já está em uso por outro usuário do sistema. Use outro e-mail ou verifique o cadastro existente.",
        }, 409);
      }
      managerId = existing.id;
    } else {
      const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin
        .inviteUserByEmail(managerEmail, {
          redirectTo,
          data: {
            name: managerName,
            is_new_manager: true,
            salon_name: salonName,
          },
        });
      if (inviteErr || !invited?.user) {
        return json({ error: inviteErr?.message ?? "Falha ao criar o acesso do gerente" }, 400);
      }
      managerId = invited.user.id;
      createdNow = true;
    }

    // O gatilho handle_new_user cria salão + usuário + papel. Confere consistência.
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("id, salon_id, is_manager")
      .eq("id", managerId!)
      .maybeSingle();

    if (!userRow?.salon_id) {
      if (createdNow) await supabaseAdmin.auth.admin.deleteUser(managerId!);
      return json({ error: "Provisionamento incompleto: salão não foi criado. Tente novamente." }, 500);
    }

    const salonId = userRow.salon_id as string;

    // Garante dados do gerente
    const { error: userUpdErr } = await supabaseAdmin
      .from("users")
      .update({ name: managerName, email: managerEmail, has_access: true, is_manager: true })
      .eq("id", managerId!);
    if (userUpdErr) {
      if (createdNow) await supabaseAdmin.auth.admin.deleteUser(managerId!);
      return json({ error: userUpdErr.message }, 400);
    }

    // Garante papel de gerente
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: managerId!, role: "manager" }, { onConflict: "user_id,role" });
    if (roleErr) {
      return json({ error: `Salão criado, mas o papel do gerente falhou: ${roleErr.message}` }, 500);
    }

    // provision_ref gerado no servidor; nunca vindo do frontend
    const { data: salonRow } = await supabaseAdmin
      .from("salons")
      .select("provision_ref")
      .eq("id", salonId)
      .maybeSingle();

    const provisionRef = salonRow?.provision_ref ?? crypto.randomUUID();

    const { error: salonUpdErr } = await supabaseAdmin
      .from("salons")
      .update({
        name: salonName,
        phone,
        address,
        status: "ativo",
        provision_ref: provisionRef,
      })
      .eq("id", salonId);

    if (salonUpdErr) return json({ error: salonUpdErr.message }, 400);

    return json({ success: true, salonId, managerId, resumed: !createdNow });
  } catch (e) {
    return json({ error: (e as Error).message ?? "Erro inesperado" }, 500);
  }
});
