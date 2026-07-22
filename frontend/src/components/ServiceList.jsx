export default function ServiceList({ services, onSelect }) {
  if (services.length === 0) {
    return <p className="text-neutral-400">Carregando serviços...</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service)}
          className="text-left rounded-xl border border-neutral-800 bg-neutral-900 p-5 hover:border-barber-gold transition-colors"
        >
          <h3 className="text-lg font-semibold text-white">{service.name}</h3>
          <p className="text-sm text-neutral-400 mt-1">{service.durationMinutes} min</p>
          <p className="text-barber-gold font-bold mt-2">R$ {service.price.toFixed(2)}</p>
        </button>
      ))}
    </div>
  );
}
