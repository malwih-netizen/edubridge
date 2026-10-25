import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft, Bookmark, BookmarkCheck, Building2, CalendarDays, CheckCircle2, CircleDashed, Clock, FileText, GraduationCap, MapPin, MessageCircle, SearchX, Send, Wallet, XCircle } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, PageHeader, ProgressBar, ProgressRing, Textarea, statusTone } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useAsync, useLocalized } from '@/hooks';
import { scholarshipService, studentService } from '@/services/dataService';
import { REQUIRED_DOCS, WEIGHTS, matchScore } from '@/services/matching';
import './student.css';

const RING = { eligible: 'var(--success)', potential: 'var(--warning)', notSuitable: 'var(--danger)' };
const partState = (p) => (p >= 1 ? 'met' : p > 0 ? 'partial' : 'unmet');
const PART_ICON = { met: CheckCircle2, partial: CircleDashed, unmet: XCircle };
const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

export default function ScholarshipDetails() {
  const { id } = useParams();
  const { t } = useTranslation('student');
  const { t: tc } = useTranslation();
  const { loc, fmtDate, fmtNum, isAr } = useLocalized();
  const toast = useToast();

  const sch = useAsync(() => scholarshipService.get(id), [id]);
  const profile = useAsync(() => studentService.profile(), []);
  const docs = useAsync(() => studentService.documents(), []);
  const apps = useAsync(() => studentService.applications(), []);

  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  const s = sch.data;
  const p = profile.data;
  const match = useMemo(() => (s && p ? matchScore(p, s) : null), [s, p]);
  const application = (apps.data || []).find((a) => String(a.scholarshipId) === String(id));

  if (sch.loading || profile.loading) {
    return (
      <>
        <div className="card skeleton" style={{ height: 210, marginBlockEnd: 18 }} />
        <div className="det-layout">
          <div className="card skeleton" style={{ height: 480 }} />
          <div className="card skeleton" style={{ height: 360 }} />
        </div>
      </>
    );
  }

  if (!s) {
    return (
      <div className="card">
        <EmptyState
          icon={SearchX}
          title={t('details.notFound')}
          text={t('details.notFoundText')}
          action={<Button variant="outline" icon={ArrowLeft} to="/student/scholarships">{t('details.back')}</Button>}
        />
      </div>
    );
  }

  const list = (keys, ns) => keys.map((k) => tc(`${ns}.${k}`)).join(isAr ? '، ' : ', ');
  const requirement = {
    field: list(s.fields, 'fields'),
    gpa: t('details.minGpa', { gpa: s.minGpa }),
    level: list(s.levels, 'levels'),
    nationality: s.nationalities.includes('all') ? tc('countries.all') : list(s.nationalities, 'countries'),
    language: `${s.language.test} ${s.language.score}+`,
    country: tc(`countries.${s.country}`),
    funding: tc(`funding.${s.funding}`),
  };
  const yours = p && {
    field: tc(`fields.${p.field}`),
    gpa: `${p.gpa} / ${p.gpaScale}`,
    level: tc(`levels.${p.level}`),
    nationality: tc(`countries.${p.nationality}`),
    language: p.language ? `${p.language.test} ${p.language.score}` : '—',
    country: list(p.preferredCountries, 'countries'),
    funding: tc(`funding.${p.funding}`),
  };

  const docRows = Object.keys(REQUIRED_DOCS).map((type) => {
    const d = (docs.data || []).find((x) => x.type === type);
    const status = !d || d.status === 'missing' ? 'missing' : d.status;
    return { type, status };
  });
  const docsReady = docRows.filter((r) => r.status === 'approved' || r.status === 'underReview').length;

  const days = daysUntil(s.deadline);
  const timeline = [
    { key: 'opens', date: s.opens, done: daysUntil(s.opens) <= 0 },
    { key: 'deadline', date: s.deadline, done: days < 0 },
    { key: 'results', label: tc(`results.${s.results}`), done: s.results === 'completed' },
  ];
  const currentIdx = timeline.findIndex((x) => !x.done);

  const toggleSave = () => {
    setSaved((v) => !v);
    toast(saved ? t('details.unsaved') : t('details.saved'));
  };

  const requestGuidance = async () => {
    setSending(true);
    try {
      await studentService.requestService({ service: 'applicationAssistance', scholarshipId: s.id, notes });
      setRequested(true);
      setNotes('');
      toast(`${tc('toast.requestSent')} — ${loc(s, 'name')}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('details.title')}
        description={t('details.subtitle')}
        actions={<Button variant="ghost" icon={ArrowLeft} to="/student/scholarships" className="det-back">{t('details.back')}</Button>}
      />

      <section className="det-hero fade-up">
        <div className="det-hero-main">
          <div className="det-badges">
            <Badge tone={statusTone(s.status) || 'info'}>{tc(`status.${s.status}`)}</Badge>
            {application && <Badge tone="gold">{t('details.inProgressApp')}</Badge>}
          </div>
          <h2>{loc(s, 'name')}</h2>
          <p className="det-uni"><Building2 aria-hidden />{loc(s, 'university')}</p>
          <ul className="det-meta">
            <li><MapPin aria-hidden />{tc(`countries.${s.country}`)}</li>
            <li><GraduationCap aria-hidden />{list(s.levels, 'levels')}</li>
            <li><Wallet aria-hidden />{tc(`funding.${s.funding}`)}</li>
            <li><CalendarDays aria-hidden />{tc('time.deadline')}: {fmtDate(s.deadline)}</li>
          </ul>
          <div className="det-actions">
            <Button icon={MessageCircle} onClick={() => document.getElementById('det-guidance')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{tc('actions.requestGuidance')}</Button>
            <Button variant="outline" className="det-save" icon={saved ? BookmarkCheck : Bookmark} onClick={toggleSave} aria-pressed={saved}>
              {saved ? t('details.bookmarked') : t('details.bookmark')}
            </Button>
          </div>
        </div>
        {match && (
          <div className="det-score">
            <ProgressRing value={match.score} size={132} stroke={12} color={RING[match.level]} label={tc('match.match')} />
            <Badge tone={{ eligible: 'success', potential: 'warning', notSuitable: 'danger' }[match.level]}>{tc(`match.${match.level}`)}</Badge>
          </div>
        )}
      </section>

      <div className="det-layout">
        <div className="stack det-main">
          <Card title={t('details.overview')}>
            <p className="det-desc">{loc(s, 'description')}</p>
            <div className="det-facts">
              <div><small>{t('details.amount')}</small><b className="ltr">{s.amount}</b></div>
              <div><small>{t('details.level')}</small><b>{list(s.levels, 'levels')}</b></div>
              <div><small>{t('details.language')}</small><b className="ltr">{requirement.language}</b></div>
              <div><small>{t('details.minGpaLabel')}</small><b className="ltr">{s.minGpa} / 4.0</b></div>
            </div>
          </Card>

          {match && (
            <Card title={t('details.eligibility')} subtitle={t('details.eligibilitySub')} accent="gold">
              <ul className="crit-list">
                {Object.entries(WEIGHTS).map(([k, w]) => {
                  const part = match.parts[k];
                  const state = partState(part);
                  const Icon = PART_ICON[state];
                  const pts = Math.round(w * part);
                  return (
                    <li key={k} className={`crit ${state}`}>
                      <span className="crit-icon"><Icon aria-hidden /></span>
                      <div className="crit-body">
                        <div className="crit-top">
                          <b>{t(`details.criteria.${k}`)}</b>
                          <span className="crit-pts">{t('details.points', { pts: fmtNum(pts), max: fmtNum(w) })}</span>
                        </div>
                        <div className="crit-cmp">
                          <span><small>{t('details.required')}</small>{requirement[k]}</span>
                          <span><small>{t('details.yours')}</small>{yours[k]}</span>
                        </div>
                        <ProgressBar value={part * 100} navy={state === 'met'} />
                        <small className="crit-note">{t(`details.state.${state}`)}</small>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="crit-total">
                <span>{t('details.total')}</span>
                <b>{match.score}%</b>
                <Badge tone={{ eligible: 'success', potential: 'warning', notSuitable: 'danger' }[match.level]}>{tc(`match.${match.level}`)}</Badge>
              </div>
            </Card>
          )}

          <Card
            title={t('details.documents')}
            subtitle={t('details.documentsSub', { ready: fmtNum(docsReady), total: fmtNum(docRows.length) })}
            actions={<Button variant="ghost" size="sm" to="/student/documents">{tc('nav.documents')}</Button>}
          >
            {docs.loading ? (
              <div className="stack">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 12 }} />)}</div>
            ) : (
              <>
                <ProgressBar value={(docsReady / docRows.length) * 100} />
                <ul className="det-docs">
                  {docRows.map((r) => (
                    <li key={r.type}>
                      <FileText aria-hidden />
                      <span className="grow">{tc(`docTypes.${r.type}`)}</span>
                      <Badge tone={statusTone(r.status)}>{tc(`status.${r.status}`)}</Badge>
                      {(r.status === 'missing' || r.status === 'rejected') && (
                        <Link to="/student/documents" className="link">{tc('actions.upload')}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <aside className="stack det-aside">
          <Card title={t('details.timeline')} accent="navy">
            <ol className="tl">
              {timeline.map((x, i) => (
                <li key={x.key} className={x.done ? 'done' : i === currentIdx ? 'current' : ''}>
                  <span className="tl-dot">{x.done ? <CheckCircle2 aria-hidden /> : i === currentIdx ? <Clock aria-hidden /> : null}</span>
                  <div>
                    <b>{t(`details.dates.${x.key}`)}</b>
                    <small>{x.date ? fmtDate(x.date) : x.label}</small>
                  </div>
                </li>
              ))}
            </ol>
            {days >= 0 ? (
              <p className={`det-countdown${days <= 21 ? ' soon' : ''}`}><Clock aria-hidden />{tc('time.daysLeft', { count: days })}</p>
            ) : (
              <p className="det-countdown closed"><AlertTriangle aria-hidden />{t('details.closedNote')}</p>
            )}
          </Card>

          <Card title={t('details.guidanceTitle')} subtitle={t('details.guidanceSub')} accent="gold" id="det-guidance">
            {requested ? (
              <div className="det-sent">
                <CheckCircle2 aria-hidden />
                <b>{t('details.sentTitle')}</b>
                <small>{t('details.sentText')}</small>
                <Button variant="outline" size="sm" to="/student/services">{t('details.trackRequest')}</Button>
              </div>
            ) : (
              <div className="stack">
                <Field label={t('details.notesLabel')} hint={t('details.notesHint')}>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder={t('details.notesPlaceholder')} />
                </Field>
                <Button icon={Send} block onClick={requestGuidance} disabled={sending}>{sending ? t('details.sending') : tc('actions.requestGuidance')}</Button>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

