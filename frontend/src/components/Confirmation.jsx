const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

function toWhatsAppDigits(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function buildWhatsAppUrl(appointment) {
  const phone = toWhatsAppDigits(appointment.whatsappNumber);
  if (!phone) return '';

  const lines = [
    'Olá! Confirmando meu agendamento:',
    '',
    `Serviço: ${appointment.service}`,
    `Data/Hora: ${dateFmt.format(new Date(appointment.start))}`,
    `Cliente: ${appointment.customerName}`,
    `Telefone: ${appointment.customerPhone}`,
  ];
  if (appointment.address) {
    lines.push('', `Endereço: ${appointment.address}`);
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export default function Confirmation({ appointment, onNewBooking }) {
  const whatsappUrl = buildWhatsAppUrl(appointment);

  return (
    <div className="max-w-md rounded-xl border border-barber-gold/40 bg-neutral-900 p-6">
      <h3 className="text-xl font-bold text-barber-gold mb-4">Agendamento confirmado!</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-400">Serviço</dt>
          <dd>{appointment.service}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Data e hora</dt>
          <dd className="capitalize">{dateFmt.format(new Date(appointment.start))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Duração</dt>
          <dd>{appointment.durationMinutes} min</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Valor</dt>
          <dd>R$ {appointment.price.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Cliente</dt>
          <dd>{appointment.customerName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-400">Telefone</dt>
          <dd>{appointment.customerPhone}</dd>
        </div>
      </dl>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block w-full text-center rounded-lg bg-[#25D366] text-neutral-950 font-semibold py-3 hover:opacity-90"
        >
          Enviar confirmação por WhatsApp
        </a>
      )}

      <button
        onClick={onNewBooking}
        className="mt-3 w-full rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 py-3"
      >
        Fazer novo agendamento
      </button>
    </div>
  );
}
