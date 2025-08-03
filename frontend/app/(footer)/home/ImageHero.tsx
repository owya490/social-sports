"use client";

import Image from "next/image";
import styles from "./ImageHero.module.css";
import heroImage from "@/public/images/mocks/sportshub-mac-web-mock.png";
import heroPhoneImage from "@/public/images/mocks/sportshub-iphone-web-mock.png";

export default function ImageHero() {
  return (
    <div className={`${styles.heroImageContainer} hidden md:block`}>
      <div className={styles.bleedRoot}>
        <div className={styles.heroIllustrationRoot}>
          <div className={styles.heroIllustrationPerspective}>
            <div className={styles.heroIllustrationBase}>
              <Image
                src={heroImage}
                alt="SportHub Platform Interface"
                fill
                // style={{ objectFit: "cover", objectPosition: "center" }}
                priority
                className="hidden md:block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
