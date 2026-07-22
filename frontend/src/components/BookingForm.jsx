import { useState } from 'react';

export default function BookingForm({ submitting, onBack, onConfirm }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onConfirm({ customerName: name.trim(), customerPhone: phone.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm text-neutral-400 mb-1">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:border-barber-gold outline-none"
          placeholder="Seu nome completo"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-400 mb-1">Telefone (WhatsApp)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:border-barber-gold outline-none"
          placeholder="(11) 91234-5678"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-300 hover:border-neutral-600"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-barber-gold text-neutral-950 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </form>
  );
}
