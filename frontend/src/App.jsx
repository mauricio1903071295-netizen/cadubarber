import { useState } from 'react';
import ServiceList from './components/ServiceList.jsx';
import ScheduleList from './components/ScheduleList.jsx';
import PhoneGate from './components/PhoneGate.jsx';
import ExistingAppointment from './components/ExistingAppointment.jsx';
import ReviewStep from './components/ReviewStep.jsx';
import Confirmation from './components/Confirmation.jsx';
import {
  getServices,
  getAvailability,
  createAppointment,
  findAppointmentsByPhone,
  cancelAppointment,
} from './api.js';
import { businessName, businessTagline } from './config.js';

const STEPS = {
  PHONE: 'phone',
  EXISTING: 'existing',
  SERVICES: 'services',
  SCHEDULE: 'schedule',
  REVIEW: 'review',
  CONFIRMATION: 'confirmation',
};

export default function App() {
  const [step, setStep] = useState(STEPS.PHONE);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [cancelingId, setCancelingId] = useState('');

  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const [days, setDays] = useState([]);
  const [locked, setLocked] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [appointment, setAppointment] = useState(null);

  function loadServicesIfNeeded() {
    if (services.length > 0) return;
    getServices()
      .then(setServices)
      .catch((err) => setServicesError(err.message));
  }

  function handleSubmitPhone({ name, phone }) {
    setCheckingPhone(true);
    setPhoneError('');
    setCustomerName(name);
    setCustomerPhone(phone);
    findAppointmentsByPhone(phone)
      .then((data) => {
        const upcoming = data.appointments || [];
        if (upcoming.length > 0) {
          setExistingAppointments(upcoming);
          setStep(STEPS.EXISTING);
        } else {
          loadServicesIfNeeded();
          setStep(STEPS.SERVICES);
        }
      })
      .catch((err) => setPhoneError(err.message))
      .finally(() => setCheckingPhone(false));
  }

  function handleCancelExisting(eventId) {
    setCancelingId(eventId);
    setPhoneError('');
    cancelAppointment(eventId)
      .then(() => {
        setExistingAppointments((prev) => prev.filter((a) => a.eventId !== eventId));
      })
      .catch((err) => setPhoneError(err.message))
      .finally(() => setCancelingId(''));
  }

  function handleContinueToBooking() {
    loadServicesIfNeeded();
    setStep(STEPS.SERVICES);
  }

  function handleSelectService(service) {
    setSelectedService(service);
    setStep(STEPS.SCHEDULE);
    setLoadingAvailability(true);
    setAvailabilityError('');
    getAvailability(service.id)
      .then((data) => {
        setLocked(Boolean(data.locked));
        setDays(data.days || []);
      })
      .catch((err) => setAvailabilityError(err.message))
      .finally(() => setLoadingAvailability(false));
  }

  function handleSelectSlot(slot) {
    setSelectedSlot(slot);
    setBookingError('');
    setStep(STEPS.REVIEW);
  }

  function handleConfirm() {
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

  function handleStartOver() {
    setStep(STEPS.PHONE);
    setCustomerName('');
    setCustomerPhone('');
    setExistingAppointments([]);
    setSelectedService(null);
    setSelectedSlot(null);
    setAppointment(null);
    setDays([]);
    setLocked(false);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-900 px-4 sm:px-6 py-4 sm:py-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white">{businessName}</h1>
        <p className="text-neutral-400 text-sm">{businessTagline}</p>
      </header>

      <main className="px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto">
        {step === STEPS.PHONE && (
          <PhoneGate loading={checkingPhone} error={phoneError} onSubmit={handleSubmitPhone} />
        )}

        {step === STEPS.EXISTING && (
          <ExistingAppointment
            appointments={existingAppointments}
            cancelingId={cancelingId}
            error={phoneError}
            onCancel={handleCancelExisting}
            onContinue={handleContinueToBooking}
          />
        )}

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
              className="text-sm text-neutral-400 hover:text-white mb-4 py-1"
            >
              ← Trocar serviço
            </button>
            <h2 className="text-lg font-semibold mb-1">Escolha um horário</h2>
            <p className="text-neutral-400 text-sm mb-4">
              {selectedService.name} — {selectedService.durationMinutes} min — R${' '}
              {selectedService.price.toFixed(2)}
            </p>
            {availabilityError && <p className="text-red-400 mb-3">{availabilityError}</p>}
            {!loadingAvailability && locked ? (
              <p className="text-neutral-400">
                A agenda está temporariamente fechada para novos agendamentos. Volte em breve!
              </p>
            ) : (
              <ScheduleList days={days} loading={loadingAvailability} onSelectSlot={handleSelectSlot} />
            )}
          </>
        )}

        {step === STEPS.REVIEW && selectedService && selectedSlot && (
          <>
            <button
              onClick={() => setStep(STEPS.SCHEDULE)}
              className="text-sm text-neutral-400 hover:text-white mb-4 py-1"
            >
              ← Trocar horário
            </button>
            <h2 className="text-lg font-semibold mb-4">Confirme seu agendamento</h2>
            {bookingError && <p className="text-red-400 mb-3">{bookingError}</p>}
            <ReviewStep
              service={selectedService}
              slot={selectedSlot}
              customerName={customerName}
              customerPhone={customerPhone}
              submitting={submitting}
              onBack={() => setStep(STEPS.SCHEDULE)}
              onConfirm={handleConfirm}
            />
          </>
        )}

        {step === STEPS.CONFIRMATION && appointment && (
          <Confirmation appointment={appointment} onNewBooking={handleStartOver} />
        )}
      </main>
    </div>
  );
}
