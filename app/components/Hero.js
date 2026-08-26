'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';
import { 
  ArrowRight, 
  PlayCircle, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Check, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Sliders, 
  ChevronRight,
  Smartphone,
  Sparkles,
  Layers
} from 'lucide-react';

const VEHICLE_MODELS = [
  {
    id: 'class8',
    name: 'Atlas 880 Heavy Tractor',
    category: 'Class 8 Commercial',
    engine: '15L Turbo Diesel',
    power: '565 hp / 1,850 lb-ft',
    laborRate: '$145.00 CAD',
    approvalTime: '4.2 min',
    marginScore: '68.4%',
    specs: {
      efficiency: '96.2%',
      laborBilled: '3.5 hrs',
      partsMargin: '+24.5%',
      syncStatus: 'Instant'
    }
  },
  {
    id: 'triaxle',
    name: 'Titan Tri-Axle Dump',
    category: 'Severe Duty Vocational',
    engine: '13L High-Torque Diesel',
    power: '505 hp / 1,750 lb-ft',
    laborRate: '$150.00 CAD',
    approvalTime: '3.8 min',
    marginScore: '71.2%',
    specs: {
      efficiency: '94.8%',
      laborBilled: '4.8 hrs',
      partsMargin: '+28.0%',
      syncStatus: 'Instant'
    }
  },
  {
    id: 'reefer',
    name: 'TransCold 53ft Reefer',
    category: 'Temperature Controlled',
    engine: 'ThermoKing Multi-Temp',
    power: '480V Electric Standby',
    laborRate: '$140.00 CAD',
    approvalTime: '5.1 min',
    marginScore: '65.0%',
    specs: {
      efficiency: '98.0%',
      laborBilled: '2.0 hrs',
      partsMargin: '+22.5%',
      syncStatus: 'Instant'
    }
  }
];

const MODES = [
  { id: 'diagnostics', label: 'Live Diagnostics', icon: Cpu, hotspotKey: 'engine' },
  { id: 'brakes', label: 'Brakes & Steering', icon: Wrench, hotspotKey: 'brakes' },
  { id: 'labor', label: 'Bay Time Clock', icon: Clock, hotspotKey: 'cab' },
  { id: 'margin', label: 'Margin Shield', icon: TrendingUp, hotspotKey: 'axle' },
  { id: 'approval', label: 'SMS Approval', icon: Smartphone, hotspotKey: 'trailer' }
];

const HOTSPOTS = {
  brakes: {
    x: '24%',
    y: '72%',
    title: 'Steer Axle & Kingpins',
    desc: 'Diagnosed play in drag link · 2.5 hrs labor authorized',
    metric: '$362.50 Labor CAD'
  },
  engine: {
    x: '22%',
    y: '48%',
    title: '15L Turbo Diesel Powertrain',
    desc: 'Live ECU fault scan active · SPN 3216 FMI 5 NOx Sensor',
    metric: '96.2% Diagnostic Accuracy'
  },
  cab: {
    x: '42%',
    y: '42%',
    title: 'Bay 2 Tablet Time Clock',
    desc: 'Journeyman Mike T. clocked in · Zero unbilled minutes',
    metric: '$145.00/hr Live Billing'
  },
  axle: {
    x: '76%',
    y: '70%',
    title: 'Drive Axles & Air Suspension',
    desc: 'Brake shoes at 15% · Replacement drums staged in inventory',
    metric: '+28.4% Parts Margin'
  },
  trailer: {
    x: '74%',
    y: '46%',
    title: 'Customer Live SMS Approval',
    desc: 'WO-8833 signed in 4 mins by Midwest Logistics',
    metric: '✓ Instant Digital Authorization'
  }
};

