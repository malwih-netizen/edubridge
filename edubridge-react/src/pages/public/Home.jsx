import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Award, BellRing, BookOpenCheck, Check, ChevronDown, FileText, FolderCheck, Globe2, GraduationCap, Languages, PenLine, Search, Send, ShieldCheck, UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PublicFooter, PublicHeader } from './PublicChrome';
import ContactSection from './ContactSection';
import AboutSection from './AboutSection';
import heroImg from '@/assets/hero-students.jpg';
import guidanceImg from '@/assets/guidance-session.jpg';
import journeyImg from '@/assets/study-journey.jpg';
import './public.css';

const SERVICES = [
  { id: 'scholarshipSearch', icon: Search },
  { id: 'filePreparation', icon: FolderCheck },
  { id: 'cv', icon: FileText },
  { id: 'motivationLetter', icon: PenLine },
  { id: 'translation', icon: Languages },
  { id: 'applicationAssistance', icon: Send },
  { id: 'followUp', icon: BellRing },
];

const ROLES = [
  { id: 'student', icon: GraduationCap, to: '/student' },
  { id: 'employee', icon: UsersRound, to: '/employee' },
  { id: 'admin', icon: ShieldCheck, to: '/admin' },
];

/** Fades its content in once it scrolls into view. */
function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal${shown ? ' in' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  );
}

function SectionHead({ title, text, center }) {
  return (
    <Reveal className={`pub-head${center ? ' center' : ''}`}>
      <div>
        <h2>{title}</h2>
      </div>
      {text && <p className="pub-head-text">{text}</p>}
    </Reveal>
  );
}

