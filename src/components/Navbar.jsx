"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import styles from './Navbar.module.css'

export const Navbar = () => {
    const pathname = usePathname();

    if (pathname && pathname.startsWith('/race-mode/') && pathname !== '/race-mode') {
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
                    <Link href='/season-simulate' className={styles.link} style={{ color: '#ff3333', fontWeight: 'bold' }}>⚡ Sezon Simülasyonu</Link>
                    <Link href='/standings/drivers' className={styles.link}>Sürücüler</Link>
                    <Link href='/standings/teams' className={styles.link}>Takımlar</Link>
                    <Link href='/locations' className={styles.link}>Takvim</Link>
                    <Link href='/select-mode' className={styles.link}>Mod Değiştir</Link>
                </div>
            </div>
        </nav>
    )
}
