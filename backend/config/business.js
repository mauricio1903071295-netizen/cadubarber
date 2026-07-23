// Configuração fixa do negócio. No futuro isso pode virar editável (banco de dados / painel do barbeiro).
module.exports = {
  businessName: 'Cadu Barber',
  timezone: 'America/Sao_Paulo',

  // Horário de funcionamento por dia da semana (0 = domingo ... 6 = sábado).
  // Dias que não aparecem aqui são considerados fechados.
  workingHours: {
    2: { start: '09:00', end: '19:00' }, // terça
    3: { start: '09:00', end: '19:00' }, // quarta
    4: { start: '09:00', end: '19:00' }, // quinta
    5: { start: '09:00', end: '19:00' }, // sexta
    6: { start: '09:00', end: '19:00' }, // sábado
  },

  // Intervalo de almoço aplicado em todos os dias de funcionamento.
  lunchBreak: { start: '12:00', end: '13:00' },

  // Granularidade dos horários oferecidos ao cliente (em minutos).
  slotIntervalMinutes: 30,

  // Quantos dias à frente o app mostra disponibilidade.
  daysAhead: 30,

  // Não aceita agendamento antes dessa data (YYYY-MM-DD), ou null pra não
  // ter restrição. Útil pra quando o barbeiro ainda está noutro endereço.
  startDate: '2026-08-04',
};
