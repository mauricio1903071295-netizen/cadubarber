const TIMEZONE = 'America/Sao_Paulo';
const timeFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE });

export default function SlotList({ slots, loading, onSelectSlot }) {
  if (loading) {
    return <p className="text-neutral-400">Carregando horários...</p>;
  }

  if (slots.length === 0) {
    return <p className="text-neutral-400">Nenhum horário livre nesse dia. Escolha outra data no calendário.</p>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-w-sm">
      {slots.map((slot) => (
        <button
          key={slot.start}
          onClick={() => onSelectSlot(slot)}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-3 text-sm hover:border-barber-gold hover:text-barber-gold active:bg-neutral-800 transition-colors"
        >
          {timeFmt.format(new Date(slot.start))}
        </button>
      ))}
    </div>
  );
}
