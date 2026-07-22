import { useEffect, useState } from 'react';
import ServiceList from './components/ServiceList.jsx';
import ScheduleList from './components/ScheduleList.jsx';
import BookingForm from './components/BookingForm.jsx';
import Confirmation from './components/Confirmation.jsx';
import { getServices, getAvailability, createAppointment } from './api.js';
import { businessName, businessTagline } from './config.js';

const STEPS = {
  SERVICES: 'services',
  SCHEDULE: 'schedule',
  FORM: 'form',
  CONFIRMATION: 'confirmation',
};

export default function App() {
  const [step, setStep] = useState(STEPS.SERVICES);

  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState('');

  const [selectedService, setSelectedService] = useState(null);
  const [days, setDays] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch((err) => setServicesError(err.message));
  }, []);

  function handleSelectService(service) {
    setSelectedService(service);
    setStep(STEPS.SCHEDULE);
    setLoadingAvailability(true);
    setAvailabilityError('');
    getAvailability(service.id)
      .then((data) => setDays(data.days))
      .catch((err) => setAvailabilityError(err.message))
      .finally(() => setLoadingAvailability(false));
  }

  function handleSelectSlot(slot) {
    setSelectedSlot(slot);
    setBookingError('');
    setStep(STEPS.FORM);
  }

  function handleConfirm({ customerName, customerPhone }) {
    setSubmitting(true);
    setBookingError('');
    createAppointment({
      serviceId: selectedService.id,
      start: selectedSlot.start,
      customerName,
      customerPhone,
    })
      .then((data) => {
        setAppointment(data.appointment);
        setStep(STEPS.CONFIRMATION);
      })
      .catch((err) => setBookingError(err.message))
      .finally(() => setSubmitting(false));
  }

  function handleNewBooking() {
    setStep(STEPS.SERVICES);
    setSelectedService(null);
    setSelectedSlot(null);
    setAppointment(null);
    setDays([]);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-900 px-6 py-5">
        <h1 className="text-2xl font-bold text-white">{businessName}</h1>
        <p className="text-neutral-400 text-sm">{businessTagline}</p>
      </header>

      <main className="px-6 py-8 max-w-3xl mx-auto">
        {step === STEPS.SERVICES && (
          <>
            <h2 className="text-lg font-semibold mb-4">Escolha um serviço</h2>
            {servicesError && <p className="text-red-400 mb-3">{servicesError}</p>}
            <ServiceList services={services} onSelect={handleSelectService} />
          </>
        )}

        {step === STEPS.SCHEDULE && selectedService && (
          <>
            <button
              onClick={() => setStep(STEPS.SERVICES)}
              className="text-sm text-neutral-400 hover:text-white mb-4"
            >
              ← Trocar serviço
            </button>
            <h2 className="text-lg font-semibold mb-1">Escolha um horário</h2>
            <p className="text-neutral-400 text-sm mb-4">
              {selectedService.name} — {selectedService.durationMinutes} min — R${' '}
              {selectedService.price.toFixed(2)}
            </p>
            {availabilityError && <p className="text-red-400 mb-3">{availabilityError}</p>}
            <ScheduleList days={days} loading={loadingAvailability} onSelectSlot={handleSelectSlot} />
          </>
        )}

        {step === STEPS.FORM && selectedService && selectedSlot && (
          <>
            <button
              onClick={() => setStep(STEPS.SCHEDULE)}
              className="text-sm text-neutral-400 hover:text-white mb-4"
            >
              ← Trocar horário
            </button>
            <h2 className="text-lg font-semibold mb-4">Seus dados</h2>
            {bookingError && <p className="text-red-400 mb-3">{bookingError}</p>}
            <BookingForm submitting={submitting} onBack={() => setStep(STEPS.SCHEDULE)} onConfirm={handleConfirm} />
          </>
        )}

        {step === STEPS.CONFIRMATION && appointment && (
          <Confirmation appointment={appointment} onNewBooking={handleNewBooking} />
        )}
      </main>
    </div>
  );
}
