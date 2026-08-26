'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './Hero.module.css';
import TruckBlueprintSVG from './TruckBlueprintSVG';
import { 
  ArrowRight, 
  PlayCircle, 
  Wrench, 
  Cpu, 
  TrendingUp, 
  Clock, 
  Smartphone,
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
    specs: {
      efficiency: '96.2%',
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
    specs: {
      efficiency: '94.8%',
      partsMargin: '+28.0%',
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
    title: 'Steer Axle & Kingpins',
    desc: 'Diagnosed play in drag link · 2.5 hrs labor authorized',
    metric: '$362.50 Labor CAD'
  },
  engine: {
    title: '15L Turbo Diesel Powertrain',
    desc: 'Live ECU fault scan active · SPN 3216 FMI 5 NOx Sensor',
    metric: '96.2% Diagnostic Accuracy'
  },
  cab: {
    title: 'Bay 2 Tablet Time Clock',
    desc: 'Journeyman Mike T. clocked in · Zero unbilled minutes',
    metric: '$145.00/hr Live Billing'
  },
  axle: {
    title: 'Drive Axles & Air Suspension',
    desc: 'Brake shoes at 15% · Replacement drums staged in inventory',
    metric: '+28.4% Parts Margin'
  },
  trailer: {
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

  const handleSvgHotspotClick = (key) => {
    setActiveHotspot(key);
    const mode = MODES.find(m => m.hotspotKey === key);
    if (mode) setActiveMode(mode.id);
  };

  const currentHotspotData = HOTSPOTS[activeHotspot] || HOTSPOTS.engine;

  return (
    <section className={styles.heroWrapper}>
      
      {/* Top Banner: Logo & Model Switcher */}
      <div className={styles.topBar}>
        <div className={styles.brandGroup}>
          <span className={styles.brandTitle}>FLEET FLOW</span>
          <span className={styles.brandSub}>Commercial Intelligence</span>
        </div>

        <div className={styles.modelSwitcher}>
          {VEHICLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`${styles.modelBtn} ${selectedModel.id === model.id ? styles.modelBtnActive : ''}`}
            >
              {model.name}
            </button>
          ))}
        </div>

        <Link href="/signup" className={styles.btnDirectTrial}>
          Start Free Trial <ArrowRight size={14} />
        </Link>
      </div>

      {/* Main Studio Canvas */}
      <div className={styles.studioCanvas}>
        <div className={styles.ambientWatermark} aria-hidden="true">
          FLEET FLOW
        </div>

        <div className={styles.canvasGrid}>
          
          {/* Left Column: Model Info & Modes */}
          <div className={styles.leftColumn}>
            <div className={styles.vehicleHeader}>
              <span className={styles.tagLiveConfig}>LIVE TELEMETRY</span>
              <h1 className={styles.vehicleName}>{selectedModel.name}</h1>
              <p className={styles.vehicleSub}>{selectedModel.engine} · {selectedModel.power}</p>
            </div>

            <div className={styles.modeMenu}>
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode)}
                    className={`${styles.modeMenuBtn} ${isActive ? styles.modeMenuActive : ''}`}
                  >
                    <Icon size={16} />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: The SVG Vehicle Configurator */}
          <div className={styles.centerColumn}>
            <div className={styles.svgContainer}>
              <TruckBlueprintSVG 
                activeHotspot={activeHotspot} 
                onHotspotClick={handleSvgHotspotClick} 
              />
            </div>
            
            {/* Active Tooltip Info Box (Mobile friendly placement) */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeHotspot}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={styles.activeCalloutCard}
              >
                <div className={styles.calloutTag}>SELECTED SUBSYSTEM</div>
                <h4 className={styles.calloutTitle}>{currentHotspotData.title}</h4>
                <p className={styles.calloutDesc}>{currentHotspotData.desc}</p>
                <div className={styles.calloutMetricBadge}>{currentHotspotData.metric}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Luxury Card & CTAs */}
          <div className={styles.rightColumn}>
            <div className={styles.floatingLuxuryCard}>
              <div className={styles.luxuryCardHeader}>
                <Cpu size={16} className={styles.luxuryIcon} />
                <span>Profit Visibility</span>
              </div>
              <p className={styles.luxuryCardText}>
                Real-time synchronization between mechanics, service writers, and customer approvals.
              </p>
              <div className={styles.luxuryLiveRow}>
                <span className={styles.pulseLiveDot} />
                <span className={styles.luxuryLiveText}>Live Bay 2: WO-8833 Active</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Telemetry Ribbon */}
      <div className={styles.specRibbon}>
        <div className={styles.specCard}>
          <div className={styles.specLabel}>Labor Efficiency</div>
          <div className={styles.specValue}>{selectedModel.specs.efficiency}</div>
        </div>
        <div className={styles.specCard}>
          <div className={styles.specLabel}>Approval Time</div>
          <div className={styles.specValue}>{selectedModel.approvalTime}</div>
        </div>
        <div className={styles.specCard}>
          <div className={styles.specLabel}>Shop Rate</div>
          <div className={styles.specValue}>{selectedModel.laborRate}</div>
        </div>
        <div className={styles.specCard}>
          <div className={styles.specLabel}>Parts Margin</div>
          <div className={styles.specValue}>{selectedModel.specs.partsMargin}</div>
        </div>
        <div className={styles.specCard}>
          <div className={styles.specLabel}>QuickBooks</div>
          <div className={styles.specValue}>{selectedModel.specs.syncStatus}</div>
        </div>
      </div>

      {/* Final Action Banner */}
      <div className={styles.bottomActionBanner}>
        <div className={styles.bannerText}>
          <h3 className={styles.bottomBannerHeadline}>Your Shop Runs on Numbers. Make Sure They're Right.</h3>
          <p className={styles.bottomBannerSub}>Manage jobs, floor time, parts margins, and customer sign-offs with zero leaks.</p>
        </div>
        <div className={styles.bottomBannerCtas}>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start 14-Day Free Trial
          </Link>
          <Link href="/bay" className="btn btn-outline btn-lg">
            Launch Live Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
