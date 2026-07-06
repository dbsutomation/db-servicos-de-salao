// Edge function: create-team-member
// Creates an auth user via service role WITHOUT affecting the caller's session,
// then updates public.users and user_roles. Only managers of the same salon can call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toTitleCase(str: string) {
  return (str || "")
    .toLowerCase()
    .replace(/(^|\s|['-])\S/g, (c) => c.toUpperCase());
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autorização" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente com JWT do chamador — para validar identidade e papel
    const supabaseCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabaseCaller.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    // Cliente admin (service role) — bypassa RLS, não afeta sessão do chamador
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verifica se o chamador é manager e obtém o salon_id dele
    const { data: callerRow, error: callerRowErr } = await supabaseAdmin
      .from("users")
      .select("salon_id, is_manager")
      .eq("id", callerId)
      .single();

    if (callerRowErr || !callerRow) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!callerRow.is_manager || !callerRow.salon_id) {
      return new Response(
        JSON.stringify({ error: "Apenas gerentes podem cadastrar profissionais" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const salonId = callerRow.salon_id as string;

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      profession,
      hasAccess,
      isManager,
      categories,
    } = body ?? {};

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos (name, email, password)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cria usuário no Auth via Admin API (não altera sessão do chamador)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin
      .createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: toTitleCase(name),
          salon_id: salonId,
        },
      });

    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Falha ao criar usuário" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const newUserId = created.user.id;

    // Garante linha em public.users com os dados corretos.
    // O trigger handle_new_user pode ter criado uma linha básica — fazemos upsert/update.
    const { error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: newUserId,
        name: toTitleCase(name),
        email,
        phone: phone ? normalizePhone(phone) : null,
        profession: profession || null,
        has_access: hasAccess ?? true,
        is_manager: isManager ?? false,
        categories: categories || [],
        salon_id: salonId,
      });

    if (upsertErr) {
      // rollback: apaga o auth user pra não deixar órfão
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualiza user_roles via RPC (a função faz UPDATE — insere via handle_new_user)
    const desiredRole = isManager ? "manager" : "professional";
    const { error: roleErr } = await supabaseAdmin.rpc("set_user_role", {
      p_user_id: newUserId,
      p_role: desiredRole,
      p_salon_id: salonId,
    });

    if (roleErr) {
      return new Response(
        JSON.stringify({ error: `Usuário criado, mas papel falhou: ${roleErr.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Erro inesperado" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
