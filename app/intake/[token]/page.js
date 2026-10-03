'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Truck, User, MapPin, Wrench, CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import styles from './intake.module.css';

const EMPTY_CONTACT = { name: '', phone: '', email: '' };

export default function IntakeFormPage({ params }) {
  const [token, setToken] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | invalid | expired | done
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [company, setCompany] = useState('');
  const [usdot, setUsdot] = useState('');
  const [contacts, setContacts] = useState([{ ...EMPTY_CONTACT }]);
  const [billing, setBilling] = useState({ street: '', city: '', state: '', zip: '' });
  const [vehicle, setVehicle] = useState({ unitNumber: '', year: '', make: '', model: '', vin: '', plate: '', mileage: '' });
  const [concern, setConcern] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    (async () => {
      const { token } = await params;
      setToken(token);
      try {
        const res = await fetch(`/api/intake/${token}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          setLoadError('This intake link is not valid or has been cancelled. Please contact your service advisor for a new link.');
          setLoadState('invalid');
          return;
        }
        const r = json.request;
        if (r.status === 'submitted') { setLoadState('done'); return; }
        if (r.expired) { setLoadState('expired'); return; }
        if (r.company) setCompany(r.company);
        if (r.usdot) setUsdot(r.usdot);
        const p = r.payload || {};
        if (Array.isArray(p.contacts) && p.contacts.length) setContacts(p.contacts);
        if (p.billing) setBilling((b) => ({ ...b, ...p.billing }));
        if (p.vehicle) setVehicle((v) => ({ ...v, ...p.vehicle }));
        if (p.concern) setConcern(p.concern);
        setLoadState('ready');
      } catch (err) {
        setLoadError(err.message || 'Could not load this form.');
        setLoadState('invalid');
      }
    })();
  }, [params]);

  // Best-effort address autocomplete via OpenStreetMap (no API key). Degrades silently.
  const lookupAddress = useCallback(async (q) => {
    if (!q || q.length < 5) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!billing.street || billing.street.length < 5) return;
    const t = setTimeout(() => lookupAddress(billing.street), 500);
    return () => clearTimeout(t);
  }, [billing.street, lookupAddress]);

  const applySuggestion = (s) => {
    const a = s.address || {};
    setBilling({
      street: [a.house_number, a.road].filter(Boolean).join(' ') || s.display_name?.split(',')[0] || '',
      city: a.city || a.town || a.village || a.hamlet || '',
      state: a.state || a.province || '',
      zip: a.postcode || ''
    });
    setSuggestions([]);
  };

  const updateContact = (i, field, val) =>
    setContacts((cs) => cs.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim()) { setSubmitError('Company name is required.'); return; }
    const clean = contacts.filter((c) => (c.name || c.phone || c.email).trim?.() || c.name || c.phone || c.email);
    if (!clean.length) { setSubmitError('Please provide at least one contact (name, phone or email).'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, usdot, contacts: clean, billing, vehicle, concern })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed.');
      setLoadState('done');
    } catch (err) {
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <Wrench size={20} />
          <span>Service Intake</span>
        </div>
        <span className={styles.secure}>Secure link</span>
      </header>

      <main className={styles.shell}>
        {loadState === 'loading' && (
          <div className={styles.stateCard}>
            <Loader2 className={styles.spin} size={28} />
            <p>Loading your intake form…</p>
          </div>
        )}

        {loadState === 'invalid' && (
          <div className={styles.stateCard}>
            <h2>Link not valid</h2>
            <p>{loadError || 'This intake link is not valid or has been cancelled. Please contact your service advisor for a new link.'}</p>
          </div>
        )}

        {loadState === 'expired' && (
          <div className={styles.stateCard}>
            <h2>Link expired</h2>
            <p>This intake link has expired. Please contact your service advisor for a new one.</p>
          </div>
        )}

        {loadState === 'done' && (
          <div className={styles.stateCard}>
            <CheckCircle2 size={44} className={styles.successIcon} />
            <h2>Thank you — details received</h2>
            <p>Your information has been sent to the shop. A service advisor will follow up shortly.</p>
          </div>
        )}

        {loadState === 'ready' && (
          <>
            <div className={styles.intro}>
              <h1>Customer Intake Form</h1>
              <p>Tell us about your company and the vehicle that needs service. Fields marked * are required.</p>
            </div>

            {submitError && <div className={styles.errorBanner}>{submitError}</div>}

            <form onSubmit={handleSubmit}>
              {/* Company */}
              <section className={styles.card}>
                <div className={styles.cardTitle}><Building2 size={17} /> Company Information</div>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span>Company *</span>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Bison Transport West" required />
                  </label>
                  <label className={styles.field}>
                    <span>USDOT Number</span>
                    <input value={usdot} onChange={(e) => setUsdot(e.target.value)} placeholder="Enter USDOT number" />
                  </label>
                </div>
              </section>

              {/* Contacts */}
              <section className={styles.card}>
                <div className={styles.cardTitle}><User size={17} /> Contact</div>
                <p className={styles.hint}>Leave the name blank to default to the company name. Enter a phone or email.</p>
                {contacts.map((c, i) => (
                  <div className={styles.contactRow} key={i}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder={company || 'e.g. John'} />
                    </label>
                    <label className={styles.field}>
                      <span>Phone</span>
                      <input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="(xxx)-xxx-xxxx" />
                    </label>
                    <label className={styles.field}>
                      <span>Email</span>
                      <input type="email" value={c.email} onChange={(e) => updateContact(i, 'email', e.target.value)} placeholder="email@company.com" />
                    </label>
                    {contacts.length > 1 && (
                      <button type="button" className={styles.iconBtn} onClick={() => setContacts((cs) => cs.filter((_, idx) => idx !== i))} aria-label="Remove contact">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.ghostBtn} onClick={() => setContacts((cs) => [...cs, { ...EMPTY_CONTACT }])}>
                  <Plus size={15} /> Add contact
                </button>
              </section>

              {/* Billing address */}
              <section className={styles.card}>
                <div className={styles.cardTitle}><MapPin size={17} /> Billing Address</div>
                <label className={styles.field}>
                  <span>Street Address</span>
                  <input
                    value={billing.street}
                    onChange={(e) => setBilling({ ...billing, street: e.target.value })}
                    placeholder="Start typing address..."
                    autoComplete="off"
                  />
                </label>
                {suggestions.length > 0 && (
                  <ul className={styles.suggestions}>
                    {suggestions.map((s) => (
                      <li key={s.place_id}>
                        <button type="button" onClick={() => applySuggestion(s)}>{s.display_name}</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.grid3}>
                  <label className={styles.field}>
                    <span>City</span>
                    <input value={billing.city} onChange={(e) => setBilling({ ...billing, city: e.target.value })} placeholder="City" />
                  </label>
                  <label className={styles.field}>
                    <span>State / Province</span>
                    <input value={billing.state} onChange={(e) => setBilling({ ...billing, state: e.target.value })} placeholder="ST" maxLength={4} />
                  </label>
                  <label className={styles.field}>
                    <span>ZIP / Postal</span>
                    <input value={billing.zip} onChange={(e) => setBilling({ ...billing, zip: e.target.value })} placeholder="ZIP" />
                  </label>
                </div>
              </section>

              {/* Vehicle */}
              <section className={styles.card}>
                <div className={styles.cardTitle}><Truck size={17} /> Vehicle</div>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span>Unit / Fleet #</span>
                    <input value={vehicle.unitNumber} onChange={(e) => setVehicle({ ...vehicle, unitNumber: e.target.value })} placeholder="e.g. Unit 2049" />
                  </label>
                  <label className={styles.field}>
                    <span>License Plate</span>
                    <input value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} placeholder="e.g. AB-8921" />
                  </label>
                </div>
                <div className={styles.grid3}>
                  <label className={styles.field}>
                    <span>Year</span>
                    <input value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} placeholder="2023" />
                  </label>
                  <label className={styles.field}>
                    <span>Make</span>
                    <input value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} placeholder="Freightliner" />
                  </label>
                  <label className={styles.field}>
                    <span>Model</span>
                    <input value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Cascadia" />
                  </label>
                </div>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span>VIN</span>
                    <input value={vehicle.vin} onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })} placeholder="17-digit VIN" />
                  </label>
                  <label className={styles.field}>
                    <span>Mileage (km)</span>
                    <input value={vehicle.mileage} onChange={(e) => setVehicle({ ...vehicle, mileage: e.target.value })} placeholder="185000" />
                  </label>
                </div>
              </section>

              {/* Concern */}
              <section className={styles.card}>
                <div className={styles.cardTitle}><Wrench size={17} /> Concern</div>
                <label className={styles.field}>
                  <span>What does the vehicle need?</span>
                  <textarea rows={4} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Describe the problem or the service you need…" />
                </label>
              </section>

              <div className={styles.actions}>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                  {submitting ? <><Loader2 className={styles.spin} size={17} /> Submitting…</> : 'Submit details'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
