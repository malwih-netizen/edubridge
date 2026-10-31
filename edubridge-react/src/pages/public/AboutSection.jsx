import { useTranslation } from 'react-i18next';
import { Target, UsersRound } from 'lucide-react';

const FACTS = ['members', 'modules', 'weeks', 'year'];

/** "About us": project facts and why the four students built EduBridge. */
export default function AboutSection() {
  const { t } = useTranslation('public');

  return (
    <section className="pub-about" id="about">
      <div className="pub-about-inner">
        <dl className="pub-about-facts">
          {FACTS.map((k) => (
            <div key={k}>
              <dt>{t(`aboutUs.facts.${k}`)}</dt>
              <dd className="ltr">{t(`aboutUs.factsValues.${k}`)}</dd>
            </div>
          ))}
        </dl>

        <div className="pub-about-story">
          <article>
            <span className="pas-icon"><UsersRound aria-hidden /></span>
            <h3>{t('aboutUs.storyTitle')}</h3>
            <p>{t('aboutUs.story')}</p>
          </article>
          <article className="mission">
            <span className="pas-icon"><Target aria-hidden /></span>
            <h3>{t('aboutUs.missionTitle')}</h3>
            <p>{t('aboutUs.mission')}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