export default function Hero() {
  const [selectedModel, setSelectedModel] = useState(VEHICLE_MODELS[0]);
  const [activeMode, setActiveMode] = useState('diagnostics');
  const [activeHotspot, setActiveHotspot] = useState('engine');

  const handleModeClick = (mode) => {
    setActiveMode(mode.id);
    setActiveHotspot(mode.hotspotKey);
  };

  const currentHotspotData = HOTSPOTS[activeHotspot] || HOTSPOTS.engine;

  return (
    <section className={styles.heroWrapper}>
      {/* 1. Header Navigation Bar inside Hero Container */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.brandTitle}>FLEET FINANCE FLOW</span>
          <span className={styles.brandSub}>Commercial Shop Intelligence & Bay Telemetry</span>
        </div>

        {/* Model Switcher Pills (from inspiration) */}
        <div className={styles.modelSwitcher}>
          {VEHICLE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelectedModel(model)}
              className={`${styles.modelBtn} ${selectedModel.id === model.id ? styles.modelBtnActive : ''}`}
            >
              {model.name}
            </button>
          ))}
        </div>

        <div className={styles.topBarRight}>
          <Link href="/signup" className={styles.btnDirectTrial}>
            Start Free Trial
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* 2. Main Studio Showcase Canvas */}
      <div className={styles.studioCanvas}>
        {/* Giant Futuristic Ambient Backdrop Text (from Lamborghini inspiration) */}
        <div className={styles.ambientWatermark} aria-hidden="true">
          FLEET FLOW
        </div>

        {/* Top Left Vehicle Info Header */}
        <div className={styles.vehicleHeader}>
          <div className={styles.vehicleTitleRow}>
            <h1 className={styles.vehicleName}>{selectedModel.name}</h1>
            <span className={styles.tagLiveConfig}>LIVE BAY TELEMETRY</span>
          </div>
          <p className={styles.vehicleSub}>{selectedModel.category} · {selectedModel.engine} · {selectedModel.power}</p>
        </div>

        {/* Top Right Floating Luxury Feature Card (from Aston Martin inspiration) */}
        <div className={styles.floatingLuxuryCard}>
          <div className={styles.luxuryCardHeader}>
            <Cpu size={16} className={styles.luxuryIcon} />
            <span>Uncompromised Profit Visibility</span>
          </div>
          <p className={styles.luxuryCardText}>
            Full real-time synchronization between bay mechanics, service writers, and customer phone approvals.
          </p>
          <div className={styles.luxuryLiveRow}>
            <span className={styles.pulseLiveDot} />
            <span className={styles.luxuryLiveText}>Live Bay 2: WO-8833 Active</span>
          </div>
        </div>

        {/* Left Side Mode Selector Menu (from Aston Martin inspiration) */}
        <div className={styles.leftModeMenu}>
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeClick(mode)}
                className={`${styles.modeMenuBtn} ${isActive ? styles.modeMenuActive : ''}`}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Vehicle Image Showcase */}
        <div className={styles.vehicleDisplayContainer}>
          <div className={styles.imageContainer}>
            <Image
              src="/images/hero-truck-config.jpg"
              alt="Fleet Finance Flow Heavy-Duty Studio Model"
              width={1200}
              height={675}
              priority
              className={styles.truckStudioImage}
            />

            {/* Interactive Pulse Hotspots on Vehicle */}
            {Object.entries(HOTSPOTS).map(([key, spot]) => {
              const isSelected = activeHotspot === key;
              return (
                <div
                  key={key}
                  className={`${styles.hotspotAnchor} ${isSelected ? styles.hotspotActive : ''}`}
                  style={{ top: spot.y, left: spot.x }}
                  onClick={() => setActiveHotspot(key)}
                >
                  <div className={styles.hotspotNode}>
                    <div className={styles.nodeCore} />
                    <div className={styles.nodeRing} />
                  </div>

                  {/* Hotspot Floating Tooltip Callout */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={styles.hotspotTooltip}
                    >
                      <div className={styles.tooltipHeader}>{spot.title}</div>
                      <div className={styles.tooltipDesc}>{spot.desc}</div>
                      <div className={styles.tooltipMetric}>{spot.metric}</div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Hotspot Detail Overlay Card (Mobile/Desktop Sync) */}
        <div className={styles.activeCalloutCard}>
          <div className={styles.calloutTag}>SELECTED SUBSYSTEM</div>
          <h4 className={styles.calloutTitle}>{currentHotspotData.title}</h4>
          <p className={styles.calloutDesc}>{currentHotspotData.desc}</p>
          <div className={styles.calloutMetricBadge}>{currentHotspotData.metric}</div>
        </div>

        {/* 3. Bottom Feature Highlights Telemetry Spec Ribbon (from Aston Martin & Lamborghini inspiration) */}
        <div className={styles.specRibbon}>
          <div className={styles.specRibbonHeader}>
            <span className={styles.specRibbonTitle}>Feature Highlights & Shop Telemetry</span>
            <span className={styles.specRibbonSub}>Real-Time Operations</span>
          </div>

          <div className={styles.specGrid}>
            <div className={styles.specCard}>
              <div className={styles.specLabel}>Billed Labor Efficiency</div>
              <div className={styles.specValue}>{selectedModel.specs.efficiency}</div>
              <div className={styles.specFooter}>vs 68% industry average</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Customer Approval Time</div>
              <div className={styles.specValue}>{selectedModel.approvalTime}</div>
              <div className={styles.specFooter}>via instant SMS portal</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Shop Labor Rate</div>
              <div className={styles.specValue}>{selectedModel.laborRate}</div>
              <div className={styles.specFooter}>per flat-rate hour</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Parts Gross Margin</div>
              <div className={styles.specValue}>{selectedModel.specs.partsMargin}</div>
              <div className={styles.specFooter}>automated matrix markup</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>QuickBooks Sync</div>
              <div className={styles.specValue}>{selectedModel.specs.syncStatus}</div>
              <div className={styles.specFooter}>2-way ledger updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Action Banner */}
      <div className={styles.bottomActionBanner}>
        <div>
          <h3 className={styles.bottomBannerHeadline}>Your Shop Runs on Numbers. Make Sure They're Right.</h3>
          <p className={styles.bottomBannerSub}>Manage jobs, floor time, parts margins, and customer sign-offs with zero leaks.</p>
        </div>
        <div className={styles.bottomBannerCtas}>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start 14-Day Free Trial
            <ArrowRight size={18} />
          </Link>
          <Link href="/bay" className="btn btn-outline btn-lg">
            <PlayCircle size={18} />
            Launch Live Bay Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
