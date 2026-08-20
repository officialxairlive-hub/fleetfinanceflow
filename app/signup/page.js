'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    shopName: '',
    fullName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Signup failed. Please try again.');
      }

      // 2. Create the Shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert([{ name: formData.shopName }])
        .select()
        .single();

      if (shopError) throw shopError;

      // 3. Create the Profile (Assign as Owner)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          shop_id: shopData.id,
          role: 'owner',
          full_name: formData.fullName
        }]);

      if (profileError) throw profileError;

      // Signup successful!
      router.push('/dashboard');
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Shop</h1>
          <p className={styles.subtitle}>Sign up to get started with Fleet Finance Flow.</p>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="shopName">Shop / Company Name</label>
            <input 
              id="shopName"
              name="shopName"
              type="text" 
              className={styles.input} 
              placeholder="e.g. Acme Truck Repair"
              value={formData.shopName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="fullName">Your Full Name</label>
            <input 
              id="fullName"
              name="fullName"
              type="text" 
              className={styles.input} 
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email Address</label>
            <input 
              id="email"
              name="email"
              type="email" 
              className={styles.input} 
              placeholder="owner@shop.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input 
              id="password"
              name="password"
              type="password" 
              className={styles.input} 
              placeholder="Create a password (min 6 chars)"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.footerLink}>Log in here</Link>
        </div>
      </div>
    </div>
  );
}
