const TIMEZONE = 'America/Sao_Paulo';
const weekdayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: TIMEZONE });
const dayFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: TIMEZONE });
const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE });

export default function ScheduleList({ days, onSelectSlot, loading }) {
  if (loading) {
    return <p className="text-neutral-400">Carregando horários...</p>;
  }

  const openDays = days.filter((day) => day.slots.length > 0);

  if (openDays.length === 0) {
    return (
      <p className="text-neutral-400">
        Nenhum horário disponível nos próximos dias. Tente novamente mais tarde.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {openDays.map((day) => {
        // meio-dia UTC evita o dia "rolar" para trás/frente por causa do fuso local do navegador
        const dateObj = new Date(`${day.date}T12:00:00Z`);
        return (
          <div key={day.date}>
            <h4 className="text-sm font-semibold text-neutral-300 mb-2 capitalize">
              {weekdayFmt.format(dateObj)} — {dayFmt.format(dateObj)}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {day.slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => onSelectSlot(slot)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-3 text-sm hover:border-barber-gold hover:text-barber-gold active:bg-neutral-800 transition-colors"
                >
                  {timeFmt.format(new Date(slot.start))}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
