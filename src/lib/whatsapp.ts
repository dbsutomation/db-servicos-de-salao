/**
 * Utilitário para geração de links WhatsApp.
 * Emojis via String.fromCodePoint para evitar corrupção de encoding
 * ao ser processado por bundlers ou editores.
 */

const E = {
  smile:    String.fromCodePoint(0x1F60A),  // 😊
  check:    String.fromCodePoint(0x2705),   // ✅
  scissors: String.fromCodePoint(0x2702) + String.fromCodePoint(0xFE0F), // ✂️
  calendar: String.fromCodePoint(0x1F4C6), // 📆
  clock:    String.fromCodePoint(0x1F550), // 🕐
  woman:    String.fromCodePoint(0x1F469), // 👩
  pray:     String.fromCodePoint(0x1F64F), // 🙏
};

export interface WhatsAppConfirmParams {
  telefoneCliente: string;
  nomeCliente: string;
  servicos: string;
  duracao: number;
  data: string;      // já formatado em português
  hora: string;      // ex: "10h30"
  profissional: string;
}

/**
 * Gera a URL wa.me para o profissional confirmar o agendamento ao cliente.
 */
export function buildConfirmacaoUrl(params: WhatsAppConfirmParams): string {
  const { telefoneCliente, nomeCliente, servicos, duracao, data, hora, profissional } = params;

  const digits = telefoneCliente.replace(/\D/g, '');
  const phone = digits.startsWith('55') ? digits : '55' + digits;

  const msg = [
    'Ol\u00e1 ' + nomeCliente + '! ' + E.smile,
    'Seu agendamento foi confirmado! ' + E.check,
    '',
    E.scissors + ' Servi\u00e7o: ' + servicos + ' (' + duracao + 'min)',
    E.calendar + ' Data: ' + data,
    E.clock + ' Hor\u00e1rio: ' + hora,
    E.woman + ' Profissional: ' + profissional,
    '',
    'Te esperamos! ' + E.pray,
  ].join('\n');

  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
}

/**
 * Retorna a mensagem legível (para preview no modal).
 */
export function buildConfirmacaoTexto(params: WhatsAppConfirmParams): string {
  const { nomeCliente, servicos, duracao, data, hora, profissional } = params;

  return [
    'Ol\u00e1 ' + nomeCliente + '! ' + E.smile,
    'Seu agendamento foi confirmado! ' + E.check,
    '',
    E.scissors + ' Servi\u00e7o: ' + servicos + ' (' + duracao + 'min)',
    E.calendar + ' Data: ' + data,
    E.clock + ' Hor\u00e1rio: ' + hora,
    E.woman + ' Profissional: ' + profissional,
    '',
    'Te esperamos! ' + E.pray,
  ].join('\n');
}
