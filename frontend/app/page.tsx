"use client";

import React from 'react';
import Header from '@/components/common/Header/Header';
import { Footer } from '@/components/common';
import { Hero } from './_components/Hero/Hero';
import { FeatureSections } from './_components/FeatureSections/FeatureSections';
import { SignatureSection } from './_components/SignatureSection/SignatureSection';
import GradeSection from './_components/GradeSection/GradeSection';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <Header />
      <div className={styles.contentWrapper}>
        <Hero />
        <FeatureSections />
        <SignatureSection />
        <GradeSection />
      </div>
      <Footer />
    </main>
  );
}
