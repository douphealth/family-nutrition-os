import { useState } from 'react';
import { Check, Crosshair, Eye, ShieldCheck, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { BASKETBALL_SKILLS, BASKETBALL_VIDEO_COUNT, basketballSkill, type Bilingual, type VideoLevel } from '@/training/basketball-skills';
import { isSafeYouTubeWatchUrl } from '@/training/exercise-library';
import { EMPTY_TRAINING, saveTrainingSettings } from '@/training/store';
import { cn } from '@/lib/utils';

export function BasketballSkills({ profile }: { profile: { id: string; name: string } }) {
  const { pick } = useI18n();
  const settings = useStore(s => s.trainingSettings?.[profile.id] ?? EMPTY_TRAINING);
  const saved = basketballSkill(settings.basketballSkillFocus);
  const [selected, setSelected] = useState(saved?.id ?? 'handling');
  const skill = basketballSkill(selected) ?? BASKETBALL_SKILLS[0];
  const [note, setNote] = useState(typeof settings.basketballCoachNote === 'string' ? settings.basketballCoachNote : '');
  const [didSave, setDidSave] = useState(false);
  const [level, setLevel] = useState<'all' | VideoLevel>('all');
  const videos = skill.videos.filter(v => isSafeYouTubeWatchUrl(v.url) && (level === 'all' || v.level === level));
  const render = (value: Bilingual) => pick(value.el, value.en);
  return <section className="border-y py-6" aria-labelledby="basketball-skills-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase text-training">{profile.name} · Basketball lab</p><h2 id="basketball-skills-title" className="mt-2 text-2xl font-semibold">{pick('Μία δεξιότητα. Μία καθαρή βελτίωση.', 'One skill. One clear refinement.')}</h2></div>
      <span className="flex items-center gap-2 text-sm text-training"><Youtube className="size-4" />{pick(`${BASKETBALL_VIDEO_COUNT} βίντεο · βασικά & προχωρημένα`, `${BASKETBALL_VIDEO_COUNT} videos · foundation & advanced`)}</span>
    </div>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{pick('Οι δεξιότητες εντάσσονται στην προπόνηση της ομάδας με τον προπονητή. Δεν προσθέτουν νέες συνεδρίες, λεπτά ή άδεια εκτέλεσης. Τετάρτη: μόνο αποκατάσταση, χωρίς προπόνηση μπάλας.', 'Practice these skills within team training with your coach. They add no sessions, minutes or execution clearance. Wednesday remains recovery-only, without ball practice.')}</p>
    <div className="my-5 flex flex-wrap gap-2" role="group" aria-label={pick('Δεξιότητα μπάσκετ', 'Basketball skill')}>
      {BASKETBALL_SKILLS.map(item => <Button key={item.id} variant="outline" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={cn(selected === item.id && 'border-training bg-training-surface text-training')}><Crosshair className="size-4" />{render(item.title)}</Button>)}
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <h3 className="text-xl font-semibold">{render(skill.title)}</h3><p className="mt-2 text-sm text-muted-foreground">{render(skill.goal)}</p>
        <ol className="mt-4 space-y-3">{skill.cues.map((cue, i) => <li key={cue.en} className="flex items-start gap-3 text-sm leading-relaxed"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-training-surface font-mono text-training">{i + 1}</span><span>{render(cue)}</span></li>)}</ol>
        <div className="mt-5 border-l-2 border-training pl-4"><h4 className="text-sm font-semibold">{pick('Διόρθωση πριν από δυσκολία', 'Correct before progressing')}</h4><p className="mt-2 text-sm leading-relaxed">{render(skill.correction)}</p></div>
        <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2"><div><h4 className="text-sm font-semibold">{pick('Απλούστερα', 'Simplify')}</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{render(skill.easier)}</p></div><div><h4 className="text-sm font-semibold">{pick('Επόμενο βήμα με προπονητή', 'Next step with your coach')}</h4><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{render(skill.next)}</p></div></div>
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed"><Eye className="mt-1 size-4 shrink-0 text-training" />{render(skill.observe)}</p>
      </div>
      <aside className="min-w-0 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <p className="mb-3 text-xs text-muted-foreground">{render(skill.equipment)}</p>
        <h4 className="font-semibold">{pick('Δες την τεχνική', 'Watch the technique')}</h4>
        <div className="mt-3 flex gap-1 rounded-full border p-1" role="group" aria-label={pick('Επίπεδο βίντεο', 'Video level')}>{(['all', 'foundation', 'advanced'] as const).map(l => <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className={cn('flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors', level === l ? 'bg-training text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{l === 'all' ? pick('Όλα', 'All') : l === 'foundation' ? pick('Βάση', 'Foundation') : pick('Προχωρημένα', 'Advanced')}</button>)}</div>
        <div className="mt-2 divide-y">{videos.length === 0 && <p className="py-3 text-sm text-muted-foreground">{pick('Δεν υπάρχει βίντεο αυτού του επιπέδου εδώ.', 'No video at this level for this skill.')}</p>}{videos.map(v => <div key={v.url} className="py-3"><div className="flex items-center gap-2"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', v.level === 'advanced' ? 'bg-training text-primary-foreground' : 'bg-training-surface text-training')}>{v.level === 'advanced' ? pick('Προχωρημένο', 'Advanced') : pick('Βάση', 'Foundation')}</span><span className="truncate text-xs text-muted-foreground">{v.channel}</span></div><p className="mt-1 text-sm leading-relaxed">{v.title}</p><Button asChild variant="outline" size="sm" className="mt-2"><a href={v.url} target="_blank" rel="noopener noreferrer"><Youtube />{pick('Άνοιγμα YouTube', 'Open YouTube')}</a></Button></div>)}</div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{pick('Τα προχωρημένα βίντεο ξεκινούν μόνο όταν η βασική εκδοχή γίνεται σωστά, και μόνο με έγκριση προπονητή.', 'Start advanced videos only once the foundation version is clean, and only with your coach’s approval.')}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{pick('Jr. NBA · BreakthroughBBall · NBA ομάδες · Τίτλοι, κανάλι και διαθεσιμότητα ελέγχθηκαν 15/11/2026. Όχι πλήρης έλεγχος περιεχομένου. Τα βίντεο είναι παραδείγματα, όχι προσωπική δοσολογία· μην αντιγράφεις αυτόματα επαναλήψεις ή ένταση.', 'Jr. NBA · BreakthroughBBall · NBA teams · Titles, channel and availability checked 15/11/2026. Not a full content review. Videos are examples, not a personal dose; do not automatically copy repetitions or intensity.')}</p>
      </aside>
    </div>
    <form className="mt-6 border-t pt-5" onSubmit={e => { e.preventDefault(); saveTrainingSettings(profile.id, { basketballSkillFocus: skill.id, basketballCoachNote: note.trim() }, profile); setDidSave(true); }}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-training" />{pick('Η προτεραιότητα με τον προπονητή', 'Your priority with the coach')}</h3>{saved && <span className="text-sm text-training">{pick('Αποθηκευμένο:', 'Saved:')} {render(saved.title)}</span>}</div>
      <label htmlFor="basketball-coach-note" className="mt-3 block text-sm">{pick('Μία συγκεκριμένη παρατήρηση ή ερώτηση για τον προπονητή', 'One specific observation or question for your coach')}</label>
      <Textarea id="basketball-coach-note" value={note} maxLength={1000} rows={3} onChange={e => { setNote(e.target.value); setDidSave(false); }} className="mt-2" />
      <div className="mt-3 flex flex-wrap items-center gap-3"><Button type="submit" variant="outline"><Check />{pick('Αποθήκευση προτεραιότητας', 'Save priority')}</Button><span className="text-xs text-muted-foreground" role="status">{didSave ? pick('Αποθηκεύτηκε σε αυτή τη συσκευή.', 'Saved on this device.') : pick('Η επιλογή δεν αλλάζει το πρόγραμμα ή τον καταγεγραμμένο φόρτο.', 'Your choice does not change the schedule or recorded workload.')}</span></div>
    </form>
  </section>;
}

export function BasketballSessionFocus({ id, note }: { id: unknown; note?: unknown }) {
  const { pick } = useI18n();
  const skill = basketballSkill(id);
  if (!skill) return null;
  return <div className="my-5 border-l-2 border-training pl-4"><h3 className="text-sm font-semibold">{pick('Προτεραιότητα στην επόμενη ομαδική προπόνηση', 'Priority for your next team practice')}: {pick(skill.title.el, skill.title.en)}</h3><p className="mt-2 text-sm">{pick(skill.correction.el, skill.correction.en)}</p>{typeof note === 'string' && note.trim() && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{note}</p>}<p className="mt-2 text-xs text-muted-foreground">{pick('Σήμερα ακολουθείς μόνο τα βήματα της συνεδρίας παρακάτω. Δεν προσθέτεις ασκήσεις μπάσκετ.', 'Today follow only the session steps below. Do not add basketball drills.')}</p></div>;
}