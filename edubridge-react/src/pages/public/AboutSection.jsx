import { useTranslation } from 'react-i18next';
import { Database, Layout, Server, Target, UsersRound } from 'lucide-react';

// صور مؤقتة — استبدلي الملفات في src/assets/team بصور حقيقية (نفس الاسم، أو غيّري الامتداد هنا)
import lamiaImg from '@/assets/team/lamia.svg';
import nadaImg from '@/assets/team/nada.svg';
import alaaImg from '@/assets/team/alaa.svg';
import janeenImg from '@/assets/team/janeen.svg';

const TEAM = [
  { id: 'lamia', icon: Server, photo: lamiaImg },
  { id: 'nada', icon: Layout, photo: nadaImg },
  { id: 'alaa', icon: Database, photo: alaaImg },
  { id: 'janeen', icon: Target, photo: janeenImg },
];
const FACTS = ['members', 'modules', 'weeks', 'year'];

/** "About us": the four students behind EduBridge and why they built it. */
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

        <div className="pub-about-grid">
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

          <div className="pub-about-team">
            <div className="pat-head">
              <h3>{t('aboutUs.teamTitle')}</h3>
              <span>{t('aboutUs.supervisor')}</span>
            </div>
            <ul>
              {TEAM.map(({ id, icon: Icon, photo }) => (
                <li key={id}>
                  <img className="pat-photo" src={photo} alt={t(`aboutUs.members.${id}.name`)} width="64" height="64" loading="lazy" />
                  <div className="pat-body">
                    <b>{t(`aboutUs.members.${id}.name`)}</b>
                    <span className="pat-role"><Icon aria-hidden />{t(`aboutUs.members.${id}.role`)}</span>
                    <small>{t(`aboutUs.members.${id}.focus`)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
