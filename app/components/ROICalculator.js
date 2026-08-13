'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DollarSign, Clock, TrendingUp, ArrowRight, Calculator } from 'lucide-react';
import styles from './ROICalculator.module.css';

export default function ROICalculator() {
  const [techs, setTechs] = useState(8);
  const [laborRate, setLaborRate] = useState(140);
  const [monthlyROs, setMonthlyROs] = useState(120);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });

  // Calculations based on shop industry standards:
  // - Avg 3.5 lost billed labor hours per tech per month due to inaccurate clocking & unlogged time
  // - Avg $45 lost parts markup / missed fee per RO
  const lostLaborMonthly = techs * 3.5 * laborRate;
  const lostPartsMonthly = monthlyROs * 35;
  const totalMonthlyRecovered = Math.round(lostLaborMonthly + lostPartsMonthly);
  const totalAnnualRecovered = totalMonthlyRecovered * 12;
  const hoursSavedMonthly = Math.round(techs * 14);

  return (
    <section className={`section ${styles.roiSection}`} ref={ref}>
      <div className="container">
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">INTERACTIVE PROFIT CALCULATOR</div>
            <h2 className="section-title">See how much profit your shop is leaking.</h2>
            <p className="section-subtitle">
              Adjust the sliders below to estimate how much unbilled labor and missed parts markup Fleet Finance Flow can recover for your shop.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={styles.calculatorCard}
        >
          <div className={styles.grid}>
            {/* Sliders Control Column */}
            <div className={styles.controlsCol}>
              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <label htmlFor="techs-slider" className={styles.sliderLabel}>Number of Technicians</label>

                  <span className={styles.sliderValue}>{techs} Techs</span>
                </div>
                <input
                  id="techs-slider"
                  type="range"
                  min="1"
                  max="40"
                  value={techs}
                  onChange={(e) => setTechs(Number(e.target.value))}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderTicks}>
                  <span>1 Tech</span>
                  <span>20 Techs</span>
                  <span>40 Techs</span>
                </div>
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <label htmlFor="labor-slider" className={styles.sliderLabel}>Average Billed Labor Rate</label>
                  <span className={styles.sliderValue}>${laborRate} / hr</span>
                </div>
                <input
                  id="labor-slider"
                  type="range"
                  min="80"
                  max="250"
                  step="5"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderTicks}>
                  <span>$80/hr</span>
                  <span>$165/hr</span>
                  <span>$250/hr</span>
                </div>
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <label htmlFor="ros-slider" className={styles.sliderLabel}>Monthly Repair Orders (ROs)</label>
                  <span className={styles.sliderValue}>{monthlyROs} ROs / mo</span>
                </div>
                <input
                  id="ros-slider"
                  type="range"
                  min="20"
                  max="400"
                  step="10"
                  value={monthlyROs}
                  onChange={(e) => setMonthlyROs(Number(e.target.value))}
                  className={styles.sliderInput}
                />
                <div className={styles.sliderTicks}>
                  <span>20 ROs</span>
                  <span>200 ROs</span>
                  <span>400 ROs</span>
                </div>
              </div>
            </div>

            {/* Live Results Column */}
            <div className={styles.resultsCol}>
              <div className={styles.resultsHeader}>
                <Calculator size={20} className={styles.calcIcon} />
                <span>Estimated Recovered Profit</span>
              </div>

              <div className={styles.mainResultBox}>
                <div className={styles.mainResultLabel}>Monthly Recovered Revenue</div>
                <div className={styles.mainResultAmount}>
                  ${totalMonthlyRecovered.toLocaleString()}
                  <span className={styles.perMonth}>/mo</span>
                </div>
              </div>

              <div className={styles.secondaryGrid}>
                <div className={styles.secondaryBox}>
                  <div className={styles.secondaryIconWrapper}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <div className={styles.secondaryValue}>+${totalAnnualRecovered.toLocaleString()}</div>
                    <div className={styles.secondaryLabel}>Annual Profit Impact</div>
                  </div>
                </div>

                <div className={styles.secondaryBox}>
                  <div className={styles.secondaryIconWrapper}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className={styles.secondaryValue}>{hoursSavedMonthly} hrs</div>
                    <div className={styles.secondaryLabel}>Unbilled Time Recovered</div>
                  </div>
                </div>
              </div>

              <button className={`btn btn-primary btn-lg ${styles.roiCta}`}>
                Recover Your Profit Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
