import Link from 'next/link';
import { Coffee, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Coffee size={40} />
        </div>
        
        <h1 className={styles.title}>NCafe</h1>
        <p className={styles.description}>
          카페 메뉴를 쉽고 빠르게 관리하세요.<br />
          카페 사장님을 위한 스마트 메뉴 관리 시스템입니다.
        </p>
        
        <div className={styles.buttons}>
          <Link href="/admin" className={styles.primaryButton}>
            관리자 페이지로 이동
            <ArrowRight size={20} />
          </Link>
          <Link href="/admin/menus" className={styles.secondaryButton}>
            메뉴 목록 보기
          </Link>
        </div>
        
        <p className={styles.footer}>
          © 2026 NCafe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
