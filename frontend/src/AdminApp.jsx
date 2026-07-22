import { useEffect, useState } from 'react';
import { getAdminConfig, saveAdminConfig } from './adminApi.js';
import { maskPhone } from './phoneMask.js';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TOKEN_STORAGE_KEY = 'cadubarber_admin_token';

function emptyService() {
  return { id: '', name: '', durationMinutes: 30, price: 0 };
}

export default function AdminApp() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) handleLogin(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin(candidateToken) {
    setLoadingLogin(true);
    setAuthError('');
    getAdminConfig(candidateToken)
      .then((data) => {
        setToken(candidateToken);
        setAuthed(true);
        setConfig(data);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, candidateToken);
      })
      .catch(() => {
        setAuthError('Senha incorreta.');
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setLoadingLogin(false));
  }

  function handleSubmitLogin(e) {
    e.preventDefault();
    handleLogin(passwordInput);
  }

  function updateService(index, field, value) {
    setConfig((prev) => {
      const services = [...prev.services];
      services[index] = { ...services[index], [field]: value };
      return { ...prev, services };
    });
  }

  function addService() {
    setConfig((prev) => ({ ...prev, services: [...prev.services, emptyService()] }));
  }

  function removeService(index) {
    setConfig((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  }

  function toggleDayOpen(day, open) {
    setConfig((prev) => {
      const workingHours = { ...prev.workingHours };
      if (open) {
        workingHours[day] = { start: '09:00', end: '19:00' };
      } else {
        delete workingHours[day];
      }
      return { ...prev, workingHours };
    });
  }

  function updateDayHours(day, field, value) {
    setConfig((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value },
      },
    }));
  }

  function toggleLunch(enabled) {
    setConfig((prev) => ({ ...prev, lunchBreak: enabled ? { start: '12:00', end: '13:00' } : null }));
  }

  function updateLunch(field, value) {
    setConfig((prev) => ({ ...prev, lunchBreak: { ...prev.lunchBreak, [field]: value } }));
  }

  function toggleLocked(locked) {
    setConfig((prev) => ({ ...prev, locked }));
  }

  function updateWhatsappNumber(value) {
    setConfig((prev) => ({ ...prev, whatsappNumber: maskPhone(value) }));
  }

  function updateAddress(value) {
    setConfig((prev) => ({ ...prev, address: value }));
  }

  function handleSave() {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');
    saveAdminConfig(token, config)
      .then((updated) => {
        setConfig(updated);
        setSaveMessage('Configurações salvas com sucesso.');
      })
      .catch((err) => setSaveError(err.message))
      .finally(() => setSaving(false));
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmitLogin}
          className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
        >
          <h1 className="text-xl font-bold text-white">Área do Cadu</h1>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-3 text-white text-base focus:border-barber-gold outline-none"
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button
            type="submit"
            disabled={loadingLogin}
            className="w-full rounded-lg bg-barber-gold text-neutral-950 font-semibold py-3 disabled:opacity-50"
          >
            {loadingLogin ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  if (!config) {
    return <p className="p-6 text-neutral-400">Carregando...</p>;
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-8 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-white">Área do Cadu</h1>
        <p className="text-neutral-400 text-sm">Ajuste serviços, horários e a agenda</p>
      </header>

      <section className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">Agenda trancada</p>
          <p className="text-sm text-neutral-400">Ativa e o app para de aceitar novos agendamentos.</p>
        </div>
        <label className="inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.locked}
            onChange={(e) => toggleLocked(e.target.checked)}
          />
          <div className="w-12 h-7 bg-neutral-700 peer-checked:bg-red-600 rounded-full transition-colors relative">
            <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Contato e endereço</h2>
        <p className="text-sm text-neutral-400">
          O WhatsApp é usado no botão de confirmação que o cliente vê depois de agendar — ele manda
          uma mensagem de confirmação pra esse número. O endereço aparece nessa mesma mensagem.
        </p>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Seu WhatsApp</label>
            <input
              type="tel"
              value={config.whatsappNumber || ''}
              onChange={(e) => updateWhatsappNumber(e.target.value)}
              placeholder="(11) 91234-5678"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white text-base"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Endereço da barbearia</label>
            <textarea
              value={config.address || ''}
              onChange={(e) => updateAddress(e.target.value)}
              placeholder="Rua Exemplo, 123 - Bairro, Cidade"
              rows={2}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white text-base"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Serviços</h2>
        {config.services.map((service, index) => (
          <div key={index} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
            <input
              value={service.name}
              onChange={(e) => updateService(index, 'name', e.target.value)}
              placeholder="Nome do serviço"
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white text-base"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-neutral-400 mb-1">Duração (min)</label>
                <input
                  type="number"
                  min="5"
                  value={service.durationMinutes}
                  onChange={(e) => updateService(index, 'durationMinutes', e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white text-base"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-neutral-400 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={service.price}
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                  className="w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-white text-base"
                />
              </div>
            </div>
            <button onClick={() => removeService(index)} className="text-sm text-red-400 hover:text-red-300 py-1">
              Remover serviço
            </button>
          </div>
        ))}
        <button
          onClick={addService}
          className="w-full rounded-lg border border-dashed border-neutral-700 py-3 text-neutral-400 hover:text-white hover:border-neutral-500"
        >
          + Adicionar serviço
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Horário de funcionamento</h2>
        {WEEKDAYS.map((label, day) => {
          const hours = config.workingHours[day];
          const open = Boolean(hours);
          return (
            <div
              key={day}
              className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 flex flex-wrap items-center gap-3"
            >
              <label className="inline-flex items-center gap-2 w-28 shrink-0 py-1">
                <input type="checkbox" checked={open} onChange={(e) => toggleDayOpen(day, e.target.checked)} />
                <span className="text-white text-sm">{label}</span>
              </label>
              {open && (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={hours.start}
                    onChange={(e) => updateDayHours(day, 'start', e.target.value)}
                    className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-white text-base"
                  />
                  <span className="text-neutral-500 text-sm">até</span>
                  <input
                    type="time"
                    value={hours.end}
                    onChange={(e) => updateDayHours(day, 'end', e.target.value)}
                    className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-white text-base"
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Intervalo de almoço</h2>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 py-1">
            <input type="checkbox" checked={Boolean(config.lunchBreak)} onChange={(e) => toggleLunch(e.target.checked)} />
            <span className="text-white text-sm">Ativado</span>
          </label>
          {config.lunchBreak && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="time"
                value={config.lunchBreak.start}
                onChange={(e) => updateLunch('start', e.target.value)}
                className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-white text-base"
              />
              <span className="text-neutral-500 text-sm">até</span>
              <input
                type="time"
                value={config.lunchBreak.end}
                onChange={(e) => updateLunch('end', e.target.value)}
                className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-2 text-white text-base"
              />
            </div>
          )}
        </div>
      </section>

      {saveError && <p className="text-red-400">{saveError}</p>}
      {saveMessage && <p className="text-green-400">{saveMessage}</p>}

      <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-2xl mx-auto block rounded-lg bg-barber-gold text-neutral-950 font-semibold py-3 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}
