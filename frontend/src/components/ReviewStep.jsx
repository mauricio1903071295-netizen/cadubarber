const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export default function ReviewStep({ service, slot, customerName, customerPhone, submitting, onBack, onConfirm }) {
  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">Serviço</span>
          <span>{service.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Data e hora</span>
          <span className="capitalize">{dateFmt.format(new Date(slot.start))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Valor</span>
          <span>R$ {service.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Nome</span>
          <span>{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Telefone</span>
          <span>{customerPhone}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 rounded-lg border border-neutral-800 text-neutral-300 hover:border-neutral-600 order-2 sm:order-1"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="px-4 py-3 rounded-lg bg-barber-gold text-neutral-950 font-semibold hover:opacity-90 disabled:opacity-50 order-1 sm:order-2 flex-1"
        >
          {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </div>
  );
}
