"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "../store/gameStore";
import styles from "./ModeSelectPage.module.css";

const ModeSelectPage = () => {
  const router = useRouter();
  const mode = useGameStore((state) => state.mode);
  const setMode = useGameStore((state) => state.setMode);

  const handleSelect = (selectedMode) => {
    setMode(selectedMode);
    router.push("/");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Oyun Modunu <span>Seçin</span>
        </h1>
      </div>

      <div className={styles.grid}>
        <div
          className={`${styles.card} ${mode === 0 ? styles.cardActive : ""}`}
          onClick={() => handleSelect(0)}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>🔘</div>
            </div>
            <h2 className={styles.cardTitle}>Normal Mod</h2>
          </div>

          <button
            className={`${styles.actionButton} ${
              mode === 0 ? styles.buttonActive : styles.buttonDefault
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(0);
            }}
          >
            {mode === 0 ? "✓ Seçili" : "Seç"}
          </button>
        </div>

        <div
          className={`${styles.card} ${mode === 1 ? styles.cardActive : ""}`}
          onClick={() => handleSelect(1)}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardTop}>
              <div className={styles.iconWrapper}>🎮</div>
            </div>
            <h2 className={styles.cardTitle}>Oyun Modu</h2>
          </div>

          <button
            className={`${styles.actionButton} ${
              mode === 1 ? styles.buttonActive : styles.buttonDefault
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(1);
            }}
          >
            {mode === 1 ? "✓ Seçili" : "Seç"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectPage;