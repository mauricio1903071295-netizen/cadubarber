import { useState } from 'react';
import { maskPhone } from '../phoneMask.js';

export default function PhoneGate({ loading, error, onSubmit }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) return;
    onSubmit({ name: name.trim(), phone });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-lg font-semibold mb-1">Seus dados</h2>
      <p className="text-neutral-400 text-sm mb-2">
        Informe seu nome e telefone para começar. Se você já tiver um agendamento marcado, a gente mostra aqui.
      </p>
      <div>
        <label className="block text-sm text-neutral-400 mb-1">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-3 text-white text-base focus:border-barber-gold outline-none"
          placeholder="Seu nome completo"
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-400 mb-1">Telefone (WhatsApp)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(maskPhone(e.target.value))}
          required
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-3 text-white text-base focus:border-barber-gold outline-none"
          placeholder="(11) 91234-5678"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-barber-gold text-neutral-950 font-semibold py-3 disabled:opacity-50"
      >
        {loading ? 'Verificando...' : 'Continuar'}
      </button>
    </form>
  );
}
