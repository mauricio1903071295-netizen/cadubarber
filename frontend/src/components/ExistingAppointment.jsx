const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export default function ExistingAppointment({
  appointments,
  cancelingId,
  reschedulingId,
  error,
  onCancel,
  onReschedule,
  onContinue,
}) {
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">Você já tem agendamento marcado</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-3">
        {appointments.map((appt) => {
          const busy = cancelingId === appt.eventId || reschedulingId === appt.eventId;
          return (
            <div key={appt.eventId} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-2">
              <p className="text-white font-medium">{appt.title}</p>
              <p className="text-neutral-400 text-sm capitalize">{dateFmt.format(new Date(appt.start))}</p>
              <div className="flex gap-4 pt-1">
                <button
                  onClick={() => onReschedule(appt.eventId)}
                  disabled={busy}
                  className="text-sm text-barber-gold hover:opacity-80 disabled:opacity-50 py-1"
                >
                  {reschedulingId === appt.eventId ? 'Alterando...' : 'Alterar agendamento'}
                </button>
                <button
                  onClick={() => onCancel(appt.eventId)}
                  disabled={busy}
                  className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 py-1"
                >
                  {cancelingId === appt.eventId ? 'Cancelando...' : 'Cancelar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onContinue}
        className="w-full rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 py-3"
      >
        Fazer um novo agendamento
      </button>
    </div>
  );
}
