"use client"
import Link from "next/link"
import styles from './Navbar.module.css'
import { usePathname } from "next/navigation"

export const Navbar = () => {
    const pathname=usePathname();
    if (pathname.startsWith('/race-mode/') ) {
        return null;
    }
    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <div className={styles.logo}>
                    <Link href='/'>F1 <span>STORY</span></Link>
                </div>
                <div className={styles.navLinks}>
                    <Link href='/' className={styles.link}>Ana Sayfa</Link>
                    <Link href='/race-mode' className={styles.link} style={{ color: '#00e676', fontWeight: 'bold' }}>🎮 Yarış Modu</Link>
                    <Link href='/season-simulate' className={styles.link} style={{ color: '#ff3333', fontWeight: 'bold' }}>⚡ Sezon Simülasyonu</Link>
                    <Link href='/standings/drivers' className={styles.link}>Sürücüler</Link>
                    <Link href='/standings/teams' className={styles.link}>Takımlar</Link>
                    <Link href='/locations' className={styles.link}>Takvim</Link>
                </div>
            </div>
        </nav>
    )
}
