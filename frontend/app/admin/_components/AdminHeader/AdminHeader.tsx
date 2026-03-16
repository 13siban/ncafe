'use client';

import React from 'react';
import { Menu, Bell, HelpCircle } from 'lucide-react';
import styles from './AdminHeader.module.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  breadcrumbs = [],
  onMenuClick,
}) => {
  const router = useRouter();
  const [hasNewOrder, setHasNewOrder] = React.useState(false);

  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;

      eventSource = new EventSource('/api/admin/orders/subscribe');

      eventSource.addEventListener('new_order', (event) => {
        try {
          const data = JSON.parse(event.data);
          setHasNewOrder(true);
          toast((t) => (
            <span 
              onClick={() => {
                router.push('/admin/orders');
                toast.dismiss(t.id);
              }}
            >
              🔔 새 주문이 들어왔습니다! {data.displayNumber} - {data.summary}
            </span>
          ), {
            duration: 5000,
            position: 'top-right',
            style: { cursor: 'pointer', marginTop: '60px' },
          });
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.onopen = () => {
        retryCount = 0; // 연결 성공 시 재시도 횟수 리셋
      };

      eventSource.onerror = () => {
        // 브라우저가 자동 재연결을 시도하지만, CLOSED 상태가 되면 수동 재연결
        if (eventSource?.readyState === EventSource.CLOSED) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // 최대 30초
          retryCount++;
          console.log(`SSE connection closed, retrying in ${delay / 1000}s...`);
          retryTimeout = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      unmounted = true;
      eventSource?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [router]);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          <button className={styles.menuButton} onClick={onMenuClick} aria-label="메뉴 열기">
            <Menu size={24} />
          </button>

          {breadcrumbs.length > 0 && (
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className={styles.breadcrumbCurrent}>{item.label}</span>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>


          {/* Help */}
          <button className={styles.iconButton} aria-label="도움말">
            <HelpCircle size={20} />
          </button>

          {/* Notifications */}
          <button 
            className={`${styles.iconButton} ${hasNewOrder ? styles.newOrderAlert : ''}`} 
            aria-label="알림"
            onClick={() => {
              setHasNewOrder(false);
              router.push('/admin/orders');
            }}
          >
            <Bell size={20} className={hasNewOrder ? styles.alertIcon : ''} />
            {hasNewOrder && <span className={styles.notificationBadge} style={{ backgroundColor: 'red' }} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
