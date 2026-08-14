'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Wrench, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertCircle } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [role, setRole] = useState('owner'); // 'owner' | 'staff'
  const [email, setEmail] = useState('owner@fleetfinanceflow.com');
  const [password, setPassword] = useState('demo123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'owner') {
      setEmail('owner@fleetfinanceflow.com');
      setPassword('demo123456');
    } else {
      setEmail('tech@fleetfinanceflow.com');
      setPassword('demo123456');
    }
  };

  const handleQuickDemo = (demoRole) => {
    handleRoleChange(demoRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Attempt Supabase Auth sign in if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;
      }

      // Demo redirection
      if (role === 'owner') {
        router.push('/dashboard');
      } else {
        router.push('/bay');
      }
    } catch (err) {
      console.warn('Supabase auth fallback to demo mode:', err.message);
      // Fallback for demo mode
      if (role === 'owner') {
        router.push('/dashboard');
      } else {
        router.push('/bay');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className="grid-bg" />
      
      <div className={styles.loginCard}>
        {/* Header Logo */}
        <div className={styles.logoHeader}>
          <Link href="/">
            <Logo size="default" showText={true} />
          </Link>
          <span className={styles.subHeader}>Shop Operations & Profit Management</span>
        </div>

        {/* Quick Demo Autofill Banner */}
        <div className={styles.demoBanner}>
          <div className={styles.demoHeader}>
            <UserCheck size={16} className={styles.demoIcon} />
            <span>1-Click Quick Demo Login</span>
          </div>
          <div className={styles.demoButtons}>
            <button
              type="button"
              onClick={() => handleQuickDemo('owner')}
              className={`${styles.demoBtn} ${role === 'owner' ? styles.demoBtnActive : ''}`}
            >
              👑 Demo Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('staff')}
              className={`${styles.demoBtn} ${role === 'staff' ? styles.demoBtnActive : ''}`}
            >
              🔧 Demo Staff / Tech
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className={styles.roleTabs}>
          <button
            type="button"
            onClick={() => handleRoleChange('owner')}
            className={`${styles.roleTab} ${role === 'owner' ? styles.roleTabActive : ''}`}
          >
            <ShieldCheck size={18} />
            <span>Shop Owner / Manager</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('staff')}
            className={`${styles.roleTab} ${role === 'staff' ? styles.roleTabActive : ''}`}
          >
            <Wrench size={18} />
            <span>Staff / Technician</span>
          </button>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              {role === 'owner' ? 'Owner Email' : 'Staff / Tech Email'}
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@shopname.com"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Demo Mode: Use password demo123456'); }} className={styles.forgotLink}>
                Forgot password?
              </a>
            </div>
            <div className={styles.inputWrapper}>
              <KeyRound size={18} className={styles.inputIcon} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary btn-lg ${styles.submitBtn}`}
          >
            {loading ? 'Signing in...' : `Log In as ${role === 'owner' ? 'Shop Owner' : 'Staff Member'}`}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer info */}
        <div className={styles.cardFooter}>
          <p>Don't have a shop account yet? <Link href="/" className={styles.footerLink}>Book a Walkthrough</Link></p>
          <Link href="/" className={styles.backHome}>← Back to main site</Link>
        </div>
      </div>
    </div>
  );
}
