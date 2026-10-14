'use client'
import styles from './TeamStanding.module.css';
import Link from "next/link"
import Image from "next/image"
import { useGameStore } from '../store/gameStore';

export const TeamStandingList = () => {
    const teams = useGameStore(state => state.teams);
    const standingTeams = [...teams].sort((a, b) => b.points - a.points);
    
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Takımlar Puan Durumu</h2>
            
            <div className={styles.list}>
                {standingTeams.map((team, index) => (
                    <Link href={`/teams/${team.name}`} key={index} className={styles.teamRow}>
                        <div className={styles.position}>{index + 1}</div>
                        
                        <div className={styles.teamInfo}>
                            <div className={styles.nameWrapper}>
                                <span className={styles.teamName}>{team.name}</span>
                            </div>
                        </div>
                        
                        <div className={styles.rightContent}>
                            <div className={styles.imageWrapper}>
                                <Image src={team.image} alt={team.name} width={150} height={50} className={styles.teamImage} />
                            </div>
                            
                            <div className={styles.pointsWrapper}>
                                <span className={styles.points}>{team.points}</span>
                                <span className={styles.ptsLabel}>PTS</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
