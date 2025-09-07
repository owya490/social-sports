import heroPhoneImage from "@/public/images/mocks/sportshub-iphone-web-mock.png";
import Image from "next/image";
import styles from "./ImageHero.module.css";

export default function ImageHeroPhone() {
  return (
    <div className={`${styles.heroImageContainer} md:hidden`}>
      <div className={styles.bleedRoot}>
        <div className={styles.heroIllustrationRootPhone}>
          <div className={styles.heroIllustrationPerspective}>
            <div className={styles.heroIllustrationBasePhone}>
              <Image src={heroPhoneImage} alt="SportHub Platform Interface" fill priority />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