export default function Home() {
  const { t } = useTranslation('public');
  const { t: tc } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="pub">
      <PublicHeader />

      <main>
        {/* ---------- Hero ---------- */}
        <section className="pub-hero" id="home">
          <div className="pub-hero-copy fade-up">
            <h1>{t('hero.title1')} <em>{t('hero.titleEm')}</em></h1>
            <p className="pub-hero-text">{t('hero.text')}</p>
            <div className="pub-hero-ctas">
              <Button size="lg" to="/login" iconEnd={ArrowRight}>{t('hero.cta')}</Button>
            </div>
          </div>

          <div className="pub-hero-visual fade-up" style={{ animationDelay: '120ms' }}>
            <div className="pub-arches" aria-hidden><span /><span /><span /></div>
            <img src={heroImg} alt={t('hero.imageAlt')} className="pub-hero-img" />
          </div>
        </section>

        {/* ---------- Proof strip ---------- */}
        <section className="pub-proof" aria-label={tc('brand')}>
          {[[Globe2, 'p1'], [Award, 'p2'], [BookOpenCheck, 'p3']].map(([Icon, k], i) => (
            <Reveal key={k} className="pub-proof-item" delay={i * 90}>
              <Icon aria-hidden />
              <span><strong>{t(`proof.${k}Title`)}</strong>{t(`proof.${k}Text`)}</span>
            </Reveal>
          ))}
        </section>

        {/* ---------- Services ---------- */}
        <AboutSection />

        <section className="pub-section" id="services">
          <SectionHead title={t('services.title')} />
          <div className="pub-services">
            {SERVICES.map(({ id, icon: Icon }, i) => (
              <Reveal key={id} as={Link} to="/login" className="pub-service" delay={(i % 4) * 70}>
                <span className="pub-service-icon"><Icon aria-hidden /></span>
                <h3>{tc(`services.${id}.title`)}</h3>
                <p>{tc(`services.${id}.desc`)}</p>
                <span className="pub-link">{t('services.cta')}<ArrowRight className="flip-rtl" aria-hidden /></span>
              </Reveal>
            ))}
            <Reveal className="pub-service more" delay={210}>
              <h3>{t('services.moreTitle')}</h3>
              <p>{t('services.moreText')}</p>
              <Button to="/login" size="sm" iconEnd={ArrowRight}>{t('nav.apply')}</Button>
            </Reveal>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="pub-section pub-journey" id="how">
          <Reveal className="pub-journey-media">
            <img src={journeyImg} alt={t('how.imageAlt')} />
            <div className="pub-journey-label"><BookOpenCheck aria-hidden /><span>{t('how.imageLabel')}</span></div>
          </Reveal>
          <div className="pub-journey-copy">
            <Reveal>
              <h2>{t('how.title')}</h2>
              <p className="pub-head-text">{t('how.text')}</p>
            </Reveal>
            <ol className="pub-steps">
              {[1, 2, 3, 4].map((n, i) => (
                <Reveal as="li" key={n} delay={i * 80}>
                  <span className="pub-step-num">{String(n).padStart(2, '0')}</span>
                  <div>
                    <h3>{t(`how.s${n}Title`)}</h3>
                    <p>{t(`how.s${n}Text`)}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Guidance band ---------- */}
        <section className="pub-guidance" id="guidance">
          <div className="pub-arches" aria-hidden><span /><span /><span /></div>
          <Reveal className="pub-guidance-copy">
            <h2>{t('guidance.title')}</h2>
            <p>{t('guidance.text')}</p>
            <ul className="pub-checks">
              {['p1', 'p2', 'p3'].map((k) => <li key={k}><Check aria-hidden />{t(`guidance.${k}`)}</li>)}
            </ul>
            <Button size="lg" to="/login" iconEnd={ArrowRight}>{t('guidance.cta')}</Button>
          </Reveal>
          <Reveal className="pub-guidance-media" delay={120}>
            <img src={guidanceImg} alt={t('guidance.imageAlt')} />
          </Reveal>
        </section>

        {/* ---------- Roles ---------- */}
        <section className="pub-section" id="roles">
          <Reveal className="pub-head">
            <div>
              <h2>{t('roles.title')}</h2>
            </div>
            <Link to="/student" className="pub-link">{t('roles.cta')}<ArrowRight className="flip-rtl" aria-hidden /></Link>
          </Reveal>
          <div className="pub-roles">
            {ROLES.map(({ id, icon: Icon, to }, i) => (
              <Reveal key={id} as={Link} to={to} className={`pub-role ${id}`} delay={i * 90}>
                <span className="pub-role-icon"><Icon aria-hidden /></span>
                <h3>{t(`roles.${id}.title`)}</h3>
                <ul>
                  {['f1', 'f2', 'f3'].map((f) => <li key={f}><Check aria-hidden />{t(`roles.${id}.${f}`)}</li>)}
                </ul>
                <span className="pub-role-go" aria-hidden><ArrowRight className="flip-rtl" /></span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="pub-section pub-faq-wrap" id="faq">
          <SectionHead title={t('faq.title')} center />
          <div className="pub-faq">
            {[1, 2, 3, 4].map((n, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={n} className={`pub-faq-item${open ? ' open' : ''}`} delay={i * 60}>
                  <h3>
                    <button
                      type="button"
                      id={`faq-q${n}`}
                      aria-expanded={open}
                      aria-controls={`faq-a${n}`}
                      onClick={() => setOpenFaq(open ? -1 : i)}
                    >
                      <span>{t(`faq.q${n}`)}</span>
                      <ChevronDown aria-hidden />
                    </button>
                  </h3>
                  <div id={`faq-a${n}`} role="region" aria-labelledby={`faq-q${n}`} className="pub-faq-a" hidden={!open}>
                    <p>{t(`faq.a${n}`)}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ---------- CTA band ---------- */}
        <ContactSection />

        <section className="pub-section pub-cta-wrap">
          <Reveal className="pub-cta">
            <div>
              <h2>{t('cta.title')}</h2>
              <p>{t('cta.text')}</p>
            </div>
            <div className="pub-cta-actions">
              <Button size="lg" to="/login" iconEnd={ArrowRight}>{t('cta.primary')}</Button>
              <Button size="lg" variant="outline" to="/login">{t('cta.secondary')}</Button>
            </div>
          </Reveal>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
