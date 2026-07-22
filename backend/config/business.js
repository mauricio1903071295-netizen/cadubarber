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
  daysAhead: 14,
};
